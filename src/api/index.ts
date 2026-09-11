/**
 * 接口层出口
 *
 * 使用方式：
 *   import { productApi, cartApi, orderApi, authApi, callDataSource, http, ApiError } from '@/api';
 *
 * 页面里的低代码数据源调用（原 $w.cloud.callDataSource）统一改为这里的 callDataSource，
 * 本地 mock / 真实 HTTP 由环境变量 VITE_USE_MOCK 切换（见 src/api/dataSource.ts）。
 */
export * from './request';
export * from './shop';
export * from './auth';
export * from './dataSource';
