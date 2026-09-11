/**
 * HTTP 请求层（统一入口）
 *
 * 说明：
 * - 只使用 GET / POST 两种方法：查询用 GET（参数放 query）、写操作用 POST（参数放 body）
 * - 统一处理 query 参数、超时、JSON 解析、鉴权头、统一响应结构（{ code, message, data }，code = 0 成功）与错误抛出
 * - 本地 mock：VITE_USE_MOCK=true 时请求不会真的发出，而是交给 src/mock/server 处理
 *   （路径、参数、返回结构与真实接口完全一致）
 * - 接入 Apifox 云 mock：把 .env 的 VITE_USE_MOCK 置为 false，VITE_GLOB_API_URL 指向 Apifox 云 mock 地址即可
 * - 数据源链路：页面 -> src/api/dataSource.ts -> src/hooks/useWeda/httpDataSource.ts -> 本文件
 */
import { MOCK_TOKEN_KEY } from '@/constants/auth';
import { handleMockRequest } from '@/mock/server';
import { API_SUCCESS_CODE, type ApiResponse } from '@/types/api';

/** 环境变量类型（与 src/types/env.d.ts 保持一致） */
interface ImportMetaEnvLike {
    VITE_GLOB_API_URL?: string;
    VITE_GLOB_API_URL_PREFIX?: string;
    VITE_APP_API_TOKEN?: string;
    VITE_USE_MOCK?: string | boolean;
}

const env = import.meta.env as unknown as ImportMetaEnvLike;

/** 接口前缀，例如 /api */
const API_URL_PREFIX = env.VITE_GLOB_API_URL_PREFIX ?? '';
/** 接口地址，例如 https://api.example.com，或 Apifox 云 mock 地址 */
const API_URL = env.VITE_GLOB_API_URL ?? '';
/** 请求超时时间（毫秒） */
const DEFAULT_TIMEOUT = 15000;

/**
 * 是否使用本地 mock-api
 * - true：请求交给 src/mock/server 处理（默认，开箱即用）
 * - false：真实 HTTP 请求（指向 VITE_GLOB_API_URL，可替换为 Apifox 云 mock）
 */
export function isLocalMock(): boolean {
    const flag = env.VITE_USE_MOCK as unknown;
    return flag === true || flag === 'true';
}

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

/** 读取本地 token（本地 mock-token 优先，其次模板 token，与路由守卫使用同一份存储） */
function getToken(): string {
    return (
        localStorage.getItem(MOCK_TOKEN_KEY) ??
        localStorage.getItem('token') ??
        env.VITE_APP_API_TOKEN ??
        ''
    );
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

/** 解包统一响应结构；兼容后端直接返回业务数据的情况 */
function unwrap<T>(result: ApiResponse<T> | T): T {
    if (result && typeof result === 'object' && 'code' in result && 'data' in result) {
        const response = result as ApiResponse<T>;
        if (response.code !== API_SUCCESS_CODE) {
            throw new ApiError(response.message || '请求失败', response.code, response.data);
        }
        return response.data;
    }

    return result as T;
}

/** 基础请求方法（只支持 GET / POST） */
export async function request<T>(url: string, options: RequestOptions = {}): Promise<T> {
    const { data, params, timeout = DEFAULT_TIMEOUT, headers, ...rest } = options;
    const method: 'GET' | 'POST' =
        String(rest.method ?? 'GET').toUpperCase() === 'POST' ? 'POST' : 'GET';
    const token = getToken();

    // 本地 mock-api：结构与真实接口一致，后续替换成 Apifox 云 mock 时无需改动页面
    if (isLocalMock()) {
        const response = await handleMockRequest<T>({
            method,
            url,
            params,
            data: data as Record<string, unknown> | undefined,
            token,
        });
        return unwrap(response);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(buildUrl(url, params), {
            ...rest,
            method,
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

        const result = (await response.json()) as ApiResponse<T> | T;
        return unwrap(result);
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

/** 快捷方法（只提供 GET / POST；更新、删除类操作统一用 POST） */
export const http = {
    get: <T>(url: string, params?: Record<string, any>, options?: RequestOptions) =>
        request<T>(url, { ...options, method: 'GET', params }),
    post: <T>(url: string, data?: unknown, options?: RequestOptions) =>
        request<T>(url, { ...options, method: 'POST', data }),
};
