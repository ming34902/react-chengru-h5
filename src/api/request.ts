/**
 * HTTP 请求层
 *
 * 说明：
 * - baseURL 来自环境变量 VITE_GLOB_API_URL（见根目录 .env.development / .env.production）
 * - 统一处理 query 参数、超时、JSON 解析、鉴权头与错误抛出
 * - 与低代码数据源的关系：src/api/shop.ts -> src/hooks/useWeda/httpDataSource.ts -> useWeda()
 */

/** 环境变量类型（与 src/types/env.d.ts 保持一致） */
interface ImportMetaEnvLike {
    VITE_GLOB_API_URL?: string;
    VITE_GLOB_API_URL_PREFIX?: string;
    VITE_APP_API_TOKEN?: string;
}

const env = import.meta.env as unknown as ImportMetaEnvLike;

/** 接口前缀，例如 /api */
const API_URL_PREFIX = env.VITE_GLOB_API_URL_PREFIX ?? '';
/** 接口地址，例如 https://api.example.com */
const API_URL = env.VITE_GLOB_API_URL ?? '';
/** 请求超时时间（毫秒） */
const DEFAULT_TIMEOUT = 15000;

/** 统一的接口错误 */
export class ApiError extends Error {
    /** HTTP 状态码（网络错误时为 0） */
    readonly status: number;
    /** 原始响应数据 */
    readonly data?: unknown;

    constructor(message: string, status = 0, data?: unknown) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
    /** 请求体（对象会被 JSON 序列化） */
    data?: unknown;
    /** query 参数 */
    params?: Record<string, unknown>;
    /** 超时时间（毫秒） */
    timeout?: number;
}

/** 读取本地 token（与路由守卫使用同一份存储） */
function getToken(): string {
    return localStorage.getItem('token') ?? env.VITE_APP_API_TOKEN ?? '';
}

/** 拼接完整 URL */
function buildUrl(url: string, params?: Record<string, unknown>): string {
    const path = /^https?:\/\//.test(url) ? url : `${API_URL}${API_URL_PREFIX}${url}`;
    if (!params) return path;

    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;
        search.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
    });

    const query = search.toString();
    return query ? `${path}${path.includes('?') ? '&' : '?'}${query}` : path;
}

/** 基础请求方法 */
export async function request<T>(url: string, options: RequestOptions = {}): Promise<T> {
    const { data, params, timeout = DEFAULT_TIMEOUT, headers, ...rest } = options;
    const token = getToken();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(buildUrl(url, params), {
            ...rest,
            signal: controller.signal,
            headers: {
                Accept: 'application/json',
                ...(data ? { 'Content-Type': 'application/json' } : {}),
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...(headers as Record<string, string> | undefined),
            },
            body: data === undefined ? undefined : JSON.stringify(data),
        });

        if (!response.ok) {
            throw new ApiError(`请求失败：${response.status}`, response.status);
        }

        // 204 等无响应体的情况
        if (response.status === 204) {
            return undefined as T;
        }

        const result = (await response.json()) as T;
        return result;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        if (error instanceof DOMException && error.name === 'AbortError') {
            throw new ApiError('请求超时，请稍后重试');
        }
        throw new ApiError((error as Error).message || '网络异常，请稍后重试');
    } finally {
        clearTimeout(timer);
    }
}

/** 快捷方法 */
export const http = {
    get: <T>(url: string, params?: Record<string, any>, options?: RequestOptions) =>
        request<T>(url, { ...options, method: 'GET', params }),
    post: <T>(url: string, data?: unknown, options?: RequestOptions) =>
        request<T>(url, { ...options, method: 'POST', data }),
    put: <T>(url: string, data?: unknown, options?: RequestOptions) =>
        request<T>(url, { ...options, method: 'PUT', data }),
    delete: <T>(url: string, params?: Record<string, any>, options?: RequestOptions) =>
        request<T>(url, { ...options, method: 'DELETE', params }),
};
