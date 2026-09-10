import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface State {
    openEruda: boolean;
    /** 购物车商品数量（统一给底部 TabBar 显示角标） */
    cartCount: number;
}

type Action = {
    setOpenEruda: (openEruda: boolean) => void;
    setCartCount: (cartCount: number) => void;
    /** 购物车数量 +1（加入购物车场景） */
    incrementCartCount: () => void;
};

// 创建带有Immer中间件的zustand存储
export const useAppStore = create<State & Action>()(
    immer(
        persist(
            (set) => ({
                openEruda: false,
                cartCount: 0,
                setOpenEruda: (openEruda) =>
                    set((state) => {
                        state.openEruda = openEruda;
                    }),
                setCartCount: (cartCount) =>
                    set((state) => {
                        state.cartCount = cartCount;
                    }),
                incrementCartCount: () =>
                    set((state) => {
                        state.cartCount += 1;
                    }),
            }),
            {
                name: 'app-app-store',
                storage: createJSONStorage(() => localStorage),
                partialize(state) {
                    return {
                        openEruda: state.openEruda,
                        cartCount: state.cartCount,
                    };
                },
            },
        ),
    ),
);
