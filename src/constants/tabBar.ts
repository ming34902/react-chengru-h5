import { Home, ListOrdered, type LucideIcon, ShoppingBag, ShoppingCart, User } from 'lucide-react';

/**
 * 底部 TabBar 唯一数据源（H5 与小程序共用）
 *
 * - H5：由 src/layout/MallLayout.tsx 统一渲染（页面内不要再自带 TabBar）
 * - 小程序：字段与 app.json 的 tabBar.list 一一对应，见 miniprogram/tabbar.json
 * - 低代码：id 与低代码 pageId 同名，配合 src/hooks/useWeda 的 PAGE_ID_TO_PATH 使用
 */
export interface TabBarItem {
    /** tab 唯一标识（= 低代码 pageId） */
    id: string;
    /** H5 路由地址 */
    path: string;
    /** 展示文案 */
    label: string;
    /** H5 图标（lucide-react） */
    icon: LucideIcon;
    /** 小程序页面路径（app.json -> tabBar.list[].pagePath，不带后缀） */
    pagePath: string;
    /** 小程序未选中图标（图片资源需放到小程序工程对应目录） */
    iconPath?: string;
    /** 小程序选中图标 */
    selectedIconPath?: string;
}

export const TAB_BAR_ITEMS: TabBarItem[] = [
    {
        id: 'home',
        path: '/home',
        label: '首页',
        icon: Home,
        pagePath: 'pages/home/index',
        iconPath: 'static/tabbar/home.png',
        selectedIconPath: 'static/tabbar/home-active.png',
    },
    {
        id: 'products',
        path: '/products',
        label: '商品',
        icon: ShoppingBag,
        pagePath: 'pages/products/index',
        iconPath: 'static/tabbar/products.png',
        selectedIconPath: 'static/tabbar/products-active.png',
    },
    {
        id: 'cart',
        path: '/cart',
        label: '购物车',
        icon: ShoppingCart,
        pagePath: 'pages/cart/index',
        iconPath: 'static/tabbar/cart.png',
        selectedIconPath: 'static/tabbar/cart-active.png',
    },
    {
        id: 'orders',
        path: '/orders',
        label: '订单',
        icon: ListOrdered,
        pagePath: 'pages/orders/index',
        iconPath: 'static/tabbar/orders.png',
        selectedIconPath: 'static/tabbar/orders-active.png',
    },
    {
        // 注意：低代码平台的 pageId 仍叫 mine，这里映射到商城的 /member 页面
        id: 'mine',
        path: '/member',
        label: '我的',
        icon: User,
        pagePath: 'pages/member/index',
        iconPath: 'static/tabbar/member.png',
        selectedIconPath: 'static/tabbar/member-active.png',
    },
];

/** 小程序 app.json 的 tabBar 配置（可直接落到 miniprogram/tabbar.json） */
export const MINIPROGRAM_TAB_BAR = {
    color: '#78716c',
    selectedColor: '#f97316',
    backgroundColor: '#ffffff',
    borderStyle: 'black' as const,
    list: TAB_BAR_ITEMS.map((item) => ({
        pagePath: item.pagePath,
        text: item.label,
        iconPath: item.iconPath,
        selectedIconPath: item.selectedIconPath,
    })),
};

/** 根据当前路由取激活的 tab id */
export function getActiveTabId(pathname: string): string | undefined {
    const matched = TAB_BAR_ITEMS.find(
        (item) => pathname === item.path || pathname.startsWith(`${item.path}/`),
    );

    return matched?.id;
}

/** 根据 tab id 取 H5 路由地址 */
export function getTabPath(id: string): string | undefined {
    return TAB_BAR_ITEMS.find((item) => item.id === id)?.path;
}
