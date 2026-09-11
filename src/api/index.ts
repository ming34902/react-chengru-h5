/**
 * 接口层出口
 *
 * 使用方式：
 *   import { productApi, cartApi, orderApi, authApi, http, ApiError } from '@/api';
 *
 * 低代码页面不直接调用这里，而是通过 src/hooks/useWeda 的数据源适配层
 * （本地 mock / 真实 HTTP 由环境变量 VITE_USE_MOCK 切换）。
 */
export * from './request';
export * from './shop';
export * from './auth';
