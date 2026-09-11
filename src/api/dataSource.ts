import { httpCallDataSource } from '@/hooks/useWeda/httpDataSource';

import type { WedaDataSourceRequest, WedaDataSourceResult, WedaRecord } from '@/types/weda';

/**
 * 数据源适配层（页面统一入口）
 *
 * 页面原来调用 `$w.cloud.callDataSource({ dataSourceName, methodName, params })`，
 * 现在统一调用这里的 callDataSource：内部把「数据源名 + 方法名」翻译成 src/api 里的 REST 接口
 * （只使用 GET / POST），再由 src/api/request.ts 决定走本地 mock 还是真实 HTTP
 * （Apifox 云 mock / 后端，切换只改环境变量）。
 *
 * 说明：购物车不经过这里，由 src/utils/cartStorage.ts 的本地存储维护。
 */
export function callDataSource<T = WedaRecord>(
    request: WedaDataSourceRequest,
): Promise<WedaDataSourceResult<T>> {
    return httpCallDataSource<T>(request);
}

export { isLocalMock, isLocalMock as isMockDataSource } from './request';
