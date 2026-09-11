import { Heart } from 'lucide-react';

import { Header } from '@/components/Header';
import { ProductList } from '@/components/ProductCard';
import { useToast } from '@/components/Toast';

import { useWeda } from '@/hooks/useWeda';
import { selectCollection, selectIsLoggedIn, useUserStore } from '@/stores';

import type { ProductRecord, WedaPageProps } from '@/types/weda';

/**
 * 我的收藏
 *
 * 数据来源：useUserStore 中 user.collection（用户对商品的收藏记录），
 * 登录态同样取自 store，刷新页面后由 persist 恢复，不会丢。
 */
export default function FavoritesPage(props: WedaPageProps) {
    const $w = useWeda(props.$w);
    const isLoggedIn = useUserStore(selectIsLoggedIn);
    const collection = useUserStore(selectCollection);
    const removeCollection = useUserStore((state) => state.removeCollection);
    const { toast } = useToast();

    // 点击商品 → 商品详情
    const handleProductClick = (product: ProductRecord) => {
        $w.utils.navigateTo({
            pageId: 'product-detail',
            params: {
                id: product.id,
            },
        });
    };

    // 取消收藏（收藏列表页的心形按钮）
    const handleRemoveFavorite = (product: ProductRecord) => {
        removeCollection(product.id as string | number);
        toast({
            title: '已取消收藏',
            description: product.name,
            variant: 'success',
        });
    };

    // 未登录：引导去登录
    if (!isLoggedIn) {
        return (
            <div className="min-h-screen page-content-bg pb-20">
                <Header title="我的收藏" showBack onBack={() => $w.utils.navigateBack()} />
                <div className="mx-auto flex max-w-lg flex-col items-center justify-center px-4 py-20">
                    <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-stone-100">
                        <Heart className="h-10 w-10 text-stone-300" />
                    </div>
                    <h3 className="mb-2 text-lg font-medium text-stone-600">登录后查看收藏</h3>
                    <p className="mb-6 text-sm text-stone-400">登录即可同步你的收藏商品</p>
                    <button
                        type="button"
                        onClick={() => $w.utils.navigateTo({ pageId: 'member', params: {} })}
                        className="rounded-full bg-primary-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-600"
                    >
                        去登录
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen page-content-bg pb-20">
            <Header title="我的收藏" showBack onBack={() => $w.utils.navigateBack()} />

            <main className="mx-auto max-w-lg px-4 py-4">
                {collection.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-stone-100">
                            <Heart className="h-10 w-10 text-stone-300" />
                        </div>
                        <h3 className="mb-2 text-lg font-medium text-stone-600">还没有收藏商品</h3>
                        <p className="mb-6 text-sm text-stone-400">快去挑选心仪的商品吧</p>
                        <button
                            type="button"
                            onClick={() => $w.utils.navigateTo({ pageId: 'products', params: {} })}
                            className="rounded-full bg-primary-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-600"
                        >
                            去逛逛
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="mb-3 text-sm text-stone-400">
                            共 {collection.length} 件收藏商品
                        </div>
                        <ProductList
                            products={collection}
                            onProductClick={handleProductClick}
                            isFavorite={() => true}
                            onToggleFavorite={handleRemoveFavorite}
                        />
                    </>
                )}
            </main>
        </div>
    );
}
