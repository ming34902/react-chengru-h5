import { MOCK_TOKEN_KEY } from '@/constants/auth';
import type {
    CreateUserRequest,
    LoginRequest,
    LoginResult,
    RegisterRequest,
    UserInfoQuery,
    UserModel,
} from '@/types/api';

import { http } from './request';

/**
 * 登录 / 注册 / 用户接口
 *
 * 只使用 GET / POST，路径与 docs/apifox.json 保持一致（本地 mock 与 Apifox 云 mock 通用）：
 *   POST /auth/login    登录
 *   POST /auth/register 注册（注册成功即登录）
 *   POST /user/create   创建用户
 *   GET  /user/info     获取用户信息（个人中心）
 *
 * 登录成功后把接口返回的 token 落到 localStorage（key: mock-token，见 src/constants/auth.ts），
 * 用户信息交给 useUserStore 存储并持久化，刷新页面不会丢登录态；退出登录时清理本地 token。
 */
export const authApi = {
    /** 登录 POST /auth/login */
    async login(payload: LoginRequest): Promise<LoginResult> {
        const result = await http.post<LoginResult>('/auth/login', payload);
        // 保存登录凭证（退出登录时由 logout 清理）
        localStorage.setItem(MOCK_TOKEN_KEY, result.token);
        return result;
    },

    /** 注册 POST /auth/register（成功即登录） */
    async register(payload: RegisterRequest): Promise<LoginResult> {
        const result = await http.post<LoginResult>('/auth/register', payload);
        localStorage.setItem(MOCK_TOKEN_KEY, result.token);
        return result;
    },

    /** 创建用户 POST /user/create */
    createUser(payload: CreateUserRequest): Promise<UserModel> {
        return http.post<UserModel>('/user/create', payload);
    },

    /** 获取用户信息（个人中心，含收藏列表）GET /user/info */
    getUserInfo(params: UserInfoQuery = {}): Promise<UserModel> {
        return http.get<UserModel>('/user/info', params);
    },

    /** 退出登录：清理本地 mock-token */
    async logout(): Promise<void> {
        localStorage.removeItem(MOCK_TOKEN_KEY);
    },

    /** 读取本地 mock-token（刷新页面后可用于校验登录态） */
    getToken(): string {
        return localStorage.getItem(MOCK_TOKEN_KEY) ?? '';
    },

    /** 是否已登录（以本地 mock-token 为准） */
    isLoggedIn(): boolean {
        return Boolean(this.getToken());
    },
};
