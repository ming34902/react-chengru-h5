import { Minus, Plus, Trash2 } from 'lucide-react';

import { useToast } from '@/components/Toast';

/** 购物车商品数据 */
export interface CartItemData {
    id: string | number;
    /** 商品名称 */
    name?: string;
    /** 规格 */
    spec?: string;
    /** 商品图片 */
    image?: string;
    /** 现价 */
    price: number;
    /** 原价（用于计算折扣） */
    originalPrice?: number;
    /** 数量 */
    quantity: number;
}

export interface CartItemProps {
    item: CartItemData;
    /** 是否选中 */
    isSelected: boolean;
    /** 切换选中状态 */
    onToggleSelect: (id: CartItemData['id']) => void;
    /** 修改数量 */
    onQuantityChange: (id: CartItemData['id'], quantity: number) => void;
    /** 删除商品 */
    onRemove: (id: CartItemData['id']) => void;
}

/** 购物车商品项组件 */
export function CartItem({
    item,
    isSelected,
    onToggleSelect,
    onQuantityChange,
    onRemove,
}: CartItemProps) {
    const { toast } = useToast();

    const discount =
        item.originalPrice && item.originalPrice > 0
            ? Math.round((1 - item.price / item.originalPrice) * 100)
            : 0;

    const handleDecrease = () => {
        if (item.quantity <= 1) {
            toast({ title: '商品数量不能少于1', variant: 'warning' });
            return;
        }
        onQuantityChange(item.id, item.quantity - 1);
    };

    const handleIncrease = () => {
        if (item.quantity >= 99) {
            toast({ title: '商品数量已达上限', variant: 'warning' });
            return;
        }
        onQuantityChange(item.id, item.quantity + 1);
    };

    const handleRemove = () => {
        onRemove(item.id);
    };

    return (
        <div
            className={`bg-white rounded-xl p-3 shadow-sm border transition-all ${
                isSelected ? 'border-primary-200' : 'border-transparent'
            }`}
        >
            <div className="flex gap-3">
                {/* 选择框 */}
                <button
                    type="button"
                    onClick={() => onToggleSelect(item.id)}
                    className="flex-shrink-0 flex items-center justify-center bg-transparent"
                >
                    <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-primary-500 border-primary-500' : 'border-stone-300'
                        }`}
                    >
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-transparent" />}
                    </div>
                </button>

                {/* 商品图片 */}
                <div className="relative flex-shrink-0">
                    <img
                        src={item.image || 'https://via.placeholder.com/80'}
                        alt={item.name ?? '商品图片'}
                        className="w-20 h-20 object-cover rounded-lg"
                    />
                    {discount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                            -{discount}%
                        </span>
                    )}
                </div>

                {/* 商品信息 */}
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-stone-800 line-clamp-2 leading-tight">
                        {item.name || '商品名称'}
                    </h3>

                    <p className="text-xs text-stone-400 mt-1">{item.spec || '默认规格'}</p>

                    <div className="flex items-center justify-between mt-2">
                        {/* 价格 */}
                        <div className="flex items-baseline gap-1">
                            <span className="text-primary-500 font-semibold">
                                ¥{item.price.toFixed(2)}
                            </span>
                            {item.originalPrice && item.originalPrice > 0 && (
                                <span className="text-xs text-stone-400 line-through">
                                    ¥{item.originalPrice.toFixed(2)}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                        {/* 数量控制 */}
                        <div className="flex items-center gap-1 bg-stone-50 rounded-lg">
                            <button
                                type="button"
                                onClick={handleDecrease}
                                className="w-7 h-7 flex items-center justify-center text-stone-500 hover:bg-stone-100 rounded-lg transition-colors"
                            >
                                <Minus size={14} />
                            </button>
                            <span className="w-8 text-center text-sm font-medium text-stone-800">
                                {item.quantity || 1}
                            </span>
                            <button
                                type="button"
                                onClick={handleIncrease}
                                className="w-7 h-7 flex items-center justify-center text-stone-500 hover:bg-stone-100 rounded-lg transition-colors"
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                    </div>
                </div>
                {/* 删除 */}
                <button
                    type="button"
                    onClick={handleRemove}
                    className="flex-shrink-0 p-1 bg-gray-70/95 rounded-md text-stone-400 hover:text-red-500 transition-colors"
                >
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
    );
}

export interface CartSummaryProps {
    /** 选中商品的总价 */
    totalPrice: number;
    /** 商品总件数（当前 UI 未使用，保留字段以兼容调用方） */
    totalItems?: number;
    /** 已选中的商品列表 */
    selectedItems: CartItemData[];
    /** 去结算回调 */
    onCheckout?: () => void;
}

/** 购物车底部结算栏 */
export function CartSummary({ totalPrice, selectedItems, onCheckout }: CartSummaryProps) {
    const selectedCount = selectedItems.length;
    const estimatedFreight = totalPrice >= 99 ? 0 : 10;

    return (
        <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-stone-100 shadow-lg z-30">
            <div className="max-w-lg mx-auto px-4">
                {/* 价格信息 */}
                <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-stone-500">
                            {selectedCount > 0 ? `已选 ${selectedCount} 件` : '请选择商品'}
                        </span>
                        {totalPrice >= 99 && selectedCount > 0 && (
                            <span className="text-xs text-green-500 bg-green-50 px-2 py-0.5 rounded-full">
                                免运费
                            </span>
                        )}
                    </div>
                    <div className="text-right">
                        <div className="flex items-baseline gap-1">
                            <span className="text-lg font-bold text-primary-500">
                                ¥{totalPrice.toFixed(2)}
                            </span>
                        </div>
                        {estimatedFreight > 0 && selectedCount > 0 && (
                            <span className="text-xs text-stone-400">
                                含运费 ¥{estimatedFreight}
                            </span>
                        )}
                    </div>
                </div>

                {/* 去结算 */}
                <button
                    type="button"
                    onClick={onCheckout}
                    disabled={selectedCount === 0}
                    className={`w-full py-3.5 rounded-xl font-medium text-white transition-all ${
                        selectedCount > 0
                            ? 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-lg shadow-primary-500/30'
                            : 'bg-stone-300 cursor-not-allowed'
                    }`}
                >
                    去结算
                </button>

                {/* 支付提示 */}
                {selectedCount > 0 && (
                    <div className="flex items-center justify-center gap-1 py-2 text-xs text-stone-400">
                        <span>支持</span>
                        <span className="text-green-500 font-medium">微信支付</span>
                        <span>安全支付</span>
                    </div>
                )}
            </div>
        </div>
    );
}

/** 空购物车占位 */
export function EmptyCart() {
    const handleGoShopping = () => {
        if (typeof window !== 'undefined' && window.__wx__) {
            window.__wx__.utils.navigateTo({ pageId: 'products' });
        }
    };

    return (
        <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-24 h-24 bg-stone-100 rounded-full flex items-center justify-center mb-4">
                <svg
                    className="w-12 h-12 text-stone-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                </svg>
            </div>
            <h3 className="text-lg font-medium text-stone-600 mb-2">购物车是空的</h3>
            <p className="text-sm text-stone-400 mb-6">快去挑选心仪的商品吧</p>
            <button
                type="button"
                onClick={handleGoShopping}
                className="px-6 py-2.5 bg-primary-500 text-white rounded-full text-sm font-medium hover:bg-primary-600 transition-colors"
            >
                去逛逛
            </button>
        </div>
    );
}
