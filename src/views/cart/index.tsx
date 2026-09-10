/* eslint-disable react-hooks/exhaustive-deps -- 低代码生成页面：副作用依赖数组按平台生成逻辑保留原样 */
import { useEffect, useState } from 'react';

import { CartItem, CartSummary, EmptyCart } from '@/components/CartItem';
import { Header } from '@/components/Header';
import { useToast } from '@/components/Toast';

import { useWeda } from '@/hooks/useWeda';
import { useAppStore } from '@/stores';

import type { CartRecord, WedaPageProps } from '@/types/weda';

// Mock 购物车数据（备用）
const mockCartItems = [
    {
        _id: 'mock_cart_1',
        product_id: 'mock_prod_1',
        product_name: '2024新款韩版宽松休闲运动套装',
        product_image:
            'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200&h=200&fit=crop',
        price: 199.0,
        original_price: 399.0,
        quantity: 1,
        spec: '黑色 M码',
        is_selected: true,
    },
    {
        _id: 'mock_cart_2',
        product_id: 'mock_prod_2',
        product_name: '玻尿酸保湿精华液 30ml',
        product_image:
            'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=200&h=200&fit=crop',
        price: 89.0,
        original_price: 0,
        quantity: 2,
        spec: '30ml/瓶',
        is_selected: true,
    },
    {
        _id: 'mock_cart_3',
        product_id: 'mock_prod_3',
        product_name: '智能运动手表 GPS定位',
        product_image:
            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=200&fit=crop',
        price: 1299.0,
        original_price: 1999.0,
        quantity: 1,
        spec: '黑色 标准版',
        is_selected: false,
    },
];

export default function CartPage(props: WedaPageProps) {
    const $w = useWeda(props.$w);
    const auth = $w.auth;
    const [cartItems, setCartItems] = useState<CartRecord[]>([]);
    const [selectedItems, setSelectedItems] = useState<(string | number)[]>([]);
    // 购物车数量统一由全局 store 管理（布局中的 TabBar 读取角标）
    const cartCount = useAppStore((state) => state.cartCount);
    const setCartCount = useAppStore((state) => state.setCartCount);
    const [loading, setLoading] = useState(true);
    const [initialLoad, setInitialLoad] = useState(true);
    const { toast } = useToast();

    // 获取当前用户
    const currentUser = auth?.currentUser;
    const userPhone = currentUser?.name || currentUser?.phone || '';

    // 查询真实购物车数据
    const fetchCartItems = async () => {
        if (!userPhone) {
            // 未登录时使用本地存储
            loadLocalCart();
            return;
        }
        try {
            setLoading(true);
            const result = await $w.cloud.callDataSource({
                dataSourceName: 'shop_cart',
                methodName: 'wedaGetRecordsV2',
                params: {
                    query: {
                        user_phone: userPhone,
                    },
                    sort: {
                        createdAt: -1,
                    },
                    limit: 100,
                },
            });
            if (result?.data?.records && result.data.records.length > 0) {
                // 转换为页面需要的格式
                const records = (result.data.records || []) as CartRecord[];
                const items = await Promise.all(
                    records.map(async (record: CartRecord) => {
                        // 查询商品详情
                        let productInfo = {
                            name: record.product_name || '',
                            image: record.product_image || '',
                            price: record.price || 0,
                            original_price: record.original_price || 0,
                        };
                        if (record.product_id) {
                            try {
                                const productResult = await $w.cloud.callDataSource({
                                    dataSourceName: 'shop_product',
                                    methodName: 'wedaGetItemV2',
                                    params: {
                                        query: {
                                            _id: record.product_id,
                                        },
                                    },
                                });
                                if (productResult?.data) {
                                    productInfo = {
                                        name: productResult.data.name || record.product_name || '',
                                        image:
                                            productResult.data.image || record.product_image || '',
                                        price: productResult.data.price || record.price || 0,
                                        original_price:
                                            productResult.data.original_price ||
                                            record.original_price ||
                                            0,
                                    };
                                }
                            } catch (e) {
                                console.log('获取商品详情失败', e);
                            }
                        }
                        return {
                            id: record._id,
                            product_id: record.product_id,
                            name: productInfo.name,
                            price: productInfo.price,
                            originalPrice: productInfo.original_price,
                            image: productInfo.image,
                            quantity: record.quantity || 1,
                            spec: record.spec || '默认规格',
                            is_selected: record.is_selected !== false,
                        };
                    }),
                );
                setCartItems(items as CartRecord[]);
                setSelectedItems(
                    items.filter((item) => item.is_selected).map((item) => String(item.id ?? '')),
                );
                setCartCount(items.length);
                saveToLocalStorage(items as CartRecord[]);
            } else {
                // 无数据时加载本地存储
                loadLocalCart();
            }
        } catch (error) {
            console.log('查询购物车失败，使用本地数据', error);
            loadLocalCart();
        } finally {
            setLoading(false);
            setInitialLoad(false);
        }
    };

    // 从本地存储加载购物车
    const loadLocalCart = () => {
        try {
            const localData = localStorage.getItem('cart_items');
            if (localData) {
                const items = JSON.parse(localData) as CartRecord[];
                setCartItems(items);
                setSelectedItems(items.filter((item) => item.is_selected).map((item) => item.id));
                setCartCount(items.length);
            } else {
                // 使用 mock 数据作为示例
                setCartItems(
                    mockCartItems.map((item) => ({
                        id: item._id,
                        product_id: item.product_id,
                        name: item.product_name,
                        price: item.price,
                        originalPrice: item.original_price,
                        image: item.product_image,
                        quantity: item.quantity,
                        spec: item.spec,
                        is_selected: item.is_selected,
                    })),
                );
                setSelectedItems(
                    mockCartItems.filter((item) => item.is_selected).map((item) => item._id),
                );
                setCartCount(mockCartItems.length);
            }
        } catch (e) {
            console.log('加载本地购物车失败', e);
        }
        setInitialLoad(false);
    };

    // 保存到本地存储
    const saveToLocalStorage = (items: CartRecord[]) => {
        try {
            localStorage.setItem('cart_items', JSON.stringify(items));
        } catch (e) {
            console.log('保存本地购物车失败', e);
        }
    };
    useEffect(() => {
        fetchCartItems();
    }, [userPhone]);

    // 切换选中状态
    const toggleSelect = async (id: string | number) => {
        const newSelected = selectedItems.includes(id)
            ? selectedItems.filter((i) => i !== id)
            : [...selectedItems, id];
        setSelectedItems(newSelected);

        // 更新本地数据
        const updatedItems = cartItems.map((item) => ({
            ...item,
            is_selected: newSelected.includes(item.id),
        }));
        saveToLocalStorage(updatedItems);

        // 如果已登录，同步到数据库
        if (userPhone) {
            try {
                const item = cartItems.find((i) => i.id === id);
                if (item) {
                    await $w.cloud.callDataSource({
                        dataSourceName: 'shop_cart',
                        methodName: 'wedaUpdateV2',
                        params: {
                            query: {
                                _id: id,
                            },
                            record: {
                                is_selected: newSelected.includes(id),
                            },
                        },
                    });
                }
            } catch (e) {
                console.log('更新选中状态失败', e);
            }
        }
    };

    // 全选/取消全选
    const selectAll = async () => {
        const newSelected =
            selectedItems.length === cartItems.length ? [] : cartItems.map((item) => item.id);
        setSelectedItems(newSelected);

        // 更新本地数据
        const updatedItems = cartItems.map((item) => ({
            ...item,
            is_selected: newSelected.includes(item.id),
        }));
        saveToLocalStorage(updatedItems);

        // 如果已登录，同步到数据库
        if (userPhone) {
            try {
                for (const id of newSelected) {
                    await $w.cloud.callDataSource({
                        dataSourceName: 'shop_cart',
                        methodName: 'wedaUpdateV2',
                        params: {
                            query: {
                                _id: id,
                            },
                            record: {
                                is_selected: true,
                            },
                        },
                    });
                }
            } catch (e) {
                console.log('同步选中状态失败', e);
            }
        }
    };

    // 更新数量
    const updateQuantity = async (id: string | number, quantity: number) => {
        if (quantity < 1) return;
        setCartItems((prev) =>
            prev.map((item) =>
                item.id === id
                    ? {
                          ...item,
                          quantity,
                      }
                    : item,
            ),
        );
        const updatedItems = cartItems.map((item) =>
            item.id === id
                ? {
                      ...item,
                      quantity,
                  }
                : item,
        );
        saveToLocalStorage(updatedItems);

        // 如果已登录，同步到数据库
        if (userPhone) {
            try {
                await $w.cloud.callDataSource({
                    dataSourceName: 'shop_cart',
                    methodName: 'wedaUpdateV2',
                    params: {
                        query: {
                            _id: id,
                        },
                        record: {
                            quantity,
                        },
                    },
                });
            } catch (e) {
                console.log('更新数量失败', e);
            }
        }
    };

    // 删除商品
    const removeItem = async (id: string | number) => {
        setCartItems((prev) => prev.filter((item) => item.id !== id));
        setSelectedItems((prev) => prev.filter((i) => i !== id));
        setCartCount(cartCount - 1);
        const remainingItems = cartItems.filter((item) => item.id !== id);
        saveToLocalStorage(remainingItems);
        toast({
            title: '已删除商品',
            variant: 'success',
        });

        // 如果已登录，从数据库删除
        if (userPhone) {
            try {
                await $w.cloud.callDataSource({
                    dataSourceName: 'shop_cart',
                    methodName: 'wedaDeleteV2',
                    params: {
                        query: {
                            _id: id,
                        },
                    },
                });
            } catch (e) {
                console.log('删除购物车商品失败', e);
            }
        }
    };

    // 结算
    const handleCheckout = () => {
        const selectedCartItems = cartItems.filter((item) => selectedItems.includes(item.id));
        if (selectedCartItems.length === 0) {
            toast({
                title: '请选择商品',
                description: '请先选择要结算的商品',
                variant: 'warning',
            });
            return;
        }

        // 检查是否有下架商品
        const unavailableItems = selectedCartItems.filter((item) => item.stock === 0);
        if (unavailableItems.length > 0) {
            toast({
                title: '部分商品已下架',
                description: '请移除已下架商品后再试',
                variant: 'destructive',
            });
            return;
        }

        // 跳转到结算页面
        $w.utils.navigateTo({
            pageId: 'checkout',
            params: {
                items: JSON.stringify(selectedCartItems),
                from: 'cart',
            },
        });
    };
    const selectedCartItems = cartItems.filter((item) => selectedItems.includes(item.id));
    const totalPrice = selectedCartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // 骨架屏加载中
    if (loading && initialLoad) {
        return (
            <div className="min-h-screen bg-background pb-20">
                <Header title="购物车" />
                <main className="max-w-lg mx-auto px-4 py-4">
                    <div className="animate-pulse space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white rounded-xl p-3 flex gap-3">
                                <div className="w-20 h-20 bg-stone-200 rounded-lg" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-stone-200 rounded w-3/4" />
                                    <div className="h-3 bg-stone-200 rounded w-1/2" />
                                    <div className="h-4 bg-stone-200 rounded w-1/4" />
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
            </div>
        );
    }
    return (
        <div className="min-h-screen bg-background pb-20">
            <Header title="购物车" />

            {cartItems.length === 0 ? (
                <EmptyCart />
            ) : (
                <>
                    {/* Select All Header */}
                    <div className="sticky top-14 z-20 bg-white/95 backdrop-blur-md border-b border-stone-100">
                        <div className="flex items-center justify-between h-12 px-4 max-w-lg mx-auto">
                            <button
                                type="button"
                                onClick={selectAll}
                                className="flex items-center gap-2"
                            >
                                <div
                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selectedItems.length === cartItems.length ? 'bg-primary-500 border-primary-500' : 'border-stone-300'}`}
                                >
                                    {selectedItems.length === cartItems.length && (
                                        <div className="w-2.5 h-2.5 rounded-full bg-white" />
                                    )}
                                </div>
                                <span className="text-sm text-stone-600">全选</span>
                            </button>
                            <span className="text-sm text-stone-500">
                                共 {cartItems.length} 件商品
                            </span>
                        </div>
                    </div>

                    {/* Cart Items */}
                    <main className="max-w-lg mx-auto px-4 py-4 space-y-3">
                        {cartItems.map((item) => (
                            <CartItem
                                key={item.id}
                                item={item}
                                isSelected={selectedItems.includes(item.id)}
                                onToggleSelect={toggleSelect}
                                onQuantityChange={updateQuantity}
                                onRemove={removeItem}
                            />
                        ))}
                    </main>

                    {/* Summary */}
                    <CartSummary
                        totalPrice={totalPrice}
                        totalItems={cartItems.length}
                        selectedItems={selectedCartItems}
                        onCheckout={handleCheckout}
                    />
                </>
            )}
        </div>
    );
}
