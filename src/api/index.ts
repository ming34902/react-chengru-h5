/**
 * 接口层出口
 *
 * 使用方式：
 *   import { productApi, orderApi, userApi, authApi, callDataSource, http, ApiError } from '@/api';
 *   import type { ProductModel, UserModel, OrderModel, CartItemModel } from '@/types/api';
 *
 * 约定：
 * - 只使用 GET / POST：查询用 GET（query），写操作用 POST（body）
 * - 统一返回 { code, message, data }，request 层会自动解包（code !== 0 抛 ApiError）
 * - 本地 mock（src/mock）与 Apifox 云 mock 共用同一套接口定义，切换只改 .env
 * - 购物车无接口，由 src/utils/cartStorage.ts 本地存储维护
 */
export * from './request';
export * from './shop';
export * from './auth';
export * from './dataSource';
