import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router';

import { type CartItemData, CartSummary } from '@/components/CartItem';
import { Header } from '@/components/Header';
import { useToast } from '@/components/Toast';

import { useAppStore, useUserStore } from '@/stores';

import { orderApi } from '@/api';
import type { CartRecord } from '@/types/weda';
import { readCart, removeCartItem } from '@/utils/cartStorage';

/**
 * 确认订单页（结算页）
 *
 * 数据来源：上一个页面通过 navigate(`/checkout?items=<JSON>`) 传入，这里解析后展示。
 */
export default function CheckoutPage() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [searchParams] = useSearchParams();
    /** 购物车角标（下单成功后同步） */
    const setCartCount = useAppStore((state) => state.setCartCount);
    const storeUser = useUserStore((state) => state.user);
    const userPhone = storeUser?.phone || storeUser?.username || '';

    /** 解析 query 中的待结算商品 */
    const items = useMemo<CartRecord[]>(() => {
        const raw = searchParams.get('items');
        if (!raw) return [];

        try {
            const parsed: unknown = JSON.parse(raw);
            return Array.isArray(parsed) ? (parsed as CartRecord[]) : [];
        } catch {
            return [];
        }
    }, [searchParams]);

    /** 统一成 CartItem 组件需要的数据结构 */
    const cartItems = useMemo<CartItemData[]>(
        () =>
            items.map((item, index) => ({
                id: item.id ?? item._id ?? index,
                name: item.name ?? item.product_name,
                spec: item.spec,
                image: item.image ?? item.product_image,
                price: Number(item.price ?? 0),
                originalPrice: Number(item.original_price ?? item.originalPrice ?? 0),
                quantity: Number(item.quantity ?? 1),
            })),
        [items],
    );

    const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const handleSubmit = async () => {
        if (cartItems.length === 0) {
            toast({
                title: '暂无结算商品',
                description: '请先在购物车选择商品',
                variant: 'warning',
            });
            return;
        }

        try {
            // 订单创建（POST /orders/create）
            await orderApi.create({
                items: cartItems.map((item) => ({
                    id: item.id,
                    name: item.name,
                    image: item.image,
                    price: item.price,
                    quantity: item.quantity,
                    spec: item.spec,
                })),
                userPhone,
                address: null,
            });

            // 下单成功后：把已结算商品从本地购物车移除，并同步角标
            cartItems.forEach((item) => removeCartItem(item.id));
            setCartCount(readCart().length);

            toast({ title: '订单已提交', description: '可在订单列表查看', variant: 'success' });
            navigate('/orders');
        } catch (error) {
            toast({
                title: '提交订单失败',
                description: (error as Error).message || '请稍后重试',
                variant: 'destructive',
            });
        }
    };

    return (
        <div className="min-h-screen page-content-bg pb-32">
            <Header title="确认订单" showBack onBack={() => navigate(-1)} />

            <main className="max-w-lg mx-auto px-4 py-4 space-y-3">
                {cartItems.length === 0 ? (
                    <div className="py-20 text-center text-stone-400">暂无待结算商品</div>
                ) : (
                    cartItems.map((item) => (
                        <div key={item.id} className="flex gap-3 rounded-xl bg-white p-3 shadow-sm">
                            <img
                                src={item.image}
                                alt={item.name ?? '商品'}
                                className="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
                            />
                            <div className="flex-1 min-w-0">
                                <h3 className="line-clamp-2 text-sm font-medium text-stone-800">
                                    {item.name}
                                </h3>
                                <p className="mt-1 text-xs text-stone-400">
                                    {item.spec ?? '默认规格'}
                                </p>
                                <div className="mt-1 flex items-center justify-between">
                                    <span className="font-semibold text-primary-600">
                                        ¥{item.price.toFixed(2)}
                                    </span>
                                    <span className="text-xs text-stone-400">x{item.quantity}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </main>

            <CartSummary
                totalPrice={totalPrice}
                totalItems={cartItems.length}
                selectedItems={cartItems}
                onCheckout={handleSubmit}
            />
        </div>
    );
}
