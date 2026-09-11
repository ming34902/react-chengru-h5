import type {
    CreateUserRequest,
    OrderCreateRequest,
    OrderModel,
    OrderPayRequest,
    OrderQuery,
    OrderRemoveRequest,
    OrderStatusRequest,
    PageResult,
    ProductModel,
    ProductQuery,
    RemoveResult,
    UpdateUserRequest,
    UserInfoQuery,
    UserModel,
} from '@/types/api';

import { http } from './request';

/**
 * 商城接口定义（只使用 GET / POST）
 *
 * 路径、参数、返回结构均与 docs/apifox.json 保持一致：
 * - 本地 mock（src/mock/server.ts）与 Apifox 云 mock 使用同一套定义
 * - 因此切换 mock 来源时，页面代码无需改动，只需要调整 .env（VITE_USE_MOCK / VITE_GLOB_API_URL）
 * - 购物车不在此处定义：由前端 localStorage 维护（src/utils/cartStorage.ts）
 */
export type { PageResult } from '@/types/api';

/** 商品接口 */
export const productApi = {
    /** 商品列表 GET /products */
    list: (params: ProductQuery = {}) => http.get<PageResult<ProductModel>>('/products', params),
    /** 商品详情 GET /products/detail?id= */
    detail: (id: string | number) => http.get<ProductModel>('/products/detail', { id }),
};

/** 订单接口 */
export const orderApi = {
    /** 订单创建 POST /orders/create */
    create: (payload: OrderCreateRequest) => http.post<OrderModel>('/orders/create', payload),
    /** 订单查询（列表）GET /orders */
    list: (params: OrderQuery = {}) => http.get<PageResult<OrderModel>>('/orders', params),
    /** 订单查询（详情）GET /orders/detail?orderNo= */
    detail: (orderNo: string) => http.get<OrderModel>('/orders/detail', { orderNo }),
    /** 订单支付 POST /orders/pay */
    pay: (payload: OrderPayRequest) => http.post<OrderModel>('/orders/pay', payload),
    /** 更新订单状态（取消 / 确认收货等）POST /orders/update-status */
    updateStatus: (payload: OrderStatusRequest) =>
        http.post<OrderModel>('/orders/update-status', payload),
    /** 删除订单 POST /orders/remove */
    remove: (payload: OrderRemoveRequest) => http.post<RemoveResult>('/orders/remove', payload),
};

/** 用户接口（个人中心） */
export const userApi = {
    /** 获取用户信息 GET /user/info?id=|phone= */
    info: (params: UserInfoQuery = {}) => http.get<UserModel>('/user/info', params),
    /** 创建用户 POST /user/create */
    create: (payload: CreateUserRequest) => http.post<UserModel>('/user/create', payload),
    /** 更新用户信息 POST /user/update */
    update: (payload: UpdateUserRequest) => http.post<UserModel>('/user/update', payload),
};
