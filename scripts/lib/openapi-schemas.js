#!/usr/bin/env node
/**
 * 公共模块：将 src/types/index.ts 中的类型声明转换为 OpenAPI 3.0 的
 * components.schemas 定义，供 generate-apifox-models.js 与
 * generate-apifox-apis.js 复用。
 *
 * - type 联合类型 / 单字符串字面量  → 枚举 Schema
 * - interface                        → 对象 Schema（extends 生成 allOf）
 * - JSDoc 注释                       → 模型 / 字段 description
 */
const ts = require('typescript')
const fs = require('fs')
const path = require('path')

/** 读取节点上的 JSDoc 注释，作为模型 / 字段描述 */
function commentOf(node) {
  const jsDocs = ts.getJSDocCommentsAndTags(node)
  if (!jsDocs || jsDocs.length === 0) {
    return undefined
  }

  const doc = jsDocs[0]
  if (!ts.isJSDoc(doc) || doc.comment == null) {
    return undefined
  }

  if (typeof doc.comment === 'string') {
    return doc.comment
  }

  return Array.from(doc.comment)
    .filter((part) => typeof part === 'string')
    .join('')
    .trim() || undefined
}

/** 若节点是「纯字符串字面量联合类型」，返回字符串数组；否则返回 null */
function stringLiteralsOf(node) {
  if (!node || !ts.isUnionTypeNode(node)) {
    return null
  }

  const literals = []
  for (const type of node.types) {
    if (ts.isLiteralTypeNode(type) && type.literal && ts.isStringLiteral(type.literal)) {
      literals.push(type.literal.text)
    } else {
      return null
    }
  }
  return literals.length > 0 ? literals : null
}

/** 提取字符串字面量枚举值：支持 union（多值）与单字面量（如 OrderStatus = '已完成'） */
function literalEnumValuesOf(node) {
  const literals = stringLiteralsOf(node)
  if (literals) {
    return literals
  }

  if (node && ts.isLiteralTypeNode(node) && node.literal && ts.isStringLiteral(node.literal)) {
    return [node.literal.text]
  }

  return null
}

/** 将 TypeScript 类型节点转换为 JSON Schema */
function buildTypeSchema(node) {
  if (!node) {
    return { type: 'string' }
  }

  if (ts.isTypeReferenceNode(node)) {
    // 引用其他已声明类型（枚举 / 接口）
    const name = node.typeName.getText()
    return { $ref: `#/components/schemas/${name}` }
  }

  if (ts.isArrayTypeNode(node)) {
    return { type: 'array', items: buildTypeSchema(node.elementType) }
  }

  if (ts.isLiteralTypeNode(node) && node.literal && ts.isStringLiteral(node.literal)) {
    return { type: 'string', enum: [node.literal.text] }
  }

  switch (node.kind) {
    case ts.SyntaxKind.NumberKeyword:
      return { type: 'number', format: 'double' }
    case ts.SyntaxKind.StringKeyword:
      return { type: 'string' }
    case ts.SyntaxKind.BooleanKeyword:
      return { type: 'boolean' }
  }

  const literals = stringLiteralsOf(node)
  if (literals) {
    return { type: 'string', enum: literals }
  }

  return { type: 'string' }
}

/** 将 interface 声明转换为对象 Schema（extends 生成 allOf 组合） */
function buildInterfaceSchema(node) {
  const description = commentOf(node)
  const allOf = []

  for (const heritage of node.heritageClauses || []) {
    if (heritage.token !== ts.SyntaxKind.ExtendsKeyword) {
      continue
    }
    for (const type of heritage.types) {
      // extends 子句中的节点是 ExpressionWithTypeArguments，取其基类名生成 $ref
      const baseName = type.expression.getText()
      allOf.push({ $ref: `#/components/schemas/${baseName}` })
    }
  }

  const properties = {}
  const required = []

  for (const member of node.members) {
    if (!ts.isPropertySignature(member)) {
      continue
    }

    const name = member.name.getText()
    const propSchema = buildTypeSchema(member.type)

    // id 后缀字段（id / dishId 等）使用 integer 类型，保证 Apifox 中主键语义
    if (/Id$/i.test(name) && propSchema.type === 'number') {
      propSchema.type = 'integer'
      delete propSchema.format
    }

    const propDescription = commentOf(member)
    if (propDescription) {
      propSchema.description = propDescription
    }

    if (!member.questionToken) {
      required.push(name)
    }

    properties[name] = propSchema
  }

  const selfObject = { type: 'object', properties }
  if (required.length > 0) {
    selfObject.required = required
  }

  if (allOf.length > 0) {
    // interface X extends Base => allOf: [Base, 自身字段]
    const schema = { allOf: [...allOf, selfObject] }
    if (description) {
      schema.description = description
    }
    return schema
  }

  if (description) {
    selfObject.description = description
  }
  return selfObject
}

/**
 * 解析 src/types/index.ts，生成 components.schemas。
 *
 * @returns {{ schemas: object, enumNames: Set<string>, interfaceNames: Set<string>, missingRefs: Set<string> }}
 */
function buildSchemasFromTypes() {
  const typesFile = path.resolve(__dirname, '..', '..', 'src', 'types', 'index.ts')
  const sourceText = fs.readFileSync(typesFile, 'utf8')
  const sourceFile = ts.createSourceFile('types.ts', sourceText, ts.ScriptTarget.Latest, true)

  const schemas = {}
  const enumNames = new Set()
  const interfaceNames = new Set()

  for (const statement of sourceFile.statements) {
    if (ts.isTypeAliasDeclaration(statement)) {
      const literals = literalEnumValuesOf(statement.type)
      if (!literals) {
        continue
      }

      const schema = { type: 'string', enum: literals }
      const description = commentOf(statement)
      if (description) {
        schema.description = description
      }

      schemas[statement.name.text] = schema
      enumNames.add(statement.name.text)
    } else if (ts.isInterfaceDeclaration(statement)) {
      schemas[statement.name.text] = buildInterfaceSchema(statement)
      interfaceNames.add(statement.name.text)
    }
  }

  // 校验：所有 $ref 都能指向已生成的 schema
  const refPattern = /^#\/components\/schemas\/(.+)$/
  const missingRefs = new Set()
  for (const schema of Object.values(schemas)) {
    ;(function walk(value) {
      if (!value || typeof value !== 'object') {
        return
      }
      if (Array.isArray(value)) {
        value.forEach(walk)
        return
      }
      if (typeof value.$ref === 'string') {
        const match = value.$ref.match(refPattern)
        if (match && !schemas[match[1]]) {
          missingRefs.add(match[1])
        }
      }
      Object.values(value).forEach(walk)
    })(schema)
  }

  return { schemas, enumNames, interfaceNames, missingRefs }
}

module.exports = { buildSchemasFromTypes }
