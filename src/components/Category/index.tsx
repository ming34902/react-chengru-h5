import { useState } from 'react';

import { ChevronRight } from 'lucide-react';

/** 分类项 */
export interface CategoryItem {
    id: string;
    name: string;
    icon: string;
}

/** 排序项 */
export interface SortOption {
    id: string;
    label: string;
}

/** 默认分类 */
export const defaultCategories: CategoryItem[] = [
    { id: 'all', name: '全部', icon: '🏪' },
    { id: 'clothing', name: '女装', icon: '👗' },
    { id: 'mens', name: '男装', icon: '👔' },
    { id: 'beauty', name: '美妆', icon: '💄' },
    { id: 'digital', name: '数码', icon: '📱' },
    { id: 'home', name: '家居', icon: '🏠' },
    { id: 'food', name: '美食', icon: '🍪' },
    { id: 'sports', name: '运动', icon: '⚽' },
    { id: 'books', name: '图书', icon: '📚' },
    { id: 'toys', name: '玩具', icon: '🎁' },
];

export interface CategorySidebarProps {
    /** 分类列表，默认使用内置分类 */
    categories?: CategoryItem[];
    /** 当前选中的分类 id */
    activeCategory?: string;
    /** 切换分类回调 */
    onCategoryChange?: (id: string) => void;
}

/** 左侧分类侧边栏 */
export function CategorySidebar({
    categories = defaultCategories,
    activeCategory,
    onCategoryChange,
}: CategorySidebarProps) {
    return (
        <div className="w-20 flex-shrink-0 overflow-y-auto bg-stone-50">
            <div className="py-2">
                {categories.map((category) => (
                    <button
                        type="button"
                        key={category.id}
                        onClick={() => onCategoryChange?.(category.id)}
                        className={`w-full flex flex-col items-center gap-1 py-3 px-2 transition-colors ${
                            activeCategory === category.id
                                ? 'bg-white text-primary-600'
                                : 'text-stone-500 hover:bg-stone-100'
                        }`}
                    >
                        <span className="text-2xl">{category.icon}</span>
                        <span className="text-xs font-medium truncate w-full text-center">
                            {category.name}
                        </span>
                        {activeCategory === category.id && (
                            <div className="absolute left-0 w-1 h-6 bg-primary-500 rounded-r-full" />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
export interface FilterBarProps {
    /** 排序选项 */
    sortOptions: SortOption[];
    /** 当前排序 id */
    activeSort?: string;
    /** 切换排序回调 */
    onSortChange?: (id: string) => void;
    /** 点击筛选按钮回调 */
    onFilterClick?: () => void;
}

/** 商品列表顶部的排序 / 筛选栏 */
export function FilterBar({
    sortOptions,
    activeSort,
    onSortChange,
    onFilterClick,
}: FilterBarProps) {
    return (
        <div className="sticky sticky-fix-keep-px top-14 z-20 border-b border-stone-100 bg-white">
            <div className="flex items-center justify-between py-2 px-4 max-w-lg mx-auto">
                <div className="flex items-center gap-4">
                    {sortOptions.map((option) => (
                        <button
                            type="button"
                            key={option.id}
                            onClick={() => onSortChange?.(option.id)}
                            className={`text-sm  px-2 bg-transparent font-medium transition-colors ${
                                activeSort === option.id ? 'text-primary-600' : 'text-stone-500'
                            }`}
                        >
                            {option.label}
                            {option.id === 'price' && (
                                <span className="ml-0.5 inline-block">
                                    {activeSort === 'price' ? '↑' : '↓'}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
                <button
                    type="button"
                    onClick={onFilterClick}
                    className="w-16 px-2 h-8 flex-shrink-0 flex items-center gap-1 rounded-md bg-gray-70/95 text-sm text-stone-500 hover:text-primary-600 transition-colors"
                >
                    <span>筛选</span>
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

export interface CategoryPageProps {
    /** 分类列表，默认使用内置分类 */
    categories?: CategoryItem[];
    /** 选择分类（取消时回传 null） */
    onCategorySelect?: (category: CategoryItem | null) => void;
}

/** 分类选择弹层 */
export function CategoryPage({ categories, onCategorySelect }: CategoryPageProps) {
    // 修复：原实现存入的是整个分类对象，却与 category.id 比较，导致选中态永远不生效
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

    const handleSelect = (category: CategoryItem) => {
        setSelectedCategoryId(category.id);
        onCategorySelect?.(category);
    };

    return (
        <div className="fixed inset-0 z-50 bg-white">
            <div className="sticky sticky-fix-keep-px top-0 z-10 border-b border-stone-100 bg-white">
                <div className="flex items-center justify-between h-14 px-4">
                    <span className="font-serif text-lg font-semibold text-stone-800">
                        选择分类
                    </span>
                    <button
                        type="button"
                        onClick={() => onCategorySelect?.(null)}
                        className="text-sm text-stone-500"
                    >
                        取消
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3 p-4 max-w-lg mx-auto">
                {(categories ?? defaultCategories).map((category) => (
                    <button
                        type="button"
                        key={category.id}
                        onClick={() => handleSelect(category)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-colors ${
                            selectedCategoryId === category.id
                                ? 'border-primary-500 bg-primary-50'
                                : 'border-stone-100 hover:border-stone-200'
                        }`}
                    >
                        <span className="text-4xl">{category.icon}</span>
                        <span
                            className={`text-sm font-medium ${
                                selectedCategoryId === category.id
                                    ? 'text-primary-600'
                                    : 'text-stone-600'
                            }`}
                        >
                            {category.name}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
