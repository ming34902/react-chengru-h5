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
    return (
        <div className="fixed right-0 bottom-0 left-0 z-50 border-t border-stone-200 bg-white pb-[env(safe-area-inset-bottom)]">
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
                            className={`flex w-full flex-col items-center justify-center py-2 transition-colors duration-200 ${
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
