import { type FC, type ReactNode, Suspense } from 'react';

import { SpinLoading } from 'antd-mobile';

import RouteAnimator from './RouteAnimation';

// 定义 Loading 组件
// 背景与页面保持一致（page-content-bg）：懒加载兜底出现时不会「刷」的一下白屏
const Loading = () => (
    <div className="page-content-bg flex min-h-screen flex-col items-center justify-center">
        <SpinLoading color="primary" style={{ '--size': '30px' }}></SpinLoading>
        <p>Loading...</p>
    </div>
);

/**
 * 页面包装：统一套上路由过渡动画
 *
 * 注意：RouteAnimator 必须静态引入（原来用 lazy + <Suspense fallback={<Component />}>）。
 * 否则动画组件的 chunk 还没加载完时会先渲染裸的 <Component />，
 * 等动画组件加载完再被 RouteAnimator 包一层 —— 同一页面会「先出现 → 卸载 → 重新挂载」，
 * 表现为切换页面时"刷"的一下闪屏（并且数据会重新请求、滚动位置丢失）。
 * 是否开启动画由 RouteAnimator 内部读取 useThemeStore 决定。
 */
const LazyLoadWrapper: FC<{ component: FC }> = ({ component: Component }) => (
    <RouteAnimator>
        <Component />
    </RouteAnimator>
);

/**
 * 创建一个带动画的懒加载包装器
 * @param Component 要包装的组件
 * @returns 包含动画和加载状态的包装组件
 */
export const LazyLoad = (Component: FC): ReactNode => {
    return (
        <Suspense fallback={<Loading />}>
            <LazyLoadWrapper component={Component} />
        </Suspense>
    );
};
