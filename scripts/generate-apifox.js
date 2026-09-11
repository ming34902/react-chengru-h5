#!/usr/bin/env node
/**
 * 根据 src/types/api.ts 生成 Apifox 可导入的接口文档（OpenAPI 3.0.3）。
 *
 * 使用方式：
 *   npm run generate:apifox        # 生成 / 覆盖 docs/apifox.json
 *   npm run generate:apifox:check  # 只校验（与代码不一致时退出码 1，可用于 CI）
 *
 * 生成内容：
 * - components.schemas：由 src/types/api.ts 的 interface / type 声明生成
 *     · interface            → 对象模型（extends 的基类成员会被拍平，JSDoc 作为字段描述）
 *     · 字符串字面量联合类型 → 枚举模型（如 OrderStatus）
 *     · 泛型 interface       → 跳过（ApiResponse / PageResult 由脚本按具体类型包装成
 *                              XxxResponse / XxxPage，例如 ProductResponse、OrderPage）
 *     · `string | number` 等联合类型 → anyOf
 * - paths：接口定义来自下方 PATHS 表（本文件内维护，只使用 GET / POST）
 *
 * 约定（与前端实现一致）：
 * - 统一返回 { code, message, data }，code = 0 表示成功；
 * - 分页统一为 { records, total, pageNumber, pageSize }；
 * - 购物车不提供接口，由前端 localStorage 维护（见 src/utils/cartStorage.ts 与 CartItem 模型）。
 *
 * 字段示例：字段 JSDoc 中写 `@example 值` 即可生成 example（Apifox 云 mock 会据此生成数据）。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
/** 类型定义入口（所有接口模型都在这里） */
const ENTRY_FILE = path.join(ROOT, 'src/types/api.ts');
/** 生成结果 */
const OUT_FILE = path.join(ROOT, 'docs/apifox.json');
/** 只校验不写入 */
const CHECK_ONLY = process.argv.includes('--check');

// ============================================================================
// 2. 类型信息收集（声明表 + JSDoc 描述 / 示例）
// ============================================================================

/** 声明表：类型名 → { node, fileName }（同名以先声明者为准） */
function collectDeclarations(files) {
    const declarations = new Map();

    for (const [fileName, sourceFile] of files) {
        for (const statement of sourceFile.statements) {
            if (!ts.isInterfaceDeclaration(statement) && !ts.isTypeAliasDeclaration(statement)) {
                continue;
            }
            const name = statement.name.text;
            if (!declarations.has(name)) declarations.set(name, { node: statement, fileName });
        }
    }

    return declarations;
}

/** JSDoc 注释内容 → 文本 */
function textOfComment(comment) {
    if (comment == null) return undefined;
    if (typeof comment === 'string') return comment.trim() || undefined;

    return (
        Array.from(comment)
            .filter((part) => typeof part === 'string')
            .join('')
            .trim() || undefined
    );
}

/** 读取节点上的 JSDoc 描述文本 */
function descriptionOf(node) {
    const docs = ts.getJSDocCommentsAndTags(node);
    const doc = docs[0];
    if (!doc || !ts.isJSDoc(doc)) return undefined;

    return textOfComment(doc.comment);
}

/** 读取 JSDoc 中 @example 的值 */
function exampleOf(node) {
    for (const tag of ts.getJSDocTags(node)) {
        if (tag.tagName.text === 'example') return textOfComment(tag.comment);
    }
    return undefined;
}

/** 读取 JSDoc 中 @deprecated 的说明（返回 true 表示只标记不写说明） */
function deprecatedOf(node) {
    for (const tag of ts.getJSDocTags(node)) {
        if (tag.tagName.text === 'deprecated') return textOfComment(tag.comment) ?? true;
    }
    return undefined;
}

/** 类型名 → Schema 名（ProductModel → Product，让 Apifox 中的模型名更简洁） */
function schemaName(typeName) {
    return typeName.replace(/Model$/, '');
}

/** 是否为 null / undefined 类型 */
function isNullish(node) {
    if (node.kind === ts.SyntaxKind.NullKeyword || node.kind === ts.SyntaxKind.UndefinedKeyword) {
        return true;
    }
    return ts.isLiteralTypeNode(node) && node.literal.kind === ts.SyntaxKind.NullKeyword;
}

/** 纯字符串字面量联合类型 → 枚举值数组，否则返回 null */
function stringLiteralsOf(node) {
    if (!node || !ts.isUnionTypeNode(node)) return null;

    const literals = [];
    for (const type of node.types) {
        if (ts.isLiteralTypeNode(type) && ts.isStringLiteral(type.literal)) {
            literals.push(type.literal.text);
        } else {
            return null;
        }
    }
    return literals.length > 0 ? literals : null;
}

/** 联合类型 → Schema（字符串字面量 → 枚举；含 null → nullable；多类型 → anyOf） */
function buildUnionSchema(node, declarations) {
    const literals = stringLiteralsOf(node);
    if (literals) return { type: 'string', enum: literals };

    const nullable = node.types.some(isNullish);
    const types = node.types.filter((type) => !isNullish(type));
    if (types.length === 0) return { nullable: true };

    const schema =
        types.length === 1
            ? buildTypeSchema(types[0], declarations)
            : { anyOf: types.map((type) => buildTypeSchema(type, declarations)) };

    if (nullable) schema.nullable = true;
    return schema;
}

/** TypeScript 类型节点 → JSON Schema */
function buildTypeSchema(node, declarations) {
    if (!node) return {};

    switch (node.kind) {
        case ts.SyntaxKind.StringKeyword:
            return { type: 'string' };
        case ts.SyntaxKind.NumberKeyword:
            return { type: 'number', format: 'float' };
        case ts.SyntaxKind.BooleanKeyword:
            return { type: 'boolean' };
        case ts.SyntaxKind.AnyKeyword:
        case ts.SyntaxKind.UnknownKeyword:
            return {};
        case ts.SyntaxKind.NullKeyword:
        case ts.SyntaxKind.UndefinedKeyword:
            return { nullable: true };
        default:
            break;
    }

    if (ts.isArrayTypeNode(node)) {
        return { type: 'array', items: buildTypeSchema(node.elementType, declarations) };
    }

    if (ts.isLiteralTypeNode(node)) {
        const { literal } = node;
        if (ts.isStringLiteral(literal)) return { type: 'string', enum: [literal.text] };
        if (ts.isNumericLiteral(literal)) return { type: 'number', enum: [Number(literal.text)] };
        if (literal.kind === ts.SyntaxKind.TrueKeyword) return { type: 'boolean', enum: [true] };
        if (literal.kind === ts.SyntaxKind.FalseKeyword) return { type: 'boolean', enum: [false] };
        return { nullable: true };
    }

    if (ts.isUnionTypeNode(node)) {
        return buildUnionSchema(node, declarations);
    }

    if (ts.isTypeLiteralNode(node)) {
        return buildObjectSchema(node.members, declarations);
    }

    if (ts.isTypeReferenceNode(node)) {
        const name = node.typeName.getText();
        const typeArguments = node.typeArguments ?? [];

        if ((name === 'Array' || name === 'ReadonlyArray') && typeArguments.length > 0) {
            return { type: 'array', items: buildTypeSchema(typeArguments[0], declarations) };
        }
        if (name === 'Record' && typeArguments.length > 1) {
            return {
                type: 'object',
                additionalProperties: buildTypeSchema(typeArguments[1], declarations),
            };
        }
        if (name === 'Date') return { type: 'string', format: 'date-time' };

        return { $ref: `#/components/schemas/${schemaName(name)}` };
    }

    return {};
}

/** @example 文本 → 与字段类型匹配的值 */
function coerceExample(text, schema) {
    if (schema.type === 'number' || schema.type === 'integer') return Number(text);
    if (schema.type === 'boolean') return text === 'true';
    if (schema.type === 'array' || schema.type === 'object') {
        try {
            return JSON.parse(text);
        } catch {
            return schema.type === 'array' ? [text] : {};
        }
    }
    return text;
}

/** 属性签名 → 字段 Schema（JSDoc 描述 / @example / @deprecated / 主键语义） */
function buildPropertySchema(member, declarations) {
    const schema = buildTypeSchema(member.type, declarations);
    const deprecated = deprecatedOf(member);

    // 描述优先取 JSDoc 正文，其次取 @deprecated 的说明
    const description =
        descriptionOf(member) ?? (typeof deprecated === 'string' ? deprecated : undefined);
    if (description) schema.description = description;
    if (deprecated !== undefined) schema.deprecated = true;

    const example = exampleOf(member);
    if (example !== undefined) schema.example = coerceExample(example, schema);

    // 主键语义：xxxId 且为数字时用 integer（Apifox 中更易识别为自增主键）
    if (/Id$/.test(member.name.getText()) && schema.type === 'number') {
        schema.type = 'integer';
        delete schema.format;
    }

    return schema;
}

/** 成员集合 → 对象 Schema */
function buildObjectSchema(members, declarations) {
    const properties = {};
    const required = [];

    for (const member of members) {
        if (!ts.isPropertySignature(member)) continue;

        const name = member.name.getText();
        properties[name] = buildPropertySchema(member, declarations);
        if (!member.questionToken) required.push(name);
    }

    const schema = { type: 'object', properties };
    if (required.length > 0) schema.required = required;
    return schema;
}

/**
 * 递归收集 interface 成员：extends 的基类成员在前、子类覆盖同名字段，
 * 索引签名（[key: string]: any）忽略。
 */
function collectInterfaceMembers(declaration, declarations, seen = new Set()) {
    const members = new Map();

    for (const heritage of declaration.heritageClauses || []) {
        for (const type of heritage.types) {
            const baseName = type.expression.getText();
            const base = declarations.get(baseName);
            if (!base || seen.has(baseName) || !ts.isInterfaceDeclaration(base.node)) continue;

            seen.add(baseName);
            for (const [key, member] of collectInterfaceMembers(base.node, declarations, seen)) {
                members.set(key, member);
            }
        }
    }

    for (const member of declaration.members) {
        if (ts.isPropertySignature(member)) members.set(member.name.getText(), member);
    }

    return members;
}

/**
 * 生成模型 Schema
 *
 * 只输出入口文件（src/types/api.ts）里声明的类型；其他文件（如 src/types/weda.ts
 * 的 ProductRecord）仅作为 extends 基类参与「拍平」，不会出现在文档里。
 */
function buildModelSchemas(files) {
    const declarations = collectDeclarations(files);
    const schemas = {};
    const models = [];
    const enums = [];
    const skipped = [];

    for (const [name, { node, fileName }] of declarations) {
        if (fileName !== ENTRY_FILE) continue;

        // type 别名：目前只有字符串字面量联合类型（枚举），如 OrderStatus
        if (ts.isTypeAliasDeclaration(node)) {
            const literals = stringLiteralsOf(node.type);
            if (!literals) {
                skipped.push(`${name}（非字符串字面量联合类型）`);
                continue;
            }

            const schema = { type: 'string', enum: literals };
            const description = descriptionOf(node);
            if (description) schema.description = description;

            schemas[schemaName(name)] = schema;
            enums.push(schemaName(name));
            continue;
        }

        // 泛型 interface（ApiResponse<T> / PageResult<T>）由响应包装按具体类型生成
        if (node.typeParameters?.length) {
            skipped.push(`${name}（泛型，按具体类型生成响应模型）`);
            continue;
        }

        const members = [...collectInterfaceMembers(node, declarations).values()];
        const schema = buildObjectSchema(members, declarations);
        const description = descriptionOf(node);
        if (description) schema.description = description;

        schemas[schemaName(name)] = schema;
        models.push(schemaName(name));
    }

    return { schemas, models, enums, skipped, declarations };
}

// ============================================================================
// 3. 响应模型（统一响应结构 { code, message, data } + 分页结构）
// ============================================================================

/** $ref 简写 */
const ref = (name) => ({ $ref: `#/components/schemas/${name}` });

/** 分页结构 { records, total, pageNumber, pageSize } */
function pageOf(modelName) {
    return {
        type: 'object',
        description: `${modelName} 分页结构`,
        properties: {
            records: { type: 'array', items: ref(modelName) },
            total: { type: 'integer', description: '总条数' },
            pageNumber: { type: 'integer', description: '页码（从 1 开始）' },
            pageSize: { type: 'integer', description: '每页条数' },
        },
    };
}

/** 统一响应结构 { code, message, data } */
function envelope(dataSchema, description) {
    return {
        type: 'object',
        description,
        properties: {
            code: { type: 'integer', description: '业务状态码，0 表示成功', example: 0 },
            message: { type: 'string', description: '提示信息', example: 'ok' },
            data: dataSchema,
        },
    };
}

/** 由脚本额外生成的响应模型（模型名 → data 结构 + 说明） */
const RESPONSE_SCHEMAS = {
    ProductPage: { data: pageOf('Product'), description: '商品分页结构' },
    ProductResponse: { data: ref('Product'), description: '商品详情响应' },
    ProductListResponse: { data: ref('ProductPage'), description: '商品列表响应' },
    LoginResponse: { data: ref('LoginResult'), description: '登录 / 注册响应' },
    UserResponse: { data: ref('User'), description: '用户相关接口的统一响应' },
    OrderPage: { data: pageOf('Order'), description: '订单分页结构' },
    OrderResponse: { data: ref('Order'), description: '订单详情 / 创建 / 支付 / 状态更新响应' },
    OrderListResponse: { data: ref('OrderPage'), description: '订单列表响应' },
    RemoveResponse: { data: ref('RemoveResult'), description: '删除操作响应' },
};

// ============================================================================
// 4. 接口定义（只使用 GET / POST）
// ============================================================================

const TAGS = [
    { name: '商品', description: '商品列表 / 商品详情' },
    { name: '认证', description: '登录 / 注册' },
    { name: '用户', description: '创建用户 / 获取用户信息（个人中心）' },
    { name: '订单', description: '订单创建 / 订单查询 / 订单支付 / 状态更新 / 删除' },
    {
        name: '购物车',
        description: '购物车不提供接口，由前端 localStorage 维护，仅保留数据模型 CartItem',
    },
];

/** query 参数 */
function query(name, schema, description) {
    return { name, in: 'query', required: false, description, schema };
}

/** 必填 query 参数 */
function requiredQuery(name, schema, description) {
    return { name, in: 'query', required: true, description, schema };
}

/** JSON 请求体 */
function jsonBody(refName) {
    return {
        required: true,
        content: { 'application/json': { schema: ref(refName) } },
    };
}

/** 成功响应 */
function ok(refName, description = '成功') {
    return {
        200: {
            description,
            content: { 'application/json': { schema: ref(refName) } },
        },
    };
}

/** 只保留 GET / POST 两种方法 */
const ALLOWED_METHODS = ['get', 'post'];

/** 接口表：路径 / 入参 / 出参与本地 mock（src/mock/server.ts）完全一致 */
const PATHS = {
    // ------------------------------ 商品 ------------------------------
    '/products': {
        get: {
            tags: ['商品'],
            summary: '商品列表',
            description: '支持分类、关键字、推荐 / 上架筛选、排序与分页',
            operationId: 'getProducts',
            parameters: [
                query(
                    'category',
                    { type: 'string', default: 'all' },
                    '分类 id：clothing / mens / beauty / digital / home / food / sports / books；all 或空表示全部',
                ),
                query('keyword', { type: 'string' }, '商品名称关键字（模糊匹配）'),
                query(
                    'sort',
                    {
                        type: 'string',
                        enum: ['recommended', 'sales', 'price_asc', 'price_desc', 'newest'],
                        default: 'recommended',
                    },
                    '排序方式',
                ),
                query('isFeatured', { type: 'boolean' }, '仅看推荐商品'),
                query('isOnSale', { type: 'boolean' }, '仅看上架商品'),
                query('pageNumber', { type: 'integer', default: 1 }, '页码，从 1 开始'),
                query('pageSize', { type: 'integer', default: 12 }, '每页条数'),
            ],
            responses: ok('ProductListResponse'),
        },
    },
    '/products/detail': {
        get: {
            tags: ['商品'],
            summary: '商品详情',
            operationId: 'getProductDetail',
            parameters: [requiredQuery('id', { type: 'string', example: 'p_1' }, '商品 id')],
            responses: ok('ProductResponse'),
        },
    },

    // ------------------------------ 认证 ------------------------------
    '/auth/login': {
        post: {
            tags: ['认证'],
            summary: '登录',
            description:
                '登录成功返回 token（本地 mock 返回 mock-token-xxx）与用户信息（含收藏列表）',
            operationId: 'postAuthLogin',
            requestBody: jsonBody('LoginRequest'),
            responses: ok('LoginResponse'),
        },
    },
    '/auth/register': {
        post: {
            tags: ['认证'],
            summary: '注册（注册成功即登录）',
            operationId: 'postAuthRegister',
            requestBody: jsonBody('RegisterRequest'),
            responses: ok('LoginResponse', '成功（新用户默认赠送 100 积分 + 1 张优惠券）'),
        },
    },

    // ------------------------------ 用户 ------------------------------
    '/user/create': {
        post: {
            tags: ['用户'],
            summary: '创建用户',
            description: '手机号已存在时返回错误码；创建成功后默认昵称为「用户 + 手机号后四位」',
            operationId: 'postUserCreate',
            requestBody: jsonBody('CreateUserRequest'),
            responses: ok('UserResponse'),
        },
    },
    '/user/info': {
        get: {
            tags: ['用户'],
            summary: '获取用户信息（个人中心）',
            description:
                '返回昵称、头像、会员等级、积分、优惠券、足迹、收藏商品列表；未命中时返回错误码 1005',
            operationId: 'getUserInfo',
            parameters: [
                query(
                    'id',
                    { type: 'string' },
                    '用户 id（与 phone 二选一，都不传时按请求头 Authorization 中的 token 识别）',
                ),
                query('phone', { type: 'string', example: '13800000000' }, '手机号'),
            ],
            responses: ok('UserResponse'),
        },
    },
    '/user/update': {
        post: {
            tags: ['用户'],
            summary: '更新用户信息',
            description: '更新昵称 / 头像 / 收藏商品列表（collection 传入时整体覆盖）',
            operationId: 'postUserUpdate',
            requestBody: jsonBody('UpdateUserRequest'),
            responses: ok('UserResponse'),
        },
    },

    // ------------------------------ 订单 ------------------------------
    '/orders/create': {
        post: {
            tags: ['订单'],
            summary: '订单创建',
            description:
                '根据所选商品创建订单，返回订单详情；运费规则：商品总额 ≥ 99 免运费，否则 10 元',
            operationId: 'postOrdersCreate',
            requestBody: jsonBody('OrderCreateRequest'),
            responses: ok('OrderResponse'),
        },
    },
    '/orders': {
        get: {
            tags: ['订单'],
            summary: '订单查询（列表）',
            description: '按用户手机号 / 订单状态查询，按下单时间倒序',
            operationId: 'getOrders',
            parameters: [
                query('userPhone', { type: 'string', example: '13800000000' }, '下单用户手机号'),
                query(
                    'status',
                    {
                        type: 'string',
                        enum: ['all', 'pending', 'paid', 'shipped', 'completed', 'cancelled'],
                        default: 'all',
                    },
                    '订单状态，all 或空表示全部',
                ),
                query('pageNumber', { type: 'integer', default: 1 }, '页码，从 1 开始'),
                query('pageSize', { type: 'integer', default: 20 }, '每页条数'),
            ],
            responses: ok('OrderListResponse'),
        },
    },
    '/orders/detail': {
        get: {
            tags: ['订单'],
            summary: '订单查询（详情）',
            operationId: 'getOrderDetail',
            parameters: [
                requiredQuery(
                    'orderNo',
                    { type: 'string', example: 'SO202408200001' },
                    '订单号（也支持传订单 id）',
                ),
            ],
            responses: ok('OrderResponse'),
        },
    },
    '/orders/pay': {
        post: {
            tags: ['订单'],
            summary: '订单支付',
            description: '支付成功后订单状态变为 paid，并写入 payTime（本地 mock 默认微信支付）',
            operationId: 'postOrdersPay',
            requestBody: jsonBody('OrderPayRequest'),
            responses: ok('OrderResponse'),
        },
    },
    '/orders/update-status': {
        post: {
            tags: ['订单'],
            summary: '更新订单状态（取消 / 确认收货等）',
            description:
                'status = cancelled 取消订单；status = completed 确认收货（写入 receiveTime）',
            operationId: 'postOrdersUpdateStatus',
            requestBody: jsonBody('OrderStatusRequest'),
            responses: ok('OrderResponse'),
        },
    },
    '/orders/remove': {
        post: {
            tags: ['订单'],
            summary: '删除订单',
            operationId: 'postOrdersRemove',
            requestBody: jsonBody('OrderRemoveRequest'),
            responses: ok('RemoveResponse'),
        },
    },
};

// ============================================================================
// 5. 文档信息 / 校验 / 输出
// ============================================================================

/** 文档说明（Apifox 导入后可见） */
const INFO = {
    title: '商城 H5 接口（商品 / 用户 / 订单）',
    version: '1.0.0',
    description: [
        'React H5 商城的接口定义，可直接导入 Apifox（导入 → OpenAPI / Swagger → 选择本文件）。',
        '',
        '约定：',
        '1. 接口只使用 GET / POST：查询用 GET（参数放 query），写操作用 POST（参数放 body）；',
        '2. 统一返回结构 { code, message, data }，code = 0 表示成功；',
        '3. 分页统一为 { records, total, pageNumber, pageSize }；',
        '4. 购物车不提供接口：购物车流程由前端 localStorage 维护（数据模型见 CartItem），',
        '   前端本地 mock 位于 src/mock（server.ts + db.ts），接口路径与本地 mock 完全一致，',
        '   把前端 .env 的 VITE_USE_MOCK 置为 false、VITE_GLOB_API_URL 指向 Apifox 云 mock 地址即可替换；',
        '5. 演示账号：用户名 13800000000，密码 123456。',
        '',
        '本文件由 npm run generate:apifox（scripts/generate-apifox.js）根据 src/types/api.ts 自动生成，请勿手动修改。',
    ].join('\n'),
};

/** 服务器地址：本地 mock 与 Apifox 云 mock */
const SERVERS = [
    { url: '/api', description: '本地 mock-api（src/mock，开发环境由 Vite 代理 /api）' },
    {
        url: 'https://mock.apifox.com/m1/0000000-0-default',
        description: 'Apifox 云 mock（导入后替换为自己项目的 mock 地址）',
    },
];

/** 收集文档中所有 $ref */
function collectRefs(value, refs = new Set()) {
    if (!value || typeof value !== 'object') return refs;
    if (Array.isArray(value)) {
        value.forEach((item) => collectRefs(item, refs));
        return refs;
    }
    if (typeof value.$ref === 'string') refs.add(value.$ref);
    Object.values(value).forEach((item) => collectRefs(item, refs));
    return refs;
}

/** 用 prettier 统一格式（与仓库 npm run lint:format 保持一致） */
async function formatJson(value) {
    const json = JSON.stringify(value, null, 4);
    try {
        const prettier = await import('prettier');
        const config = (await prettier.resolveConfig(OUT_FILE)) ?? {};
        return await prettier.format(json, { ...config, parser: 'json' });
    } catch {
        return `${json}\n`;
    }
}

async function main() {
    const files = loadSourceFiles(ENTRY_FILE);
    const { schemas: modelSchemas, models, enums, skipped } = buildModelSchemas(files);

    const schemas = { ...modelSchemas };
    for (const [name, { data, description }] of Object.entries(RESPONSE_SCHEMAS)) {
        schemas[name] = envelope(data, description);
    }

    const output = {
        openapi: '3.0.3',
        info: INFO,
        servers: SERVERS,
        tags: TAGS,
        paths: PATHS,
        components: { schemas },
    };

    // 校验 1：只允许 GET / POST
    const illegal = [];
    for (const [url, pathItem] of Object.entries(PATHS)) {
        for (const method of Object.keys(pathItem)) {
            if (!ALLOWED_METHODS.includes(method)) illegal.push(`${method.toUpperCase()} ${url}`);
        }
    }
    if (illegal.length > 0) {
        console.error(`✘ 只允许 GET / POST，发现：${illegal.join('、')}`);
        process.exit(1);
    }

    // 校验 2：所有 $ref 都能解析
    const missingRefs = [...collectRefs(output)]
        .map((refPath) => refPath.replace('#/components/schemas/', ''))
        .filter((name) => !schemas[name]);
    if (missingRefs.length > 0) {
        console.error(`✘ 存在无法解析的 $ref：${missingRefs.join('、')}`);
        process.exit(1);
    }

    const json = await formatJson(output);

    // 校验模式：只对比磁盘上的文件是否与代码一致
    if (CHECK_ONLY) {
        const current = fs.existsSync(OUT_FILE) ? fs.readFileSync(OUT_FILE, 'utf8') : '';
        if (current !== json) {
            console.error(
                '✘ docs/apifox.json 与 src/types/api.ts 不一致，请执行 npm run generate:apifox',
            );
            process.exit(1);
        }
        console.log('✔ docs/apifox.json 与 src/types/api.ts 保持一致');
        return;
    }

    fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
    fs.writeFileSync(OUT_FILE, json, 'utf8');

    const methodCount = Object.values(PATHS).reduce(
        (sum, item) => sum + Object.keys(item).length,
        0,
    );
    console.log(`✔ 已生成 ${path.relative(ROOT, OUT_FILE)}`);
    console.log(
        `  接口：${Object.keys(PATHS).length} 个路径，共 ${methodCount} 个方法（仅 GET / POST）`,
    );
    console.log(
        `  模型：${Object.keys(schemas).length} 个（对象 ${models.length} + 枚举 ${enums.length} + 响应包装 ${Object.keys(RESPONSE_SCHEMAS).length}）`,
    );
    if (skipped.length > 0) console.log(`  跳过：${skipped.join('、')}`);
    console.log('✔ $ref 引用校验通过');
}

await main();

/** 解析相对导入的 .ts 文件 */
function resolveModule(fromFile, specifier) {
    if (!specifier.startsWith('.')) return undefined;
    const base = path.resolve(path.dirname(fromFile), specifier);
    for (const candidate of [`${base}.ts`, path.join(base, 'index.ts')]) {
        if (fs.existsSync(candidate)) return candidate;
    }
    return undefined;
}

/** 读取入口文件及其依赖的类型文件，返回 { 文件名: SourceFile } */
function loadSourceFiles(entryFile) {
    const files = new Map();
    const queue = [entryFile];

    while (queue.length > 0) {
        const file = queue.shift();
        if (!file || files.has(file)) continue;

        const sourceFile = ts.createSourceFile(
            file,
            fs.readFileSync(file, 'utf8'),
            ts.ScriptTarget.Latest,
            true,
        );
        files.set(file, sourceFile);

        for (const statement of sourceFile.statements) {
            if (!ts.isImportDeclaration(statement)) continue;
            const specifier = statement.moduleSpecifier;
            if (!ts.isStringLiteral(specifier)) continue;

            const resolved = resolveModule(file, specifier.text);
            if (resolved && !files.has(resolved)) queue.push(resolved);
        }
    }

    return files;
}
