/* eslint-disable react-hooks/exhaustive-deps -- 低代码生成页面：副作用依赖数组按平台生成逻辑保留原样 */
import { useEffect, useState } from 'react';

import { Banner } from '@/components/Banner';
import { Header } from '@/components/Header';
import { ProductCard } from '@/components/ProductCard';
import { SearchBar } from '@/components/SearchBar';
import { useToast } from '@/components/Toast';

import { useWeda } from '@/hooks/useWeda';
import { selectIsLoggedIn, useAppStore, useUserStore } from '@/stores';

import type { ProductRecord, WedaPageProps, WedaRecord } from '@/types/weda';

// 分类数据（静态定义）
const categories = [
    {
        id: 'clothing',
        name: '女装',
        icon: '👗',
        image: 'https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=200&h=200&fit=crop',
    },
    {
        id: 'mens',
        name: '男装',
        icon: '👔',
        image: 'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=200&h=200&fit=crop',
    },
    {
        id: 'beauty',
        name: '美妆',
        icon: '💄',
        image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200&h=200&fit=crop',
    },
    {
        id: 'digital',
        name: '数码',
        icon: '📱',
        image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200&h=200&fit=crop',
    },
    {
        id: 'home',
        name: '家居',
        icon: '🏠',
        image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=200&fit=crop',
    },
    {
        id: 'food',
        name: '食品',
        icon: '🍪',
        image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&h=200&fit=crop',
    },
    {
        id: 'sports',
        name: '运动',
        icon: '⚽',
        image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=200&h=200&fit=crop',
    },
    {
        id: 'books',
        name: '图书',
        icon: '📚',
        image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=200&h=200&fit=crop',
    },
];

// 轮播图数据（静态）
const banners = [
    {
        image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&h=450&fit=crop',
        title: '秋季新品上市',
        subtitle: '全场低至5折起',
    },
    {
        image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&h=450&fit=crop',
        title: '美妆护肤专场',
        subtitle: '焕新肌肤从这里开始',
    },
    {
        image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=450&fit=crop',
        title: '数码科技节',
        subtitle: '爆款直降 价保双11',
    },
];

export default function HomePage(props: WedaPageProps) {
    const $w = useWeda(props.$w);
    const incrementCartCount = useAppStore((state) => state.incrementCartCount);
    /** 本地登录态（由 useUserStore 管理，登录成功后刷新页面不丢失） */
    const isLoggedInFromStore = useUserStore(selectIsLoggedIn);
    const { toast } = useToast();
    const [showSearch, setShowSearch] = useState(false);

    // 真实数据状态
    const [featuredProducts, setFeaturedProducts] = useState<ProductRecord[]>([]);
    const [flashDeals, setFlashDeals] = useState<ProductRecord[]>([]);
    const [loading, setLoading] = useState(true);

    // 页面加载时查询真实数据
    useEffect(() => {
        fetchProducts();
    }, []);

    // 查询推荐商品和秒杀商品
    const fetchProducts = async () => {
        try {
            setLoading(true);

            // 查询推荐商品（is_featured = true）
            const featuredResult = await $w.cloud.callDataSource({
                dataSourceName: 'shop_product',
                methodName: 'wedaGetRecordsV2',
                params: {
                    filter: {
                        where: {
                            is_featured: {
                                $eq: true,
                            },
                            is_on_sale: {
                                $eq: true,
                            },
                        },
                    },
                    select: {
                        $master: true,
                    },
                    orderBy: [
                        {
                            sales: 'desc',
                        },
                    ],
                    pageSize: 4,
                    pageNumber: 1,
                },
            });

            // 查询限时秒杀商品（上架商品中销量较高的）
            const flashResult = await $w.cloud.callDataSource({
                dataSourceName: 'shop_product',
                methodName: 'wedaGetRecordsV2',
                params: {
                    filter: {
                        where: {
                            is_on_sale: {
                                $eq: true,
                            },
                        },
                    },
                    select: {
                        $master: true,
                    },
                    orderBy: [
                        {
                            sales: 'desc',
                        },
                    ],
                    pageSize: 4,
                    pageNumber: 1,
                },
            });

            // 转换数据格式
            const transformProduct = (item: WedaRecord) => ({
                id: item._id,
                name: item.name,
                price: item.price,
                originalPrice: item.original_price,
                image: item.image,
                rating: item.rating || 4.5,
                sales: item.sales || 0,
            });
            const featured = (featuredResult.records || []).map(transformProduct);
            const flash = (flashResult.records || []).map((item, index) => ({
                ...transformProduct(item),
                progress: Math.min(100, Math.floor((item.sales || 0) / 100) + 20 * index),
            }));

            // 如果推荐商品不足4个，用其他商品补充
            if (featured.length < 4 && flashResult.records && flashResult.records.length > 0) {
                const additionalProducts = flashResult.records
                    .filter((p) => !featured.find((f) => f.id === p._id))
                    .slice(0, 4 - featured.length)
                    .map(transformProduct);
                setFeaturedProducts([...featured, ...additionalProducts]);
            } else {
                setFeaturedProducts(featured);
            }
            setFlashDeals(flash);
        } catch (error) {
            console.error('获取商品数据失败:', error);
            toast({
                title: '提示',
                description: '商品数据加载失败，请刷新重试',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };
    const handleSearch = (query: string) => {
        setShowSearch(false);
        toast({
            title: '搜索',
            description: `正在搜索: ${query}`,
            variant: 'default',
        });
        $w.utils.navigateTo({
            pageId: 'products',
            params: {
                search: query,
            },
        });
    };
    const handleAddToCart = async (product: ProductRecord) => {
        try {
            // 获取当前用户（低代码平台注入的 currentUser 优先，其次取 store 管理的本地登录态）
            const currentUser = $w.auth.currentUser;
            if (!currentUser && !isLoggedInFromStore) {
                toast({
                    title: '提示',
                    description: '请先登录后再添加购物车',
                    variant: 'destructive',
                });
                $w.utils.navigateTo({
                    pageId: 'member',
                    params: {},
                });
                return;
            }
            incrementCartCount();
            toast({
                title: '已加入购物车',
                description: product.name,
                variant: 'success',
            });
        } catch (error) {
            console.error('加入购物车失败:', error);
            toast({
                title: '加入购物车失败',
                description: (error as Error).message || '请重试',
                variant: 'destructive',
            });
        }
    };
    const handleProductClick = (product: ProductRecord) => {
        $w.utils.navigateTo({
            pageId: 'product-detail',
            params: {
                id: product.id,
            },
        });
    };
    const handleCategoryClick = (category: { id: string; name: string }) => {
        $w.utils.navigateTo({
            pageId: 'products',
            params: {
                category: category.id,
            },
        });
    };
    return (
        <div className="min-h-screen bg-background pb-20">
            <Header
                title="精选好物"
                showSearch
                showNotification
                onSearch={() => setShowSearch(true)}
                onNotification={() =>
                    toast({
                        title: '通知',
                        description: '暂无新通知',
                    })
                }
            />

            <main className="max-w-lg mx-auto px-4 py-4 space-y-6 bg-gray-50/95">
                {/* Banner */}
                <Banner banners={banners} />

                {/* Categories */}
                <section>
                    <div className="grid grid-cols-4 gap-3 ">
                        {categories.map((category) => (
                            <button
                                type="button"
                                key={category.id}
                                onClick={() => handleCategoryClick(category)}
                                className="flex flex-col items-center rounded-md gap-1.5 p-2"
                            >
                                <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center text-2xl">
                                    {category.icon}
                                </div>
                                <span className="text-xs text-stone-600">{category.name}</span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Flash Deals */}
                <section className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-4 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">⚡</span>
                            <h2 className="font-serif text-lg font-semibold">限时秒杀</h2>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                            <span>距离结束</span>
                            <span className="bg-white/20 px-1.5 py-0.5 rounded">02</span>
                            <span>:</span>
                            <span className="bg-white/20 px-1.5 py-0.5 rounded">35</span>
                            <span>:</span>
                            <span className="bg-white/20 px-1.5 py-0.5 rounded">48</span>
                        </div>
                    </div>
                    {loading ? (
                        <div className="flex gap-3 overflow-x-auto pb-1">
                            {[1, 2, 3, 4].map((i) => (
                                <div
                                    key={i}
                                    className="flex-shrink-0 w-28 bg-white/20 rounded-xl animate-pulse"
                                >
                                    <div className="aspect-square bg-stone-200" />
                                    <div className="p-2 space-y-2">
                                        <div className="h-4 bg-stone-200 rounded w-16" />
                                        <div className="h-2 bg-stone-200 rounded w-20" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
                            {flashDeals.map((product) => (
                                <div
                                    key={product.id}
                                    onClick={() => handleProductClick(product)}
                                    className="flex-shrink-0 w-28 bg-white rounded-xl overflow-hidden shadow-md cursor-pointer hover:shadow-lg transition-shadow"
                                >
                                    <div className="aspect-square bg-stone-100">
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="p-2">
                                        <p className="text-sm font-bold text-orange-600">
                                            ¥{product.price}
                                        </p>
                                        <div className="mt-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-orange-500 rounded-full"
                                                style={{
                                                    width: `${product.progress}%`,
                                                }}
                                            />
                                        </div>
                                        <p className="text-xs text-stone-400 mt-0.5">
                                            {product.progress}% 已抢
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Recommended Products */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-serif text-lg font-semibold text-stone-800">
                            为你推荐
                        </h2>
                        <button
                            type="button"
                            onClick={() =>
                                $w.utils.navigateTo({
                                    pageId: 'products',
                                    params: {},
                                })
                            }
                            className="text-sm text-stone-400 hover:text-orange-600"
                        >
                            查看更多 →
                        </button>
                    </div>
                    {loading ? (
                        <div className="grid grid-cols-2 gap-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div
                                    key={i}
                                    className="bg-white rounded-xl overflow-hidden animate-pulse"
                                >
                                    <div className="aspect-square bg-stone-200" />
                                    <div className="p-3 space-y-2">
                                        <div className="h-4 bg-stone-200 rounded w-full" />
                                        <div className="h-4 bg-stone-200 rounded w-16" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : featuredProducts.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3">
                            {featuredProducts.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onClick={handleProductClick}
                                    onAddToCart={handleAddToCart}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-stone-400">
                            <p>暂无推荐商品</p>
                        </div>
                    )}
                </section>

                {/* Bottom Banner */}
                <section className="relative rounded-2xl overflow-hidden">
                    <img
                        src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=200&fit=crop"
                        alt="promotion"
                        className="w-full h-32 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-stone-900/80 to-transparent flex items-center">
                        <div className="p-4">
                            <h3 className="font-serif text-lg font-semibold text-white">
                                新用户专享
                            </h3>
                            <p className="text-white/80 text-sm mt-1">首单立减 50 元</p>
                            <button
                                type="button"
                                onClick={() =>
                                    $w.utils.navigateTo({
                                        pageId: 'member',
                                        params: {},
                                    })
                                }
                                className="mt-3 px-4 py-1.5 bg-white text-orange-600 text-sm font-semibold rounded-full"
                            >
                                立即领取
                            </button>
                        </div>
                    </div>
                </section>
            </main>

            {showSearch && (
                <SearchBar onSearch={handleSearch} onClose={() => setShowSearch(false)} />
            )}
        </div>
    );
}
