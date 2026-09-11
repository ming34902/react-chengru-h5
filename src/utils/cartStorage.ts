import type { CartItemModel } from '@/types/api';

/**
 * 购物车本地存储（localStorage）
 *
 * 需求：购物车流程不调用接口，全部用本地存储维护
 * - 首页 / 商品列表 / 商品详情「加入购物车」→ addCartItem
 * - 购物车页：读取 readCart、勾选/改数量 updateCartItem、删除 removeCartItem
 * - 结算：页面读取已勾选商品后调用订单创建接口（POST /orders/create）
 *
 * 数据模型见 src/types/api.ts 的 CartItemModel（与 apifox 中的购物车 Schema 一致）
 */

/** localStorage key */
export const CART_STORAGE_KEY = 'cart_items';

/** 读取购物车（解析失败或非数组时返回空数组） */
export function readCart(): CartItemModel[] {
    try {
        const raw = localStorage.getItem(CART_STORAGE_KEY);
        if (!raw) return [];

        const parsed: unknown = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as CartItemModel[]) : [];
    } catch {
        return [];
    }
}

/** 写入购物车 */
export function writeCart(items: CartItemModel[]): void {
    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
        // 忽略隐私模式等写入失败
    }
}

/** 购物车条目 id（同一商品合并为一条） */
function buildCartItemId(productId: string | number | undefined, name: string): string {
    return `cart_${productId ?? name}`;
}

/** 由商品对象生成购物车条目 */
export function toCartItem(
    product: {
        id?: string | number;
        name?: string;
        price?: number;
        originalPrice?: number;
        image?: string;
    },
    quantity = 1,
    spec?: string,
): CartItemModel {
    return {
        id: buildCartItemId(product.id, product.name ?? '商品'),
        productId: product.id,
        name: product.name ?? '商品',
        image: product.image,
        price: Number(product.price ?? 0),
        originalPrice: product.originalPrice,
        quantity: Math.max(1, Number(quantity) || 1),
        spec,
        selected: true,
    };
}

/** 加入购物车（已存在则累加数量），返回最新的购物车列表 */
export function addCartItem(input: CartItemModel): CartItemModel[] {
    const items = readCart();
    const index = items.findIndex((item) => item.id === input.id);

    if (index >= 0) {
        const current = items[index];
        items[index] = {
            ...current,
            quantity: Math.min(99, current.quantity + (input.quantity || 1)),
            selected: true,
        };
    } else {
        items.unshift({ ...input, selected: true });
    }

    writeCart(items);
    return items;
}

/** 更新购物车条目（数量 / 勾选状态 / 规格） */
export function updateCartItem(
    id: string | number,
    patch: Partial<Pick<CartItemModel, 'quantity' | 'selected' | 'spec'>>,
): CartItemModel[] {
    const items = readCart().map((item) => (item.id === id ? { ...item, ...patch } : item));
    writeCart(items);
    return items;
}

/** 删除购物车条目 */
export function removeCartItem(id: string | number): CartItemModel[] {
    const items = readCart().filter((item) => item.id !== id);
    writeCart(items);
    return items;
}

/** 勾选 / 取消勾选全部 */
export function setAllSelected(selected: boolean): CartItemModel[] {
    const items = readCart().map((item) => ({ ...item, selected }));
    writeCart(items);
    return items;
}

/** 清空购物车 */
export function clearCart(): void {
    writeCart([]);
}
