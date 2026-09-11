import { useCallback } from 'react';

import { useToast } from '@/components/Toast';

import { selectCollection, selectIsLoggedIn, useUserStore } from '@/stores';

import type { FavoriteModel } from '@/types/api';
import type { ProductRecord } from '@/types/weda';

/**
 * 商品收藏
 *
 * 收藏数据统一维护在 useUserStore 的 user.collection 中：
 * - 已登录：点击收藏把商品加入 collection，再次点击同一个商品则从 collection 中删除
 *   （增删判断在 store 的 toggleCollection 内按商品 id 完成）
 * - 未登录：提示先登录，不做收藏
 */
export function useFavorite() {
    const isLoggedIn = useUserStore(selectIsLoggedIn);
    const collection = useUserStore(selectCollection);
    const toggleCollection = useUserStore((state) => state.toggleCollection);
    const { toast } = useToast();

    /** 商品是否已被收藏（用于 ProductCard 心形按钮的选中态） */
    const isFavorite = useCallback(
        (product: ProductRecord) =>
            collection.some((item) => String(item.id) === String(product.id)),
        [collection],
    );

    /**
     * 收藏 / 取消收藏
     *
     * 同一个商品二次点击即取消收藏（store 内部按 id 判断）
     */
    const toggleFavorite = useCallback(
        (product: FavoriteModel) => {
            if (!isLoggedIn) {
                toast({
                    title: '请先登录',
                    description: '登录后即可收藏商品',
                    variant: 'destructive',
                });
                return;
            }

            const favorited = isFavorite(product);
            toggleCollection(product);
            toast({
                title: favorited ? '已取消收藏' : '收藏成功',
                description: product.name,
                variant: 'success',
            });
        },
        [isFavorite, isLoggedIn, toast, toggleCollection],
    );

    return { isFavorite, toggleFavorite };
}
