import { httpCallDataSource } from '@/hooks/useWeda/httpDataSource';
import { mockCallDataSource } from '@/hooks/useWeda/mockDataSource';

import type { WedaDataSourceRequest, WedaDataSourceResult, WedaRecord } from '@/types/weda';

/**
 * 数据源适配层（页面直接调用）
 *
 * 原来低代码页面的调用方式是 `$w.cloud.callDataSource({ dataSourceName, methodName, params })`，
 * 现在页面统一改为调用这里的 callDataSource：由 VITE_USE_MOCK 决定走本地 mock 还是真实 HTTP。
 *
 * 说明：src/hooks/useWeda 运行时保留（不再被页面使用），本文件与它共用同一套数据源实现。
 */

/** 是否使用本地 mock 数据（由 .env 的 VITE_USE_MOCK 控制） */
export function isMockDataSource(): boolean {
    const flag = import.meta.env.VITE_USE_MOCK as unknown;
    return flag === true || flag === 'true';
}

/** 统一数据源调用：本地 mock / 真实 HTTP 由环境变量切换 */
export function callDataSource<T = WedaRecord>(
    request: WedaDataSourceRequest,
): Promise<WedaDataSourceResult<T>> {
    return isMockDataSource() ? mockCallDataSource<T>(request) : httpCallDataSource<T>(request);
}
