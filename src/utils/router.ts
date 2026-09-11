/**
 * 路由工具
 *
 * 替代原来低代码运行时的 `$w.utils.navigateTo({ pageId, params })`：
 * 页面现在用 react-router 的 useNavigate 跳转，这里负责把「路径 + 参数」拼成带 query 的地址，
 * query 的编码规则与原来的 toQueryString 保持一致（非字符串值 JSON 序列化）。
 */

/**
 * 生成带 query 的路由地址
 *
 * @param path   路由路径，如 `/product-detail`
 * @param params 页面参数，如 `{ id: 1 }` → `/product-detail?id=1`
 */
export function buildPath(path: string, params?: Record<string, unknown>): string {
    if (!params) return path;

    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        search.append(key, typeof value === 'string' ? value : JSON.stringify(value));
    });

    const query = search.toString();
    return query ? `${path}?${query}` : path;
}
