import { useState } from 'react';

import { Clock, Search, TrendingUp, X } from 'lucide-react';

export interface SearchBarProps {
    /** 触发搜索（点击历史/热门/分类，或输入后回车） */
    onSearch?: (keyword: string) => void;
    /** 关闭搜索面板 */
    onClose?: () => void;
    /** 是否展示搜索历史 */
    showHistory?: boolean;
    /** 输入框占位文案 */
    placeholder?: string;
}

/** 快速分类入口 */
interface QuickCategory {
    name: string;
    icon: string;
}

/** 搜索历史在 localStorage 中的存储 key */
const SEARCH_HISTORY_KEY = 'recentSearches';

/** 读取本地搜索历史（作为 useState 的惰性初始值，避免在 effect 中同步 setState） */
function readSearchHistory(): string[] {
    const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (!stored) return [];

    try {
        const parsed: unknown = JSON.parse(stored);
        return Array.isArray(parsed) ? (parsed as string[]) : [];
    } catch {
        // 历史数据损坏时忽略，不影响页面使用
        return [];
    }
}

/** 热门搜索词 */
const popularSearches: string[] = ['连衣裙', '运动鞋', '护肤套装', '智能手表', '零食大礼包'];

/** 快速分类 */
const quickCategories: QuickCategory[] = [
    { name: '服饰', icon: '👗' },
    { name: '美妆', icon: '💄' },
    { name: '数码', icon: '📱' },
    { name: '家居', icon: '🏠' },
    { name: '食品', icon: '🍪' },
    { name: '运动', icon: '⚽' },
];

export function SearchBar({
    onSearch,
    onClose,
    showHistory = true,
    placeholder = '搜索商品',
}: SearchBarProps) {
    const [query, setQuery] = useState<string>('');
    const [recentSearches, setRecentSearches] = useState<string[]>(readSearchHistory);

    const handleSearch = (value?: string) => {
        const searchTerm = value ?? query;
        if (!searchTerm.trim()) return;

        // 保存搜索历史：去重 + 最多 10 条
        const updated = [searchTerm, ...recentSearches.filter((item) => item !== searchTerm)].slice(
            0,
            10,
        );
        setRecentSearches(updated);
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
        onSearch?.(searchTerm);
    };

    const clearRecentSearches = () => {
        setRecentSearches([]);
        localStorage.removeItem(SEARCH_HISTORY_KEY);
    };

    const removeSearchItem = (item: string) => {
        const updated = recentSearches.filter((searchItem) => searchItem !== item);
        setRecentSearches(updated);
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
    };

    return (
        <div className="fixed inset-0 z-50 bg-background">
            {/* 搜索头部 */}
            <div className="sticky sticky-fix-keep-px top-0 z-10 border-b border-stone-100 bg-white">
                <div className="flex items-center gap-3 h-14 px-4 max-w-lg mx-auto">
                    <div className="flex-1 flex items-center gap-2 px-4 py-2 bg-stone-100 rounded-full">
                        <Search className="w-4 h-4 text-stone-400" />
                        <input
                            type="text"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') handleSearch();
                            }}
                            placeholder={placeholder}
                            className="flex-1 bg-transparent outline-none text-sm text-stone-800 placeholder:text-stone-400"
                            autoFocus
                        />
                        {query && (
                            <button type="button" onClick={() => setQuery('')}>
                                <X className="w-4 h-4 text-stone-400" />
                            </button>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => onClose?.()}
                        className="text-sm text-stone-600 font-medium"
                    >
                        取消
                    </button>
                </div>
            </div>

            {/* 搜索内容 */}
            <div className="max-w-lg mx-auto px-4 py-6 overflow-y-auto max-h-[calc(100vh-56px)]">
                {/* 搜索历史 */}
                {showHistory && recentSearches.length > 0 && (
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-stone-800">搜索历史</h3>
                            <button
                                type="button"
                                onClick={clearRecentSearches}
                                className="text-xs text-stone-400 hover:text-stone-600"
                            >
                                清空
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {recentSearches.map((item) => (
                                <div
                                    key={item}
                                    className="group flex items-center gap-1 px-3 py-1.5 bg-stone-100 rounded-full text-sm text-stone-600 hover:bg-stone-200 cursor-pointer transition-colors"
                                >
                                    <Clock className="w-3 h-3" />
                                    <span onClick={() => handleSearch(item)}>{item}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeSearchItem(item)}
                                        className="ml-1 opacity-0 group-hover:opacity-100"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 热门搜索 */}
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-4 h-4 text-secondary-500" />
                        <h3 className="font-semibold text-stone-800">热门搜索</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {popularSearches.map((item, index) => (
                            <button
                                type="button"
                                key={item}
                                onClick={() => handleSearch(item)}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                    index === 0
                                        ? 'bg-secondary-500 text-white'
                                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                }`}
                            >
                                {item}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 快速分类 */}
                <div>
                    <h3 className="font-semibold text-stone-800 mb-3">快速分类</h3>
                    <div className="grid grid-cols-3 gap-2">
                        {quickCategories.map((category) => (
                            <button
                                type="button"
                                key={category.name}
                                onClick={() => handleSearch(category.name)}
                                className="flex flex-col items-center gap-1 p-4 bg-white rounded-xl border border-stone-100 hover:border-primary-200 hover:bg-primary-50 transition-colors"
                            >
                                <span className="text-2xl">{category.icon}</span>
                                <span className="text-xs text-stone-600">{category.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SearchBar;
