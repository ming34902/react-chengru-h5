#!/usr/bin/env node
/**
 * 根据 src/utils 下的本地缓存函数生成 Apifox 可导入的接口文档（OpenAPI 3.0）。
 *
 * 使用方式：npm run generate:apifox:apis
 * 输出文件：apifox-apis.json（位于项目根目录）
 *
 * 接口映射来源：
 *   src/utils/dish.ts    → 菜单接口（Dish）
 *   src/utils/cart.ts    → 购物车接口（Cart）
 *   src/utils/order.ts   → 订单接口（Order）
 *   src/utils/storage.ts → 缓存接口（Storage）
 *
 * Apifox 导入方式：项目设置 → 导入数据 → openApi/swagger → 选择 apifox-apis.json
 */
const fs = require('fs')
const path = require('path')
const { buildSchemasFromTypes } = require('./lib/openapi-schemas')

const ROOT = path.resolve(__dirname, '..')
const OUT_FILE = path.join(ROOT, 'apifox-apis.json')

const { schemas, missingRefs } = buildSchemasFromTypes()

/* ======================== 接口专用补充模型 ======================== */

/** POST /cart/items 请求体：添加菜品到购物车（对应 addDishToCart） */
const AddCartItemRequest = {
  type: 'object',
  description: '添加菜品到购物车的请求参数（对应 addDishToCart）',
  required: ['dishId'],
  properties: {
    dishId: { type: 'integer', description: '菜品 ID，服务端从菜谱中读取菜品信息' },
    count: { type: 'integer', description: '添加数量，默认 1' }
  }
}

/** PUT /cart/items/{dishId} 请求体：修改购物车菜品数量（对应 updateCartItemCount） */
const UpdateCartItemCountRequest = {
  type: 'object',
  description: '修改购物车菜品数量的请求参数（对应 updateCartItemCount）',
  required: ['delta'],
  properties: {
    delta: { type: 'integer', description: '数量变化值（正数增加、负数减少），减到 0 或负数时移除该菜品' }
  }
}

/** GET /cart/summary 响应：购物车汇总（对应 calcTotalPrice / calcTotalCount） */
const CartSummary = {
  type: 'object',
  description: '购物车汇总（对应 calcTotalPrice / calcTotalCount）',
  required: ['totalPrice', 'totalCount'],
  properties: {
    totalPrice: { type: 'number', format: 'double', description: '购物车总金额（元），保留两位小数' },
    totalCount: { type: 'integer', description: '购物车菜品总件数' }
  }
}

/** POST /orders 请求体：创建订单（对应 saveOrder，orderId/createTime/status 由服务端生成） */
const OrderCreateRequest = {
  type: 'object',
  description: '创建订单的请求参数（对应 saveOrder；orderId、createTime、totalPrice、totalCount、status 由服务端生成）',
  required: ['items', 'peopleCount', 'payer'],
  properties: {
    items: { type: 'array', items: { $ref: '#/components/schemas/CartItem' }, description: '订单包含的菜品条目' },
    peopleCount: { type: 'integer', description: '用餐人数（1 - 8）' },
    remark: { type: 'string', description: '订单备注' },
    payer: { $ref: '#/components/schemas/Payer', description: '付款方式' }
  }
}

/** PUT /storage/{key} 请求体：写入缓存值（对应 setStorage） */
const StorageWriteRequest = {
  type: 'object',
  description: '写入缓存值的请求参数（对应 setStorage）',
  required: ['value'],
  properties: {
    value: { type: 'object', description: '缓存值（任意 JSON，对应 Taro.setStorageSync 的 data）' }
  }
}

/** GET /storage/{key} 响应：读取缓存值（对应 getStorage） */
const StorageValue = {
  type: 'object',
  description: '读取缓存值的响应（对应 getStorage）',
  required: ['value'],
  properties: {
    value: { type: 'object', description: '缓存值（任意 JSON，不存在时返回 null）' }
  }
}

const extraSchemas = {
  AddCartItemRequest,
  UpdateCartItemCountRequest,
  CartSummary,
  OrderCreateRequest,
  StorageWriteRequest,
  StorageValue
}

/* ======================== 响应 / 参数辅助函数 ======================== */

/** 构造 JSON 响应 */
function jsonResponse(description, schema) {
  const response = { description }
  if (schema) {
    response.content = {
      'application/json': { schema }
    }
  }
  return response
}

/** 构造路径参数 */
function pathParam(name, description, type = 'number') {
  return {
    name,
    in: 'path',
    required: true,
    description,
    schema: { type }
  }
}

/** 便捷引用 */
const ref = (name) => ({ $ref: `#/components/schemas/${name}` })

/* ======================== 接口定义 ======================== */

const paths = {
  /* ---------- 菜单 Dish（src/utils/dish.ts） ---------- */
  '/dish/list': {
    get: {
      tags: ['菜单 Dish'],
      summary: '获取菜品列表（getDishList）',
      description: '对应 src/utils/dish.ts 中的 getDishList()，返回全部菜品列表。',
      operationId: 'getDishList',
      responses: {
        '200': jsonResponse('获取成功，返回菜品列表', { type: 'array', items: ref('Dish') })
      }
    }
  },

  /* ---------- 购物车 Cart（src/utils/cart.ts） ---------- */
  '/cart': {
    get: {
      tags: ['购物车 Cart'],
      summary: '获取购物车（getCart）',
      description: '对应 src/utils/cart.ts 中的 getCart()，返回当前购物车全部条目（异常数据会被归一化过滤）。',
      operationId: 'getCart',
      responses: {
        '200': jsonResponse('获取成功，返回购物车条目列表', { type: 'array', items: ref('CartItem') })
      }
    },
    put: {
      tags: ['购物车 Cart'],
      summary: '覆盖保存购物车（saveCart）',
      description: '对应 src/utils/cart.ts 中的 saveCart(cart)，整体覆盖当前购物车。',
      operationId: 'saveCart',
      requestBody: {
        required: true,
        content: {
          'application/json': { schema: { type: 'array', items: ref('CartItem') } }
        }
      },
      responses: {
        '204': { description: '保存成功，无返回内容' }
      }
    },
    delete: {
      tags: ['购物车 Cart'],
      summary: '清空购物车（clearCart）',
      description: '对应 src/utils/cart.ts 中的 clearCart()，移除本地购物车缓存。',
      operationId: 'clearCart',
      responses: {
        '204': { description: '清空成功，无返回内容' }
      }
    }
  },

  '/cart/items': {
    post: {
      tags: ['购物车 Cart'],
      summary: '添加菜品到购物车（addDishToCart）',
      description: '对应 src/utils/cart.ts 中的 addDishToCart(dish)，同菜品已存在则数量 +1，否则新增一条。',
      operationId: 'addDishToCart',
      requestBody: {
        required: true,
        content: {
          'application/json': { schema: ref('AddCartItemRequest') }
        }
      },
      responses: {
        '200': jsonResponse('添加成功，返回更新后的购物车', { type: 'array', items: ref('CartItem') }),
        '404': jsonResponse('菜品不存在或已售罄', { type: 'object', properties: { message: { type: 'string' } } })
      }
    }
  },

  '/cart/items/{dishId}': {
    put: {
      tags: ['购物车 Cart'],
      summary: '修改菜品数量（updateCartItemCount）',
      description: '对应 src/utils/cart.ts 中的 updateCartItemCount(dishId, delta)，按 delta 增减数量，数量减至 0 时移除。',
      operationId: 'updateCartItemCount',
      parameters: [pathParam('dishId', '菜品 ID')],
      requestBody: {
        required: true,
        content: {
          'application/json': { schema: ref('UpdateCartItemCountRequest') }
        }
      },
      responses: {
        '200': jsonResponse('修改成功，返回更新后的购物车', { type: 'array', items: ref('CartItem') })
      }
    },
    delete: {
      tags: ['购物车 Cart'],
      summary: '移除菜品（removeCartItem）',
      description: '对应 src/utils/cart.ts 中的 removeCartItem(dishId)，从购物车中移除指定菜品。',
      operationId: 'removeCartItem',
      parameters: [pathParam('dishId', '菜品 ID')],
      responses: {
        '200': jsonResponse('移除成功，返回更新后的购物车', { type: 'array', items: ref('CartItem') })
      }
    }
  },

  '/cart/summary': {
    get: {
      tags: ['购物车 Cart'],
      summary: '购物车汇总（calcTotalPrice / calcTotalCount）',
      description: '对应 src/utils/cart.ts 中的 calcTotalPrice(items) 与 calcTotalCount(items)，返回总金额与总件数。',
      operationId: 'calcCartSummary',
      responses: {
        '200': jsonResponse('获取成功，返回汇总信息', ref('CartSummary'))
      }
    }
  },

  '/cart/line-items': {
    get: {
      tags: ['购物车 Cart'],
      summary: '购物车条目（含小计）（withCartLineTotal）',
      description: '对应 src/utils/cart.ts 中的 withCartLineTotal(items)，返回含小计 lineTotal 的购物车条目，用于购物车 / 订单预览。',
      operationId: 'getCartLineItems',
      responses: {
        '200': jsonResponse('获取成功，返回含小计的购物车条目', { type: 'array', items: ref('CartLineItem') })
      }
    }
  },


  /* ---------- 订单 Order（src/utils/order.ts） ---------- */
  '/orders': {
    get: {
      tags: ['订单 Order'],
      summary: '获取历史订单列表（getOrders）',
      description: '对应 src/utils/order.ts 中的 getOrders()，按时间倒序返回历史订单。',
      operationId: 'getOrders',
      responses: {
        '200': jsonResponse('获取成功，返回订单列表', { type: 'array', items: ref('Order') })
      }
    },
    post: {
      tags: ['订单 Order'],
      summary: '创建订单（saveOrder）',
      description: '对应 src/utils/order.ts 中的 saveOrder(order)。orderId、createTime、status 由服务端生成，totalPrice、totalCount 由服务端根据 items 计算。',
      operationId: 'createOrder',
      requestBody: {
        required: true,
        content: {
          'application/json': { schema: ref('OrderCreateRequest') }
        }
      },
      responses: {
        '201': jsonResponse('创建成功，返回完整订单信息', ref('Order'))
      }
    },
    delete: {
      tags: ['订单 Order'],
      summary: '清空历史订单（clearOrders）',
      description: '对应 src/utils/order.ts 中的 clearOrders()，移除本地订单缓存。',
      operationId: 'clearOrders',
      responses: {
        '204': { description: '清空成功，无返回内容' }
      }
    }
  },

  /* ---------- 缓存 Storage（src/utils/storage.ts） ---------- */
  '/storage/{key}': {
    get: {
      tags: ['缓存 Storage'],
      summary: '读取缓存值（getStorage）',
      description: '对应 src/utils/storage.ts 中的 getStorage(key, defaultValue)。常用 key：cart / orders / couple_profile。',
      operationId: 'getStorage',
      parameters: [pathParam('key', '缓存键（常用：cart / orders / couple_profile）', 'string')],
      responses: {
        '200': jsonResponse('读取成功，返回缓存值', ref('StorageValue'))
      }
    },
    put: {
      tags: ['缓存 Storage'],
      summary: '写入缓存值（setStorage）',
      description: '对应 src/utils/storage.ts 中的 setStorage(key, value)，覆盖写入指定缓存键。',
      operationId: 'setStorage',
      parameters: [pathParam('key', '缓存键（常用：cart / orders / couple_profile）', 'string')],
      requestBody: {
        required: true,
        content: {
          'application/json': { schema: ref('StorageWriteRequest') }
        }
      },
      responses: {
        '204': { description: '写入成功，无返回内容' }
      }
    },
    delete: {
      tags: ['缓存 Storage'],
      summary: '删除缓存值（removeStorage）',
      description: '对应 src/utils/storage.ts 中的 removeStorage(key)，删除指定缓存键。',
      operationId: 'removeStorage',
      parameters: [pathParam('key', '缓存键（常用：cart / orders / couple_profile）', 'string')],
      responses: {
        '204': { description: '删除成功，无返回内容' }
      }
    }
  }
}

const allSchemas = { ...schemas, ...extraSchemas }

const output = {
  openapi: '3.0.3',
  info: {
    title: 'FriendMeal 朋友餐桌 · 接口文档',
    description: '根据 src/utils/cart.ts、order.ts、storage.ts 的本地缓存函数自动生成的接口定义，可导入 Apifox 使用。',
    version: '1.0.0'
  },
  servers: [
    { url: 'https://api.friendmeal.com', description: '示例服务器地址，可按实际环境替换' }
  ],
  paths,
  components: {
    schemas: allSchemas
  }
}

// 校验：所有 $ref 都能指向已生成的 schema
const refPattern = /^#\/components\/schemas\/(.+)$/
const unresolvedRefs = new Set([...missingRefs])
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
    if (match && !allSchemas[match[1]]) {
      unresolvedRefs.add(match[1])
    }
  }
  Object.values(value).forEach(walk)
})(output)

if (unresolvedRefs.size > 0) {
  console.error(`✘ 存在无法解析的 $ref：${Array.from(unresolvedRefs).join('、')}`)
  process.exit(1)
}

fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2), 'utf8')

const pathCount = Object.keys(paths).length
const methodCount = Object.keys(paths).reduce((sum, key) => sum + Object.keys(paths[key]).length, 0)
console.log(`✔ 已生成 ${OUT_FILE}`)
console.log(`  接口数：${pathCount} 个路径，共 ${methodCount} 个方法`)
console.log(`  数据模型：${Object.keys(allSchemas).length} 个（含接口请求 / 响应专用模型）`)
console.log('✔ 所有 $ref 引用校验通过')

