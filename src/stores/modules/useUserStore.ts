import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import type { FavoriteProduct, UserInfo } from '@/types/user';

/**
 * 用户 store
 *
 * 统一管理登录态：
 * - token：登录成功后由伪造的接口下发的本地 mock-token（配合 persist 刷新页面不丢失）
 * - user：当前登录用户对象，包含收藏商品集合 collection
 *
 * 退出登录时需要同时清理本地 mock-token（见 src/utils/auth.ts 的 logoutUser）
 */

interface State {
    /** 登录凭证：本地模拟的 mock-token，空字符串表示未登录 */
    token: string;
    /** 当前登录用户（包含收藏 collection） */
    user: UserInfo | null;
}

type Action = {
    /** 登录：写入 mock-token 与用户信息（登录态由 store 统一管理） */
    login: (payload: { token: string; user: UserInfo }) => void;
    /** 退出登录：清空 token / 用户信息 / 收藏 */
    logout: () => void;
    /** 局部更新用户信息 */
    updateUser: (payload: Partial<UserInfo>) => void;
    /** 收藏 / 取消收藏商品 */
    toggleCollection: (product: FavoriteProduct) => void;
    /** 移除指定收藏商品 */
    removeCollection: (id: string | number) => void;
    /** 清空收藏 */
    clearCollection: () => void;
};

/** 是否已登录（登录态统一从 store 读取） */
export const selectIsLoggedIn = (state: State & Action): boolean => Boolean(state.token);

/** 收藏为空时的稳定引用：避免 selector 每次返回新数组导致组件无意义重渲染 */
const EMPTY_COLLECTION: FavoriteProduct[] = [];

/** 收藏商品列表 */
export const selectCollection = (state: State & Action): FavoriteProduct[] =>
    state.user?.collection ?? EMPTY_COLLECTION;

// 创建带有Immer中间件的zustand存储
export const useUserStore = create<State & Action>()(
    immer(
        persist(
            (set) => ({
                token: '',
                user: null,
                login: ({ token, user }) =>
                    set((state) => {
                        state.token = token;
                        state.user = { ...user, collection: user.collection ?? [] };
                    }),
                logout: () =>
                    set((state) => {
                        state.token = '';
                        state.user = null;
                    }),
                updateUser: (payload) =>
                    set((state) => {
                        if (!state.user) return;
                        Object.assign(state.user, payload);
                    }),
                toggleCollection: (product) =>
                    set((state) => {
                        if (!state.user) return;
                        const list = state.user.collection;
                        const index = list.findIndex(
                            (item) => String(item.id) === String(product.id),
                        );
                        if (index >= 0) {
                            // 已收藏 → 取消收藏
                            list.splice(index, 1);
                        } else {
                            // 未收藏 → 收藏（最新的放最前面）
                            list.unshift({ ...product, collectedAt: Date.now() });
                        }
                    }),
                removeCollection: (id) =>
                    set((state) => {
                        if (!state.user) return;
                        state.user.collection = state.user.collection.filter(
                            (item) => String(item.id) !== String(id),
                        );
                    }),
                clearCollection: () =>
                    set((state) => {
                        if (!state.user) return;
                        state.user.collection = [];
                    }),
            }),
            {
                name: 'app-user-store',
                storage: createJSONStorage(() => localStorage),
                partialize(state) {
                    return {
                        token: state.token,
                        user: state.user,
                    };
                },
            },
        ),
    ),
);
