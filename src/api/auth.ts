import { MOCK_TOKEN_KEY, MOCK_TOKEN_PREFIX } from '@/constants/auth';
import type { LoginPayload, LoginResult, UserInfo } from '@/types/user';

/**
 * 登录 / 用户接口（本地伪造）
 *
 * 背景：项目当前没有真实后端，登录成功后由这里「伪造」一个接口返回本地模拟的 mock-token，
 * 并把 token 落到 localStorage（等价于后端下发凭证），用户信息交给 useUserStore 存储，
 * 这样刷新页面后登录态依然存在（store + persist），退出登录时再清理本地 mock-token。
 *
 * 说明：本文件不发起任何网络请求，接入真实后端时只需把 authApi 内部实现换成 http.post 即可，
 * 调用方（登录页 / 会员页）与 store 不需要改动。
 */

/** 模拟接口耗时（毫秒），让 loading 态能被看到 */
const MOCK_DELAY = 500;

/** 模拟网络延迟 */
function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 生成一个本地模拟的 mock-token
 * 形如：mock-token-admin-1730000000000-ab12cd34
 */
function createMockToken(username: string): string {
    const random = Math.random().toString(36).slice(2, 10);
    return `${MOCK_TOKEN_PREFIX}-${username}-${Date.now()}-${random}`;
}

export const authApi = {
    /**
     * 伪造登录接口
     *
     * 不请求后端，直接返回本地模拟的 mock-token + 用户信息，
     * 并把 mock-token 写入 localStorage（退出登录时由 logout 清理）。
     */
    async login(payload: LoginPayload): Promise<LoginResult> {
        await sleep(MOCK_DELAY);

        const username = payload.username?.trim();
        if (!username || !payload.password) {
            throw new Error('用户名或密码不能为空');
        }

        const token = createMockToken(username);
        // 手机号登录时补全 phone 字段，便于会员页展示
        const phone = /^\d{6,}$/.test(username) ? username : undefined;
        const user: UserInfo = {
            id: `mock_user_${username}`,
            username,
            nickname: phone ? `用户${phone.slice(-4)}` : username,
            phone,
            avatar: 'https://picsum.photos/200/300',
            // 收藏列表初始为空，由 useUserStore 的收藏动作维护
            collection: [],
        };

        // 本地模拟：把 mock-token 写入本地存储，等价于后端下发的登录凭证
        localStorage.setItem(MOCK_TOKEN_KEY, token);

        return { token, user };
    },

    /** 伪造退出登录接口：清理本地 mock-token */
    async logout(): Promise<void> {
        await sleep(120);
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
