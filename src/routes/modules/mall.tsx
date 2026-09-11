import { lazy } from 'react';

import MallLayout from '@/layout/MallLayout';

import type { routeItem } from '../index';
import { LazyLoad } from '../utils/LazyLoad';

/**
 * 商城页面路由
 *
 * 统一挂在 MallLayout 下：
 * - 底部 TabBar 由布局集中渲染（配置见 src/constants/tabBar.ts），页面内不再自带 TabBar
 * - 低代码 pageId 与路由的映射见 src/hooks/useWeda/index.ts（member 页的 tab id 为 mine）
 */
const routes: routeItem[] = [
    {
        element: <MallLayout />,
        children: [
            {
                path: '/home',
                meta: { title: '首页' },
                element: LazyLoad(lazy(() => import('@/views/home'))),
            },
            {
                path: '/products',
                meta: { title: '商品列表' },
                element: LazyLoad(lazy(() => import('@/views/products'))),
            },
            {
                path: '/product-detail',
                meta: { title: '商品详情' },
                element: LazyLoad(lazy(() => import('@/views/product-detail'))),
            },
            {
                path: '/cart',
                meta: { title: '购物车' },
                element: LazyLoad(lazy(() => import('@/views/cart'))),
            },
            {
                path: '/checkout',
                meta: { title: '确认订单' },
                element: LazyLoad(lazy(() => import('@/views/checkout'))),
            },
            {
                path: '/orders',
                meta: { title: '我的订单' },
                element: LazyLoad(lazy(() => import('@/views/orders'))),
            },
            {
                path: '/order-detail',
                meta: { title: '订单详情' },
                element: LazyLoad(lazy(() => import('@/views/order-detail'))),
            },
            {
                path: '/favorites',
                meta: { title: '我的收藏' },
                element: LazyLoad(lazy(() => import('@/views/favorites'))),
            },
            {
                path: '/member',
                meta: { title: '我的' },
                element: LazyLoad(lazy(() => import('@/views/member/index'))),
            },
        ],
    },
];

export default routes;
