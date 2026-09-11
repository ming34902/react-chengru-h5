import type { ReactNode } from 'react';
import { useLocation } from 'react-router';

import { AnimatePresence, motion } from 'framer-motion';

import { useThemeStore } from '@/stores';

import { animationConfigs } from '@/constants/theme';

/**
 * 路由动画包装器组件
 * @param children 需要动画的页面内容
 * @returns 带过渡动画的容器
 */
const RouteAnimator: React.FC<{ children: ReactNode }> = ({ children }) => {
    const location = useLocation();
    const isPageAnimate = useThemeStore((state) => state.isPageAnimate);
    const pageAnimateType = useThemeStore((state) => state.pageAnimateType);

    // 获取当前选择的动画配置
    const currentAnimation =
        animationConfigs[pageAnimateType as keyof typeof animationConfigs] || animationConfigs.fade;

    // 如果不开启动画，直接返回内容
    if (!isPageAnimate) {
        return <>{children}</>;
    }

    /**
     * initial={false}：页面挂载时直接呈现 animate 的最终状态，不做「从 opacity: 0 淡入」。
     *
     * 原因：每个路由元素各自持有一个 AnimatePresence，切换页面时旧页面是被 react-router 直接卸载的
     * （exit 动画根本不会执行），真正会跑的只有新页面的「进入淡入」：
     * 旧页面瞬间消失 → 新页面在 0.3s 内从**全透明**渐显，中间那几帧看到的是空白/背景色 → 就是"闪一闪"。
     * （页面底色以前是 bg-background 白色，与布局白底同色所以看不出来；
     *   改成 page-content-bg(gray-50/90) 之后页面与卡片都能看清，淡入就变成明显的闪屏。）
     *
     * 想恢复过渡动效时的正确做法：把动画提到布局层（MallLayout 的 Outlet 外套
     * AnimatePresence + mode="popLayout"），让**上一个页面保留到过渡结束**再做交叉过渡，
     * 这样任何时刻都有页面内容盖住背景，不会出现中间态。
     */
    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={location.pathname}
                initial={false}
                animate={currentAnimation.animate}
                exit={currentAnimation.exit}
                transition={currentAnimation.transition}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
};

export default RouteAnimator;
