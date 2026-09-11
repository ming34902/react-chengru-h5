import { API_SUCCESS_CODE, type ApiResponse, type OrderStatus } from '@/types/api';

import {
    createUserRow,
    findOrder,
    findProduct,
    findUserRow,
    insertOrder,
    listOrders,
    listProducts,
    nextOrderNo,
    nowText,
    removeOrder,
    toUser,
    updateOrderStatus,
    updateUserRow,
    verifyUser,
} from './db';

/**
 * 本地 mock-api
 *
 * 与 docs/apifox.json 里的接口定义一一对应（只使用 GET / POST）：
 *   GET  /products              商品列表
 *   GET  /products/detail       商品详情
 *   POST /auth/login            登录
 *   POST /auth/register         注册（注册成功即登录）
 *   POST /user/create           创建用户
 *   GET  /user/info             获取用户信息（个人中心）
 *   POST /user/update           更新用户信息（昵称/头像/收藏）
 *   POST /orders/create         订单创建
 *   GET  /orders                订单查询（列表）
 *   GET  /orders/detail         订单查询（详情）
 *   POST /orders/pay            订单支付
 *   POST /orders/update-status  更新订单状态（取消/收货等）
 *   POST /orders/remove         删除订单
 *
 * 购物车没有接口：由前端 localStorage 维护（src/utils/cartStorage.ts）。
 *
 * 接入 Apifox 云 mock：把 .env 的 VITE_USE_MOCK 置为 false、VITE_GLOB_API_URL 指向
 * Apifox 云 mock 地址（并携带 /api 前缀），本文件即不再参与请求链路，页面无需改动。
 */

/** mock 接口耗时（毫秒）：模拟真实网络，让 loading 态可见 */
const MOCK_DELAY = 80;

/** mock 请求上下文 */
export interface MockRequest {
    /** 请求方法（只支持 GET / POST） */
    method: 'GET' | 'POST';
    /** 请求地址（src/api 里书写的路径，如 /products） */
    url: string;
    /** query 参数 */
    params?: Record<string, unknown>;
    /** body 参数 */
    data?: Record<string, unknown>;
    /** 本地 mock-token（GET /user/info 不带参数时用于识别当前用户） */
    token?: string;
}

/** 成功响应 */
function ok<T>(data: T): ApiResponse<T> {
    return { code: API_SUCCESS_CODE, message: 'ok', data };
}

/** 失败响应 */
function fail(code: number, message: string): ApiResponse<null> {
    return { code, message, data: null };
}

/** 生成本地 mock-token */
function createToken(userId: string): string {
    return `mock-token-${userId}-${Date.now()}`;
}

/** 从 mock-token 中解析用户 id */
function userIdFromToken(token?: string): string | undefined {
    if (!token) return undefined;
    const match = /^mock-token-([^-]+(?:-[0-9]+)?)-\d+$/.exec(token);
    return match?.[1];
}

/** 把任意值转成字符串（undefined 返回 undefined） */
function str(value: unknown): string | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    return String(value);
}

/** 延迟（模拟网络） */
function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 路由处理函数上下文 */
interface MockContext {
    /** query 参数（全部转成字符串） */
    query: Record<string, string>;
    /** body 参数 */
    body: Record<string, any>;
    /** 本地 mock-token */
    token?: string;
}

/** 路由表：`${method} ${path}` → handler */
const routes: Record<string, (ctx: MockContext) => ApiResponse<unknown>> = {
    // ---------------------------- 商品 ----------------------------
    'GET /products': ({ query }) =>
        ok(
            listProducts({
                category: query.category,
                keyword: query.keyword,
                sort: query.sort,
                isFeatured: query.isFeatured,
                isOnSale: query.isOnSale,
                pageNumber: Number(query.pageNumber || 1),
                pageSize: Number(query.pageSize || 12),
            }),
        ),
    'GET /products/detail': ({ query }) => {
        const product = findProduct(query.id);
        return product ? ok(product) : fail(40401, '商品不存在');
    },

    // ------------------------ 登录 / 注册 / 用户 ------------------------
    'POST /auth/login': ({ body }) => {
        const username = String(body.username ?? '');
        const password = String(body.password ?? '');
        if (!username || !password) return fail(1001, '用户名或密码不能为空');

        const row = verifyUser(username, password);
        if (!row) return fail(1002, '用户名或密码错误');
        return ok({ token: createToken(row.id), user: toUser(row) });
    },
    'POST /auth/register': ({ body }) => {
        const { user, error } = createUserRow({
            phone: String(body.phone ?? ''),
            nickname: str(body.nickname),
            password: str(body.password),
        });
        if (!user) return fail(1003, error ?? '注册失败');
        return ok({ token: createToken(user.id), user: toUser(user) });
    },
    'POST /user/create': ({ body }) => {
        const { user, error } = createUserRow({
            phone: String(body.phone ?? ''),
            nickname: str(body.nickname),
            password: str(body.password),
            avatar: str(body.avatar),
        });
        if (!user) return fail(1004, error ?? '创建用户失败');
        return ok(toUser(user));
    },
    'GET /user/info': ({ query, token }) => {
        const row = findUserRow({
            id: str(query.id) ?? userIdFromToken(token),
            phone: str(query.phone),
        });
        return row ? ok(toUser(row)) : fail(1005, '用户不存在');
    },
    'POST /user/update': ({ body }) => {
        const row = updateUserRow({
            id: str(body.id),
            phone: str(body.phone),
            nickname: str(body.nickname),
            avatar: str(body.avatar),
            collection: Array.isArray(body.collection) ? body.collection : undefined,
        });
        return row ? ok(toUser(row)) : fail(1006, '用户不存在');
    },

    // ---------------------------- 订单 ----------------------------
    'POST /orders/create': ({ body }) => {
        const items = Array.isArray(body.items) ? body.items : [];
        if (items.length === 0) return fail(2001, '订单商品不能为空');

        const totalAmount = items.reduce(
            (sum: number, item: Record<string, any>) =>
                sum + Number(item.price ?? 0) * Number(item.quantity ?? 1),
            0,
        );
        const freight = Number(body.freight ?? (totalAmount >= 99 ? 0 : 10));

        return ok(
            insertOrder({
                id: `o_${Date.now()}`,
                orderNo: nextOrderNo(),
                status: 'pending',
                items,
                totalAmount,
                freight,
                payAmount: totalAmount + freight,
                address: body.address ?? null,
                remark: str(body.remark) ?? '',
                userPhone: str(body.userPhone) ?? '',
                payMethod: '',
                createTime: nowText(),
            }),
        );
    },
    'GET /orders': ({ query }) =>
        ok(
            listOrders({
                userPhone: str(query.userPhone),
                status: str(query.status),
                pageNumber: Number(query.pageNumber || 1),
                pageSize: Number(query.pageSize || 20),
            }),
        ),
    'GET /orders/detail': ({ query }) => {
        const orderNo = str(query.orderNo) ?? str(query.id);
        const order = orderNo ? findOrder(orderNo) : undefined;
        return order ? ok(order) : fail(2002, '订单不存在');
    },
    /** 订单支付：mock 默认微信支付 */
    'POST /orders/pay': ({ body }) => {
        const orderNo = str(body.orderNo) ?? str(body.id);
        if (!orderNo) return fail(2003, '订单号不能为空');

        const order = updateOrderStatus(orderNo, 'paid');
        return order ? ok(order) : fail(2002, '订单不存在');
    },
    'POST /orders/update-status': ({ body }) => {
        const orderNo = str(body.orderNo) ?? str(body.id);
        const status = str(body.status);
        if (!orderNo || !status) return fail(2003, '订单号与状态不能为空');

        const order = updateOrderStatus(orderNo, status as OrderStatus);
        return order ? ok(order) : fail(2002, '订单不存在');
    },
    'POST /orders/remove': ({ body }) => {
        const orderNo = str(body.orderNo) ?? str(body.id);
        if (!orderNo) return fail(2003, '订单号不能为空');
        return ok({ success: removeOrder(orderNo) });
    },
};

/** 归一化请求路径：去掉域名与 /api 前缀，便于与路由表匹配 */
function normalizePath(url: string): string {
    let path = url;
    try {
        const origin = typeof window === 'undefined' ? 'http://localhost' : window.location.origin;
        path = new URL(url, origin).pathname;
    } catch {
        // 相对路径直接用
    }
    return path.replace(/^\/api(?=\/|$)/, '').replace(/\/+$/, '') || '/';
}

/**
 * 本地 mock 请求入口
 *
 * 返回结构与真实接口完全一致（{ code, message, data }），
 * 因此 src/api/request.ts 里「本地 mock / 真实 HTTP」可以无缝切换。
 */
export async function handleMockRequest<T>(request: MockRequest): Promise<ApiResponse<T>> {
    await sleep(MOCK_DELAY);

    const method = request.method.toUpperCase();
    const path = normalizePath(request.url);
    const handler = routes[`${method} ${path}`];
    if (!handler) {
        return fail(40400, `mock 未实现的接口：${method} ${path}`) as ApiResponse<T>;
    }

    const query: Record<string, string> = {};
    Object.entries(request.params ?? {}).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        query[key] = String(value);
    });

    return handler({
        query,
        body: (request.data ?? {}) as Record<string, any>,
        token: request.token,
    }) as ApiResponse<T>;
}
