import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router';

import { callDataSource } from '@/api/dataSource';
import type { WedaRuntime, WedaUserInfo } from '@/types/weda';
import { buildPath } from '@/utils/router';

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
    favorites: '/favorites',
};

/**
 * 获取低代码运行时
 *
 * 注意：商城页面已经不再使用本 hook（页面改为直接用 react-router + src/api），
 * 这里保留，便于低代码平台（微搭容器 / 小程序端）注入 $w 时复用同一套实现。
 *
 * 优先级：
 * 1. 低代码平台注入的 props.$w（微搭容器 / 小程序端）
 * 2. 全局 window.$w（平台在 H5 的注入方式）
 * 3. 本项目 H5 兜底实现：数据源走 src/api，跳转走 react-router
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
                // 数据源统一走 src/api/dataSource（本地 mock / 真实 HTTP 由 VITE_USE_MOCK 切换）
                callDataSource,
            },
            utils: {
                navigateTo: ({ pageId, params }) => {
                    navigate(buildPath(PAGE_ID_TO_PATH[pageId] ?? `/${pageId}`, params));
                },
                navigateBack: () => {
                    navigate(-1);
                },
            },
            auth: {
                // H5 独立运行时的登录态占位，登录态实际由 useUserStore 管理
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
