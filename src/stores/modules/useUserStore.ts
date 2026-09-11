import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import type { FavoriteModel, UserModel } from '@/types/api';

/**
 * 用户 store
 *
 * 统一管理登录态：
 * - token：登录接口（POST /auth/login、POST /auth/register）返回的凭证，配合 persist 刷新页面不丢失
 * - user：当前登录用户对象（UserModel，包含收藏商品集合 collection）
 *
 * 退出登录时需要同时清理本地 token（见 src/utils/auth.ts 的 logoutUser）
 */

interface State {
    /** 登录凭证（本地 mock 返回 mock-token），空字符串表示未登录 */
    token: string;
    /** 当前登录用户（包含收藏 collection） */
    user: UserModel | null;
}

type Action = {
    /** 登录：写入 token 与用户信息（登录态由 store 统一管理） */
    login: (payload: { token: string; user: UserModel }) => void;
    /** 退出登录：清空 token / 用户信息 / 收藏 */
    logout: () => void;
    /** 局部更新用户信息 */
    updateUser: (payload: Partial<UserModel>) => void;
    /** 收藏 / 取消收藏商品 */
    toggleCollection: (product: FavoriteModel) => void;
    /** 移除指定收藏商品 */
    removeCollection: (id: string | number) => void;
    /** 清空收藏 */
    clearCollection: () => void;
};

/** 是否已登录（登录态统一从 store 读取） */
export const selectIsLoggedIn = (state: State & Action): boolean => Boolean(state.token);

/** 收藏为空时的稳定引用：避免 selector 每次返回新数组导致组件无意义重渲染 */
const EMPTY_COLLECTION: FavoriteModel[] = [];

/** 收藏商品列表 */
export const selectCollection = (state: State & Action): FavoriteModel[] =>
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
