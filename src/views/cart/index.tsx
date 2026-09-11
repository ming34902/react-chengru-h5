import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import { CartItem, CartSummary, EmptyCart } from '@/components/CartItem';
import { Header } from '@/components/Header';
import { useToast } from '@/components/Toast';

import { useAppStore } from '@/stores';

import type { CartItemModel } from '@/types/api';
import { readCart, removeCartItem, setAllSelected, updateCartItem } from '@/utils/cartStorage';
import { buildPath } from '@/utils/router';

/**
 * 购物车页
 *
 * 数据完全由本地存储维护（localStorage，key: cart_items，见 src/utils/cartStorage.ts）：
 * 读取 readCart、勾选/改数量 updateCartItem、全选 setAllSelected、删除 removeCartItem，
 * 不调用任何接口（需求：购物车流程走本地 setStorage）。
 */
export default function CartPage() {
    const navigate = useNavigate();
    // 购物车数据以本地存储为唯一数据源，同步读取即可，无需 loading 态
    const [cartItems, setCartItems] = useState<CartItemModel[]>(readCart);
    const [selectedItems, setSelectedItems] = useState<(string | number)[]>(() =>
        cartItems.filter((item) => item.selected !== false).map((item) => item.id),
    );
    // 购物车数量统一由全局 store 管理（布局中的 TabBar 读取角标）
    const syncCartCount = useAppStore((state) => state.setCartCount);
    const { toast } = useToast();

    // 进入购物车时同步一次角标数量（以本地存储为准）
    useEffect(() => {
        syncCartCount(readCart().length);
    }, [syncCartCount]);

    // 切换选中状态（写入本地存储）
    const toggleSelect = (id: string | number) => {
        const newSelected = selectedItems.includes(id)
            ? selectedItems.filter((i) => i !== id)
            : [...selectedItems, id];
        setSelectedItems(newSelected);

        const items = updateCartItem(id, { selected: newSelected.includes(id) });
        setCartItems(items);
    };

    // 全选/取消全选（写入本地存储）
    const selectAll = () => {
        const allSelected = cartItems.length > 0 && selectedItems.length === cartItems.length;
        const newSelected = allSelected ? [] : cartItems.map((item) => item.id);
        setSelectedItems(newSelected);

        setCartItems(setAllSelected(!allSelected));
    };

    // 更新数量（写入本地存储）
    const updateQuantity = (id: string | number, quantity: number) => {
        if (quantity < 1) return;
        setCartItems(updateCartItem(id, { quantity }));
    };

    // 删除商品（写入本地存储）
    const removeItem = (id: string | number) => {
        const items = removeCartItem(id);
        setCartItems(items);
        setSelectedItems((prev) => prev.filter((i) => i !== id));
        syncCartCount(items.length);
        toast({
            title: '已删除商品',
            variant: 'success',
        });
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

        // 跳转到结算页面
        navigate(
            buildPath('/checkout', {
                items: JSON.stringify(selectedCartItems),
                from: 'cart',
            }),
        );
    };
    const selectedCartItems = cartItems.filter((item) => selectedItems.includes(item.id));
    const totalPrice = selectedCartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return (
        <div className="min-h-screen page-content-bg pb-20">
            {/*
                吸顶区域：把 Header 与「全选 / 共计商品」栏放进同一个 sticky 容器
                —— 整个吸顶区只有一个 top-0 的吸顶偏移（整数），不会再出现
                   「Header(top-0) + 全选栏(top-14)」两个吸顶元素在滚动时
                   因小数像素取整而互相错位、抖动 / 露缝的问题。
            */}
            <div className="sticky sticky-fix-keep-px top-0 z-40 bg-white">
                <Header title="购物车" />

                {cartItems.length > 0 && (
                    /* Select All Header */
                    <div className="border-b border-stone-100 bg-white">
                        <div className="flex items-center justify-between h-12 px-4 max-w-lg mx-auto">
                            <button
                                type="button"
                                onClick={selectAll}
                                className="flex items-center gap-2 bg-transparent"
                            >
                                <div
                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selectedItems.length === cartItems.length ? 'bg-primary-500 border-primary-500' : 'border-stone-300'}`}
                                >
                                    {selectedItems.length === cartItems.length && (
                                        <span className="text-xs leading-none font-bold text-white">
                                            ✓
                                        </span>
                                    )}
                                </div>
                                <span className="text-sm text-stone-600">全选</span>
                            </button>
                            <span className="text-sm text-stone-500">
                                共 {cartItems.length} 件商品
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {cartItems.length === 0 ? (
                <EmptyCart />
            ) : (
                <>
                    {/* Cart Items */}
                    <main className="max-w-lg mx-auto px-4 py-4 space-y-3 pb-40">
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
