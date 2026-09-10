import { Bell, ChevronLeft, Search } from 'lucide-react';

export interface HeaderProps {
    /** 标题 */
    title: string;
    /** 是否显示返回按钮 */
    showBack?: boolean;
    /** 是否显示搜索入口 */
    showSearch?: boolean;
    /** 是否显示通知入口 */
    showNotification?: boolean;
    /** 返回按钮点击回调 */
    onBack?: () => void;
    /** 搜索入口点击回调 */
    onSearch?: () => void;
    /** 通知入口点击回调 */
    onNotification?: () => void;
    /** 搜索框占位文案 */
    searchPlaceholder?: string;
}

export function Header({
    title,
    showBack = false,
    showSearch = false,
    showNotification = false,
    onBack,
    onSearch,
    onNotification,
    searchPlaceholder = '搜索商品',
}: HeaderProps) {
    return (
        <header className="sticky top-0 z-40 border-b border-stone-100 bg-white/95 backdrop-blur-md">
            <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
                {showBack ? (
                    <button
                        type="button"
                        onClick={onBack}
                        className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-stone-100"
                    >
                        <ChevronLeft className="h-6 w-6 text-stone-700" />
                    </button>
                ) : (
                    <div className="w-10" />
                )}

                <h1 className="truncate font-serif text-xl font-semibold text-stone-800">
                    {title}
                </h1>

                {showSearch ? (
                    <button
                        type="button"
                        onClick={onSearch}
                        className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-stone-100"
                    >
                        <Search className="h-5 w-5 text-stone-600" />
                    </button>
                ) : showNotification ? (
                    <button
                        type="button"
                        onClick={onNotification}
                        className="relative flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-stone-100"
                    >
                        <Bell className="h-5 w-5 text-stone-600" />
                        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-secondary-500" />
                    </button>
                ) : (
                    <div className="w-10" />
                )}
            </div>

            {showSearch && (
                <div className="mx-auto max-w-lg px-4 pb-3">
                    <div
                        onClick={onSearch}
                        className="flex cursor-pointer items-center gap-3 rounded-full bg-stone-100 px-4 py-2.5 transition-colors hover:bg-stone-200"
                    >
                        <Search className="h-4 w-4 text-stone-400" />
                        <span className="text-sm text-stone-400">{searchPlaceholder}</span>
                    </div>
                </div>
            )}
        </header>
    );
}

export default Header;
