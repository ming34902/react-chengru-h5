/**
 * 登录态相关常量
 *
 * MOCK_TOKEN_KEY：登录成功后由「伪造的接口」下发的本地模拟凭证（mock-token）
 * 在 localStorage 中的存储 key，退出登录时需要清理它。
 *
 * 放在 constants 而不是 api/store 里，是为了让 src/api/auth.ts 与 src/api/request.ts
 * 共用同一份 key，同时避免两个模块互相 import 形成循环依赖。
 */
export const MOCK_TOKEN_KEY = 'mock-token';

/** 本地模拟 token 的统一前缀 */
export const MOCK_TOKEN_PREFIX = 'mock-token';
