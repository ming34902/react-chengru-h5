/* eslint-disable react-hooks/exhaustive-deps -- 低代码生成页面：副作用依赖数组按平台生成逻辑保留原样 */
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import { CategorySidebar, FilterBar } from '@/components/Category';
import { Header } from '@/components/Header';
import { ProductList } from '@/components/ProductCard';
import { SearchBar } from '@/components/SearchBar';
import { useToast } from '@/components/Toast';

import { useFavorite } from '@/hooks/useFavorite';
import { useWeda } from '@/hooks/useWeda';
import { selectIsLoggedIn, useAppStore, useUserStore } from '@/stores';

import type { ProductRecord, WedaPageProps } from '@/types/weda';

// 排序选项
const sortOptions = [
    {
        id: 'recommended',
        label: '推荐',
    },
    {
        id: 'sales',
        label: '销量',
    },
    {
        id: 'price_asc',
        label: '价格↑',
    },
    {
        id: 'price_desc',
        label: '价格↓',
    },
    {
        id: 'newest',
        label: '最新',
    },
];

export default function ProductsPage(props: WedaPageProps) {
    const $w = useWeda(props.$w);
    const navigate = useNavigate();
    const incrementCartCount = useAppStore((state) => state.incrementCartCount);
    /** 本地登录态（由 useUserStore 管理） */
    const isLoggedIn = useUserStore(selectIsLoggedIn);
    /** 商品收藏（收藏数据维护在 store 的 user.collection 中） */
    const { isFavorite, toggleFavorite } = useFavorite();
    const [showSearch, setShowSearch] = useState(false);
    // 支持从首页分类入口 / 搜索面板「快速分类」带参进入（/products?category=xxx），首次渲染即选中对应分类
    const [activeCategory, setActiveCategory] = useState<string>(
        () => ($w.page.dataset.params?.category as string | undefined) ?? 'all',
    );
    const [activeSort, setActiveSort] = useState('recommended');
    const [searchQuery, setSearchQuery] = useState('');

    // 数据状态
    const [products, setProducts] = useState<ProductRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [pageNumber, setPageNumber] = useState(1);
    const [total, setTotal] = useState(0);
    const { toast } = useToast();

    // 构建查询条件
    const buildFilter = useCallback(() => {
        const conditions = [];

        // 只查询上架商品
        conditions.push({
            is_on_sale: {
                $eq: true,
            },
        });

        // 分类筛选
        if (activeCategory !== 'all') {
            conditions.push({
                category: {
                    $eq: activeCategory,
                },
            });
        }

        // 搜索筛选
        if (searchQuery) {
            conditions.push({
                name: {
                    $search: searchQuery,
                },
            });
        }
        return {
            where:
                conditions.length > 0
                    ? {
                          $and: conditions,
                      }
                    : {},
        };
    }, [activeCategory, searchQuery]);

    // 构建排序条件
    const buildOrderBy = useCallback(() => {
        switch (activeSort) {
            case 'sales':
                return [
                    {
                        sales: 'desc',
                    },
                ];
            case 'price_asc':
                return [
                    {
                        price: 'asc',
                    },
                ];
            case 'price_desc':
                return [
                    {
                        price: 'desc',
                    },
                ];
            case 'newest':
                return [
                    {
                        createdAt: 'desc',
                    },
                ];
            default:
                return [
                    {
                        is_featured: 'desc',
                    },
                    {
                        sales: 'desc',
                    },
                ];
        }
    }, [activeSort]);

    // 查询商品数据
    const fetchProducts = useCallback(
        async (isLoadMore = false) => {
            try {
                if (isLoadMore) {
                    setLoadingMore(true);
                } else {
                    setLoading(true);
                }
                const currentPage = isLoadMore ? pageNumber + 1 : 1;
                const result = await $w.cloud.callDataSource({
                    dataSourceName: 'shop_product',
                    methodName: 'wedaGetRecordsV2',
                    params: {
                        filter: buildFilter(),
                        orderBy: buildOrderBy(),
                        select: {
                            $master: true,
                        },
                        getCount: true,
                        pageSize: 12,
                        pageNumber: currentPage,
                    },
                });
                if (result) {
                    // 转换数据格式
                    const formattedProducts = (result.records || []).map((item) => ({
                        id: item._id,
                        name: item.name,
                        price: item.price,
                        originalPrice: item.original_price,
                        image: item.image,
                        rating: item.rating || 5,
                        sales: item.sales || 0,
                        category: item.category,
                        stock: item.stock || 0,
                    }));
                    if (isLoadMore) {
                        setProducts((prev) => [...prev, ...formattedProducts]);
                        setPageNumber(currentPage);
                    } else {
                        setProducts(formattedProducts);
                        setPageNumber(1);
                    }
                    setTotal(result.total || 0);
                    setHasMore(formattedProducts.length === 12);
                }
            } catch (error) {
                console.error('查询商品失败:', error);
                toast({
                    title: '加载失败',
                    description: '无法获取商品数据，请稍后重试',
                    variant: 'destructive',
                });
            } finally {
                setLoading(false);
                setLoadingMore(false);
            }
        },
        [$w.cloud, buildFilter, buildOrderBy, pageNumber, toast],
    );

    // 初始化加载
    useEffect(() => {
        fetchProducts(false);
    }, [activeCategory, activeSort, searchQuery]);

    // 处理搜索
    const handleSearch = (query: string) => {
        setShowSearch(false);
        setSearchQuery(query);
        if (query) {
            toast({
                title: '搜索结果',
                description: `正在搜索 "${query}"`,
            });
        }
    };

    // 处理添加购物车
    const handleAddToCart = (product: ProductRecord) => {
        // 检查是否登录（低代码平台注入的 currentUser 优先，其次取 store 管理的本地登录态）
        if (!$w.auth.currentUser && !isLoggedIn) {
            toast({
                title: '请先登录',
                description: '登录后可将商品加入购物车',
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
    };

    // 处理商品点击
    const handleProductClick = (product: ProductRecord) => {
        $w.utils.navigateTo({
            pageId: 'product-detail',
            params: {
                id: product.id,
            },
        });
    };

    // 处理加载更多
    const handleLoadMore = () => {
        if (!loadingMore && hasMore) {
            fetchProducts(true);
        }
    };

    // 处理分类切换
    const handleCategoryChange = (categoryId: string) => {
        setActiveCategory(categoryId);
        setSearchQuery('');
    };

    /**
     * 搜索面板「快速分类」点击
     *
     * 快速分类携带的是商品分类 id，直接选中左侧对应的分类项（无需跳转，本页即商品列表），
     * 如果此时 URL 上已有其它 category 参数，用 replace 同步一次，保证地址栏与选中态一致。
     */
    const handleQuickCategorySelect = (categoryId: string) => {
        setShowSearch(false);
        setSearchQuery('');
        setActiveCategory(categoryId);
        navigate(`/products?category=${encodeURIComponent(categoryId)}`, { replace: true });
    };
    return (
        <div className="min-h-screen bg-background pb-20 ">
            <Header
                title="商品列表"
                showSearch
                onSearch={() => setShowSearch(true)}
                searchPlaceholder={searchQuery || '搜索商品'}
            />

            <div className="flex bg-gray-50/95">
                {/* Category Sidebar */}
                <CategorySidebar
                    activeCategory={activeCategory}
                    onCategoryChange={handleCategoryChange}
                />

                {/* Main Content */}
                <div className="flex-1 bg-gray-50/95">
                    {/* Filter Bar */}
                    <FilterBar
                        sortOptions={sortOptions}
                        activeSort={activeSort}
                        onSortChange={setActiveSort}
                        onFilterClick={() =>
                            toast({
                                title: '筛选',
                                description: '高级筛选功能开发中',
                            })
                        }
                        
                    />

                    {/* Products Grid */}
                    <div className="p-3">
                        <div className="mb-3 text-sm text-stone-400">
                            {loading ? '加载中...' : `共 ${total} 个商品`}
                        </div>
                        <ProductList
                            products={products}
                            onProductClick={handleProductClick}
                            onAddToCart={handleAddToCart}
                            onLoadMore={handleLoadMore}
                            hasMore={hasMore}
                            loading={loading}
                            loadingMore={loadingMore}
                            isFavorite={isFavorite}
                            onToggleFavorite={toggleFavorite}
                        />
                    </div>
                </div>
            </div>

            {showSearch && (
                <SearchBar
                    onSearch={handleSearch}
                    onClose={() => setShowSearch(false)}
                    onCategorySelect={handleQuickCategorySelect}
                />
            )}
        </div>
    );
}
