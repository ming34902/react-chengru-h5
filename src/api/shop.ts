import type {
    CartRecord,
    MemberRecord,
    OrderItemRecord,
    OrderRecord,
    ProductRecord,
} from '@/types/weda';

import { http } from './request';

/** 分页返回结构（与后端约定） */
export interface PageResult<T> {
    records: T[];
    total: number;
    pageNumber?: number;
    pageSize?: number;
}

/** 商品列表查询参数 */
export interface ProductQuery {
    category?: string;
    keyword?: string;
    /** recommended | sales | price_asc | price_desc | newest */
    sort?: string;
    isFeatured?: boolean;
    isOnSale?: boolean;
    pageNumber?: number;
    pageSize?: number;
}

/** 商品接口 */
export const productApi = {
    list: (params: ProductQuery = {}) =>
        http.get<PageResult<ProductRecord>>('/shop/products', params),
    detail: (id: string | number) => http.get<ProductRecord>(`/shop/products/${id}`),
};

/** 购物车接口 */
export const cartApi = {
    list: (userPhone?: string) => http.get<PageResult<CartRecord>>('/shop/cart', { userPhone }),
    create: (record: Partial<CartRecord>) => http.post<CartRecord>('/shop/cart', record),
    update: (id: string | number, record: Partial<CartRecord>) =>
        http.put<CartRecord>(`/shop/cart/${id}`, record),
    remove: (id: string | number) => http.delete<void>(`/shop/cart/${id}`),
};

/** 订单接口 */
export const orderApi = {
    list: (
        params: {
            status?: string;
            userPhone?: string;
            pageNumber?: number;
            pageSize?: number;
        } = {},
    ) => http.get<PageResult<OrderRecord>>('/shop/orders', params),
    detail: (orderNo: string) => http.get<OrderRecord>(`/shop/orders/${orderNo}`),
    create: (payload: {
        items: OrderItemRecord[];
        address?: Record<string, unknown>;
        remark?: string;
    }) => http.post<OrderRecord>('/shop/orders', payload),
    updateStatus: (orderNo: string, status: string) =>
        http.put<OrderRecord>(`/shop/orders/${orderNo}`, { status }),
    remove: (orderNo: string) => http.delete<void>(`/shop/orders/${orderNo}`),
};

/** 会员接口 */
export const memberApi = {
    list: (params: { phone?: string; nickName?: string } = {}) =>
        http.get<PageResult<MemberRecord>>('/shop/members', params),
    create: (record: Partial<MemberRecord>) => http.post<MemberRecord>('/shop/members', record),
    update: (id: string | number, record: Partial<MemberRecord>) =>
        http.put<MemberRecord>(`/shop/members/${id}`, record),
};
