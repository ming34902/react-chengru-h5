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

    /**
     * page-content-bg：布局容器与页面内容区块使用同一个背景变量（--page-content-bg）。
     *
     * 路由切换时页面会以 opacity 0 → 1 淡入（见 src/routes/utils/RouteAnimation.tsx），
     * 若这里用白色底（bg-background），淡入的瞬间就会透出白底 —— 表现为「刷」的一下闪屏；
     * 换成同一个背景色打底后，过渡过程中露出的颜色与页面一致，只剩下内容淡入的效果。
     */
    return (
        <div className="page-content-bg min-h-screen">
            <Outlet />
            <TabBar activeTab={activeTab} onTabChange={handleTabChange} cartCount={cartCount} />
        </div>
    );
}

/** 供路由与小程序侧复用的 tab 配置 */
export { TAB_BAR_ITEMS };
