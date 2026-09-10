import { Heart, Loader2, ShoppingCart, Star } from 'lucide-react';

import type { ProductRecord } from '@/types/weda';

export interface ProductCardProps {
    /** 商品数据 */
    product: ProductRecord;
    /** 加入购物车回调 */
    onAddToCart?: (product: ProductRecord) => void;
    /** 卡片点击回调 */
    onClick?: (product: ProductRecord) => void;
    /** 是否展示快捷加购按钮 */
    showQuickAdd?: boolean;
}

export function ProductCard({
    product,
    onAddToCart,
    onClick,
    showQuickAdd = true,
}: ProductCardProps) {
    const rating = Number(product.rating ?? 0);
    const handleQuickAdd = (e: React.MouseEvent) => {
        e.stopPropagation();
        onAddToCart?.(product);
    };
    return (
        <div onClick={() => onClick?.(product)} className="group cursor-pointer">
            <div className="relative bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-soft transition-all duration-300">
                {/* Image Section */}
                <div className="relative aspect-square overflow-hidden">
                    <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Wishlist Button */}
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                        }}
                        className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors"
                    >
                        <Heart className="w-4 h-4 text-stone-400 hover:text-secondary-500 transition-colors" />
                    </button>

                    {/* Sale Tag */}
                    {product.originalPrice && product.originalPrice > product.price && (
                        <div className="absolute top-3 left-3 px-2 py-1 bg-secondary-500 text-white text-xs font-semibold rounded-md">
                            {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                        </div>
                    )}

                    {/* Quick Add Button */}
                    {showQuickAdd && (
                        <button
                            type="button"
                            onClick={handleQuickAdd}
                            className="absolute bottom-3 right-3 w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:bg-primary-600"
                        >
                            <ShoppingCart className="w-5 h-5 text-white" />
                        </button>
                    )}
                </div>

                {/* Info Section */}
                <div className="p-4">
                    <h3 className="font-medium text-stone-800 line-clamp-2 leading-snug group-hover:text-primary-600 transition-colors">
                        {product.name}
                    </h3>

                    {/* Rating */}
                    {rating > 0 && (
                        <div className="flex items-center gap-1 mt-2">
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                            <span className="text-sm text-stone-500">{rating.toFixed(1)}</span>
                            <span className="text-xs text-stone-400">({product.sales || 0})</span>
                        </div>
                    )}

                    {/* Price */}
                    <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-xl font-bold text-primary-600">
                            ¥
                            {typeof product.price === 'number'
                                ? product.price.toFixed(2)
                                : product.price}
                        </span>
                        {product.originalPrice && product.originalPrice > product.price && (
                            <span className="text-sm text-stone-400 line-through">
                                ¥
                                {typeof product.originalPrice === 'number'
                                    ? product.originalPrice.toFixed(2)
                                    : product.originalPrice}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// 骨架屏组件
export function ProductCardSkeleton() {
    return (
        <div className="bg-white rounded-2xl overflow-hidden shadow-card">
            <div className="aspect-square bg-stone-200 animate-pulse" />
            <div className="p-4 space-y-3">
                <div className="h-4 bg-stone-200 rounded animate-pulse w-3/4" />
                <div className="h-3 bg-stone-200 rounded animate-pulse w-1/2" />
                <div className="h-5 bg-stone-200 rounded animate-pulse w-1/3" />
            </div>
        </div>
    );
}

// 加载更多组件
export interface LoadMoreButtonProps {
    /** 加载更多回调 */
    onClick?: () => void;
    /** 是否加载中 */
    loading?: boolean;
    /** 是否还有更多 */
    hasMore?: boolean;
}

export function LoadMoreButton({ onClick, loading, hasMore }: LoadMoreButtonProps) {
    if (!hasMore) return null;
    return (
        <div className="flex justify-center py-6">
            <button
                type="button"
                onClick={onClick}
                disabled={loading}
                className="px-8 py-2.5 border-2 border-stone-200 text-stone-600 rounded-full font-medium hover:border-primary-500 hover:text-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? '加载中...' : '加载更多'}
            </button>
        </div>
    );
}

// 空状态组件
export interface EmptyProductsProps {
    /** 提示文案 */
    message?: string;
}

export function EmptyProducts({ message = '暂无商品' }: EmptyProductsProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-24 h-24 bg-stone-100 rounded-full flex items-center justify-center mb-4">
                <ShoppingCart className="w-10 h-10 text-stone-300" />
            </div>
            <p className="text-stone-400 text-base">{message}</p>
        </div>
    );
}
export interface ProductListProps {
    /** 商品列表 */
    products: ProductRecord[];
    /** 点击商品 */
    onProductClick?: (product: ProductRecord) => void;
    /** 加入购物车 */
    onAddToCart?: (product: ProductRecord) => void;
    /** 加载更多 */
    onLoadMore?: () => void;
    /** 是否还有更多 */
    hasMore?: boolean;
    /** 首屏加载中 */
    loading?: boolean;
    /** 加载更多中 */
    loadingMore?: boolean;
}

export function ProductList({
    products,
    onProductClick,
    onAddToCart,
    onLoadMore,
    hasMore,
    loading = false,
    loadingMore = false,
}: ProductListProps) {
    // 加载状态 - 显示骨架屏
    if (loading) {
        return (
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <ProductCardSkeleton key={i} />
                    ))}
                </div>
            </div>
        );
    }

    // 空状态
    if (!loading && products.length === 0) {
        return <EmptyProducts message="暂无相关商品" />;
    }
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                {products.map((product) => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        onClick={onProductClick}
                        onAddToCart={onAddToCart}
                    />
                ))}
            </div>

            <LoadMoreButton onClick={onLoadMore} loading={loadingMore} hasMore={hasMore} />
        </div>
    );
}
