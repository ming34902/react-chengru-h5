import { useUserStore } from '@/stores';

import { authApi } from '@/api/auth';
import type { LoginResult } from '@/types/api';

/**
 * 登录 / 退出登录的统一入口
 *
 * - 登录态统一由 useUserStore 管理（persist 到 localStorage，刷新页面不丢失）
 * - mock-token 由 authApi 读写（登录写入、退出登录清理）
 */

/** 登录成功后调用：把伪造接口返回的 mock-token 与用户信息写入 store */
export function loginUser(result: LoginResult): void {
    useUserStore.getState().login(result);
}

/**
 * 退出登录（清理本地 mock-token + store 中的登录态 / 用户信息 / 收藏）
 *
 * 注意：需要先弹二次确认弹窗，用户点「确定」后再调用本方法。
 */
export async function logoutUser(): Promise<void> {
    // 清理本地 mock-token
    await authApi.logout();
    // 清理 store 登录态（含用户信息与收藏）
    useUserStore.getState().logout();
}
