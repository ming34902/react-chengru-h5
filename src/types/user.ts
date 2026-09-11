import type { ProductRecord } from './weda';

/**
 * 用户 / 登录态相关类型
 *
 * 说明：登录流程使用「本地伪造接口」返回 mock-token（见 src/api/auth.ts），
 * 登录态由 useUserStore 统一管理（见 src/stores/modules/useUserStore.ts）。
 */

/** 收藏的商品（商品快照 + 收藏时间，直接用于收藏列表渲染） */
export interface FavoriteProduct extends ProductRecord {
    /** 收藏时间（毫秒时间戳） */
    collectedAt?: number;
}

/** 当前登录用户（包含收藏商品集合 collection） */
export interface UserInfo {
    /** 用户 id */
    id: string;
    /** 用户名（登录时输入的账号 / 手机号） */
    username: string;
    /** 昵称 */
    nickname: string;
    /** 手机号 */
    phone?: string;
    /** 头像地址 */
    avatar: string;
    /** 收藏的商品列表 */
    collection: FavoriteProduct[];
}

/** 登录入参 */
export interface LoginPayload {
    username: string;
    password: string;
}

/** 登录返回：本地模拟的 mock-token + 用户信息 */
export interface LoginResult {
    /** 本地模拟的登录凭证 */
    token: string;
    /** 登录用户信息 */
    user: UserInfo;
}
