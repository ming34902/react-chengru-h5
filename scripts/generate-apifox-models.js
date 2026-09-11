#!/usr/bin/env node
/**
 * 从 src/types/index.ts 生成 Apifox 可导入的 OpenAPI 3.0 数据模型文件。
 *
 * 使用方式：npm run generate:apifox
 * 输出文件：apifox-models.json（位于项目根目录）
 *
 * Apifox 导入方式：项目设置 → 导入数据 → openApi/swagger → 选择 apifox-models.json
 * （interface 会生成对象数据模型，type 联合类型会生成枚举数据模型，
 *   JSDoc 注释会生成模型 / 字段描述）
 */
const fs = require('fs')
const path = require('path')
const { buildSchemasFromTypes } = require('./lib/openapi-schemas')

const ROOT = path.resolve(__dirname, '..')
const OUT_FILE = path.join(ROOT, 'apifox-models.json')

const { schemas, enumNames, interfaceNames, missingRefs } = buildSchemasFromTypes()

const output = {
  openapi: '3.0.3',
  info: {
    title: 'FriendMeal 朋友餐桌 · 数据模型',
    description: '由 src/types/index.ts 自动生成，用于导入 Apifox 生成数据模型。',
    version: '1.0.0'
  },
  paths: {},
  components: {
    schemas
  }
}

fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2), 'utf8')

console.log(`✔ 已生成 ${OUT_FILE}`)
console.log(`  枚举模型：${Array.from(enumNames).join('、') || '无'}`)
console.log(`  对象模型：${Array.from(interfaceNames).join('、') || '无'}`)
if (missingRefs.size > 0) {
  console.error(`✘ 存在无法解析的 $ref：${Array.from(missingRefs).join('、')}`)
  process.exit(1)
}
console.log('✔ 所有 $ref 引用校验通过')
