import { TAB_BAR_ITEMS } from '@/constants/tabBar';

export interface TabBarProps {
    /** 当前激活的 tab id */
    activeTab?: string;
    /** tab 切换回调 */
    onTabChange?: (id: string) => void;
    /** 购物车数量（角标） */
    cartCount?: number;
}

/**
 * 底部 TabBar
 *
 * 统一由 src/layout/MallLayout.tsx 渲染（页面内不要再自带 TabBar）；
 * 配置来自 src/constants/tabBar.ts，H5 与微信小程序共用同一份数据。
 */
export function TabBar({ activeTab, onTabChange, cartCount = 0 }: TabBarProps) {
    /**
     * bottom-bar-fix-keep-px：只把栏体自身的背景向上下各撑出 2px（不做任何单独上色），
     * 既盖住小数像素（PC 端还有 body scale(0.8)）导致的 1~2px 缝隙，
     * 又保证「补出来的 2px」与内容区颜色完全一致 —— 因为它们是同一个背景类
     * （换背景色只需要改这里的 bg-white，补边会一起跟着变）
     *
     * 单个 tab 按钮需要 bg-transparent：@unocss/reset/tailwind-compat 里 button 的
     * background-color: transparent 被注释掉了（避免影响组件库），
     * 原生 button 会带上浏览器 UA 的灰色底，置为透明后与栏体背景保持一致
     */
    return (
        <div className="bottom-bar-fix-keep-px fixed right-0 bottom-0 left-0 z-50 border-stone-200 bg-white">
            <div className="mx-auto flex h-16 max-w-lg items-center justify-around">
                {TAB_BAR_ITEMS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    const showBadge = tab.id === 'cart' && cartCount > 0;

                    return (
                        <button
                            type="button"
                            key={tab.id}
                            onClick={() => onTabChange?.(tab.id)}
                            className={`flex w-full flex-col items-center justify-center py-2 bg-transparent transition-colors duration-200 ${
                                isActive ? 'text-primary-500' : 'text-stone-400'
                            }`}
                        >
                            <div className="relative">
                                <Icon className="h-6 w-6" strokeWidth={isActive ? 2.2 : 1.8} />
                                {showBadge && (
                                    <span className="absolute -top-1 -right-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-secondary-500 px-1 text-xs font-semibold text-white">
                                        {cartCount > 99 ? '99+' : cartCount}
                                    </span>
                                )}
                            </div>
                            <span
                                className={`mt-1 text-xs ${isActive ? 'font-semibold' : 'font-normal'}`}
                            >
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default TabBar;
