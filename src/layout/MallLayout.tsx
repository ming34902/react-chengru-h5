import { useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';

import { TabBar } from '@/components/TabBar';

import { useAppStore } from '@/stores';

import { TAB_BAR_ITEMS, getActiveTabId, getTabPath } from '@/constants/tabBar';

/**
 * 商城布局（H5）
 *
 * 统一挂载底部 TabBar：
 * - 页面内不要再自带 TabBar，避免多端/多页面重复实现
 * - 配置全部来自 src/constants/tabBar.ts（小程序端复用同一份配置）
 * - 购物车角标取自 useAppStore，页面只需调用 store 的方法更新数量
 */
export default function MallLayout() {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const cartCount = useAppStore((state) => state.cartCount);

    const activeTab = useMemo(() => getActiveTabId(pathname), [pathname]);

    const handleTabChange = (id: string) => {
        const path = getTabPath(id);
        if (path && path !== pathname) {
            navigate(path);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Outlet />
            <TabBar activeTab={activeTab} onTabChange={handleTabChange} cartCount={cartCount} />
        </div>
    );
}

/** 供路由与小程序侧复用的 tab 配置 */
export { TAB_BAR_ITEMS };
