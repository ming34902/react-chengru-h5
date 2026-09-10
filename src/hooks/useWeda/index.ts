import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router';

import type {
    WedaDataSourceRequest,
    WedaDataSourceResult,
    WedaRecord,
    WedaRuntime,
    WedaUserInfo,
} from '@/types/weda';

import { httpCallDataSource } from './httpDataSource';
import { mockCallDataSource } from './mockDataSource';

/**
 * 低代码页面 id（weda pageId）与项目路由的映射关系
 * 低代码页面之间用 pageId 跳转，这里统一转换成项目路由地址
 */
export const PAGE_ID_TO_PATH: Record<string, string> = {
    home: '/home',
    products: '/products',
    'product-detail': '/product-detail',
    cart: '/cart',
    orders: '/orders',
    'order-detail': '/order-detail',
    checkout: '/checkout',
    member: '/member',
};

/** 是否使用本地 mock 数据（由 .env 的 VITE_USE_MOCK 控制） */
function isMockDataSource(): boolean {
    const flag = import.meta.env.VITE_USE_MOCK as unknown;
    return flag === true || flag === 'true';
}

/** 把低代码页面参数转换成 query string */
function toQueryString(params?: WedaRecord): string {
    if (!params) return '';

    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        search.append(key, typeof value === 'string' ? value : JSON.stringify(value));
    });

    const query = search.toString();
    return query ? `?${query}` : '';
}

/**
 * 获取低代码运行时
 *
 * 优先级：
 * 1. 低代码平台注入的 props.$w（微搭容器 / 小程序端）
 * 2. 全局 window.$w（平台在 H5 的注入方式）
 * 3. 本项目 H5 兜底实现：数据源走 mock，跳转走 react-router
 */
export function useWeda(injectedRuntime?: WedaRuntime): WedaRuntime {
    const navigate = useNavigate();
    const location = useLocation();

    return useMemo<WedaRuntime>(() => {
        if (injectedRuntime) return injectedRuntime;

        const globalRuntime = (window as unknown as { $w?: WedaRuntime }).$w;
        if (globalRuntime) return globalRuntime;

        return {
            cloud: {
                callDataSource<T = WedaRecord>(
                    request: WedaDataSourceRequest,
                ): Promise<WedaDataSourceResult<T>> {
                    // VITE_USE_MOCK=true 时走本地 mock；否则走真实 HTTP 接口层（src/api）
                    return isMockDataSource()
                        ? mockCallDataSource<T>(request)
                        : httpCallDataSource<T>(request);
                },
            },
            utils: {
                navigateTo: ({ pageId, params }) => {
                    const path = PAGE_ID_TO_PATH[pageId] ?? `/${pageId}`;
                    navigate(`${path}${toQueryString(params)}`);
                },
                navigateBack: () => {
                    navigate(-1);
                },
            },
            auth: {
                // H5 独立运行时的登录态占位，后续可接入 useUserStore
                currentUser: null as WedaUserInfo | null,
            },
            page: {
                dataset: {
                    // 把当前路由的 query 作为页面参数，兼容低代码页面的 params 读取方式
                    params: Object.fromEntries(new URLSearchParams(location.search)),
                },
            },
        };
    }, [injectedRuntime, navigate, location.search]);
}
