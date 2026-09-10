import { cartApi, memberApi, orderApi, productApi } from '@/api';
import type {
    CartRecord,
    MemberRecord,
    OrderRecord,
    ProductRecord,
    WedaDataSourceRequest,
    WedaDataSourceResult,
    WedaRecord,
} from '@/types/weda';

/**
 * 真实 HTTP 数据源适配层
 *
 * 作用：把低代码页面的 `$w.cloud.callDataSource({ dataSourceName, methodName, params })`
 * 翻译成 src/api 里的 REST 调用，页面代码无需改动。
 * 与本地 mock（mockDataSource.ts）二选一，由环境变量 VITE_USE_MOCK 控制。
 */

/** 把接口返回包装成低代码数据源结构（兼容 records / data.records / data[] 三种读法） */
function wrapResult<T>(records: unknown[], total = records.length): WedaDataSourceResult<T> {
    const data = Object.assign([...records], { records, total });

    return {
        records: records as T[],
        total,
        data: data as unknown as T,
    } as WedaDataSourceResult<T>;
}

/** 把低代码的 filter/query 条件（含 $eq/$and）拍平成普通对象 */
function normalizeFilter(params?: WedaRecord): WedaRecord {
    const source: WedaRecord = params?.query ?? params?.filter?.where ?? params?.filter ?? {};
    const plain: WedaRecord = {};

    const assignCondition = (condition: WedaRecord) => {
        Object.entries(condition).forEach(([key, value]) => {
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                const operatorValue = (value as WedaRecord).$eq;
                if (operatorValue !== undefined) {
                    plain[key] = operatorValue;
                } else if (key === '$and' || key === '$or') {
                    (value as WedaRecord[]).forEach(assignCondition);
                }
            } else if (key !== '$and' && key !== '$or') {
                plain[key] = value;
            }
        });
    };

    assignCondition(source);
    return plain;
}

/** 把低代码的排序参数转换成后端约定的 sort 字符串 */
function normalizeSort(params?: WedaRecord): string | undefined {
    const orderBy = params?.orderBy;
    if (Array.isArray(orderBy) && orderBy.length > 0) {
        const first = orderBy[0] as WedaRecord;
        const [field] = Object.keys(first);
        if (field) return first[field] === 'asc' ? `${field}_asc` : field;
    }

    const sort = params?.sort as WedaRecord | undefined;
    if (sort) {
        const [field] = Object.keys(sort);
        if (field) return sort[field] === 1 || sort[field] === 'asc' ? `${field}_asc` : field;
    }

    return undefined;
}

/** 取主键（不同数据源的写法不一致，这里统一兜底） */
function pickId(params?: WedaRecord): string | number | undefined {
    const filter = normalizeFilter(params);
    return filter._id ?? filter.id ?? filter.order_no ?? filter.orderNo;
}
/** 商品查询 */
async function productCall<T>(methodName: string, params?: WedaRecord) {
    if (/GetItem/i.test(methodName)) {
        const id = pickId(params);
        if (id === undefined) return { data: undefined } as WedaDataSourceResult<T>;

        const detail = await productApi.detail(id);
        return { data: detail as unknown as T } as WedaDataSourceResult<T>;
    }

    const filter = normalizeFilter(params);
    const keyword = filter.name ?? filter.keyword;
    const result = await productApi.list({
        category: filter.category,
        keyword: typeof keyword === 'string' ? keyword : undefined,
        isOnSale: filter.is_on_sale,
        isFeatured: filter.is_featured,
        sort: normalizeSort(params),
        pageNumber: Number(params?.pageNumber ?? 1),
        pageSize: Number(params?.pageSize ?? params?.limit ?? 12),
    });

    const records = (result?.records ?? []) as unknown as ProductRecord[];
    return wrapResult<T>(records, result?.total ?? records.length);
}

/** 购物车查询 / 增删改 */
async function cartCall<T>(methodName: string, params?: WedaRecord) {
    if (/Create/i.test(methodName)) {
        await cartApi.create((params?.record ?? {}) as Partial<CartRecord>);
        return { records: [], total: 0 } as WedaDataSourceResult<T>;
    }

    if (/Update/i.test(methodName)) {
        const id = pickId(params);
        if (id !== undefined) {
            await cartApi.update(
                id,
                (params?.update ?? params?.record ?? {}) as Partial<CartRecord>,
            );
        }
        return { records: [], total: 0 } as WedaDataSourceResult<T>;
    }

    if (/Delete/i.test(methodName)) {
        const id = pickId(params);
        if (id !== undefined) await cartApi.remove(id);
        return { records: [], total: 0 } as WedaDataSourceResult<T>;
    }

    const filter = normalizeFilter(params);
    const result = await cartApi.list(filter.user_phone as string | undefined);
    const records = (result?.records ?? []) as unknown as CartRecord[];
    return wrapResult<T>(records, result?.total ?? records.length);
}

/** 订单查询 / 增删改 */
async function orderCall<T>(methodName: string, params?: WedaRecord) {
    if (/Create/i.test(methodName)) {
        return { records: [], total: 0 } as WedaDataSourceResult<T>;
    }

    if (/Update/i.test(methodName)) {
        const filter = normalizeFilter(params);
        const status = (params?.update as WedaRecord | undefined)?.status;
        if (filter.order_no && status) {
            await orderApi.updateStatus(String(filter.order_no), String(status));
        }
        return { records: [], total: 0 } as WedaDataSourceResult<T>;
    }

    if (/Delete/i.test(methodName)) {
        const filter = normalizeFilter(params);
        if (filter.order_no) await orderApi.remove(String(filter.order_no));
        return { records: [], total: 0 } as WedaDataSourceResult<T>;
    }

    const filter = normalizeFilter(params);
    const result = await orderApi.list({
        userPhone: filter.user_phone as string | undefined,
        status: filter.status as string | undefined,
        pageNumber: Number(params?.pageNumber ?? 1),
        pageSize: Number(params?.pageSize ?? 20),
    });
    const records = (result?.records ?? []) as unknown as OrderRecord[];
    return wrapResult<T>(records, result?.total ?? records.length);
}

/** 会员查询 / 新增（低代码会员页使用） */
async function memberCall<T>(methodName: string, params?: WedaRecord) {
    if (/Create/i.test(methodName)) {
        const record = await memberApi.create(
            (params?.data ?? params?.record ?? {}) as Partial<MemberRecord>,
        );
        return { id: record?._id, data: record as unknown as T } as WedaDataSourceResult<T>;
    }

    if (/Update/i.test(methodName)) {
        const id = pickId(params);
        if (id !== undefined) {
            await memberApi.update(
                id,
                (params?.update ?? params?.data ?? {}) as Partial<MemberRecord>,
            );
        }
        return { records: [], total: 0 } as WedaDataSourceResult<T>;
    }

    const filter = normalizeFilter(params);
    const result = await memberApi.list({
        phone: filter.phone as string | undefined,
        nickName: filter.nick_name as string | undefined,
    });
    const records = (result?.records ?? []) as unknown as MemberRecord[];
    return wrapResult<T>(records, result?.total ?? records.length);
}

/** 真实 HTTP 数据源 */
export async function httpCallDataSource<T = WedaRecord>({
    dataSourceName,
    methodName,
    params,
}: WedaDataSourceRequest): Promise<WedaDataSourceResult<T>> {
    if (dataSourceName === 'shop_product') return productCall<T>(methodName, params);
    if (dataSourceName === 'shop_cart') return cartCall<T>(methodName, params);
    if (dataSourceName === 'shop_order') return orderCall<T>(methodName, params);
    if (dataSourceName === 'shop_member') return memberCall<T>(methodName, params);

    return { records: [], total: 0 } as WedaDataSourceResult<T>;
}
