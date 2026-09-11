import { orderApi, productApi, userApi } from '@/api/shop';
import type { OrderItemModel, OrderModel, OrderStatus } from '@/types/api';
import type { WedaDataSourceRequest, WedaDataSourceResult, WedaRecord } from '@/types/weda';

/**
 * 数据源适配层（页面数据来源）
 *
 * 作用：把页面遗留的「数据源名 + 方法名」调用翻译成 src/api 里的 REST 接口（只使用 GET / POST）。
 * 本地 mock（src/mock）与 Apifox 云 mock / 真实后端由 src/api/request.ts 决定，本文件不关心。
 *
 * 注意：购物车不在这里处理 —— 购物车由前端 localStorage 维护（src/utils/cartStorage.ts）。
 */

/** 把接口返回包装成低代码数据源结构（兼容 records / data.records / data[] 三种读法） */
function wrapResult<T>(records: WedaRecord[], total = records.length): WedaDataSourceResult<T> {
    const data = Object.assign([...records], { records, total });

    return {
        records: records as unknown as T[],
        total,
        data: data as unknown as T,
    } as WedaDataSourceResult<T>;
}

/** 空结果（写操作返回） */
function emptyResult<T>(): WedaDataSourceResult<T> {
    return { records: [], total: 0 } as WedaDataSourceResult<T>;
}

/** 任意值转 string（空值返回 undefined） */
function str(value: unknown): string | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    return String(value);
}

/** 把低代码的 filter/query 条件（含 $eq/$and/$or）拍平成普通对象 */
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

/** 把低代码搜索条件转换成接口约定的关键字 */
function pickKeyword(filter: WedaRecord): string | undefined {
    const keyword = filter.name ?? filter.keyword;
    return typeof keyword === 'string' ? keyword : undefined;
}

/** 把低代码的排序参数转换成接口约定的 sort 值：recommended | sales | price_asc | price_desc | newest */
function normalizeSort(params?: WedaRecord): string | undefined {
    const orderBy = params?.orderBy;
    const first =
        Array.isArray(orderBy) && orderBy.length > 0
            ? (orderBy[0] as WedaRecord)
            : (params?.sort as WedaRecord | undefined);
    if (!first) return undefined;

    const [field] = Object.keys(first);
    if (!field) return undefined;

    const direction = first[field];
    const isAsc = direction === 'asc' || direction === 1 || direction === '1';
    if (field === 'price') return isAsc ? 'price_asc' : 'price_desc';
    if (field === 'sales') return 'sales';
    if (field === 'createdAt' || field === 'created_at') return 'newest';

    return undefined;
}

/** 取主键（不同数据源的写法不一致，这里统一兜底） */
function pickId(params?: WedaRecord): string | number | undefined {
    const filter = normalizeFilter(params);
    return filter.id ?? filter._id ?? filter.orderNo ?? filter.order_no;
}

/** 商品：列表 / 详情 */
async function productCall<T>(
    methodName: string,
    params?: WedaRecord,
): Promise<WedaDataSourceResult<T>> {
    // 商品详情
    if (/GetItem|Detail/i.test(methodName)) {
        const id = pickId(params);
        if (id === undefined) return { data: undefined } as WedaDataSourceResult<T>;

        const detail = await productApi.detail(id);
        return wrapResult<T>([detail as unknown as WedaRecord], 1);
    }

    // 商品列表
    const filter = normalizeFilter(params);
    const result = await productApi.list({
        category: str(filter.category),
        keyword: pickKeyword(filter),
        isOnSale: (filter.isOnSale ?? filter.is_on_sale) as boolean | undefined,
        isFeatured: (filter.isFeatured ?? filter.is_featured) as boolean | undefined,
        sort: normalizeSort(params),
        pageNumber: Number(params?.pageNumber ?? 1),
        pageSize: Number(params?.pageSize ?? params?.limit ?? 12),
    });

    return wrapResult<T>((result?.records ?? []) as unknown as WedaRecord[], result?.total ?? 0);
}

/** 订单：创建 / 列表 / 详情 / 更新状态 / 删除 */
async function orderCall<T>(
    methodName: string,
    params?: WedaRecord,
): Promise<WedaDataSourceResult<T>> {
    const filter = normalizeFilter(params);

    // 订单创建
    if (/Create/i.test(methodName)) {
        const record = (params?.data ?? params?.record ?? {}) as Partial<OrderModel>;
        const order = await orderApi.create({
            items: (record.items ?? []) as OrderItemModel[],
            address: record.address ?? null,
            remark: record.remark,
            userPhone: record.userPhone,
            freight: record.freight,
        });
        return wrapResult<T>([order as unknown as WedaRecord], 1);
    }

    // 更新订单状态（取消 / 确认收货等）
    if (/Update/i.test(methodName)) {
        const update = (params?.update ?? {}) as WedaRecord;
        const orderNo = str(filter.orderNo ?? filter.order_no ?? filter.id ?? filter._id);
        const status = str(update.status ?? filter.status);
        if (orderNo && status)
            await orderApi.updateStatus({ orderNo, status: status as OrderStatus });
        return emptyResult<T>();
    }

    // 删除订单
    if (/Delete/i.test(methodName)) {
        const orderNo = str(filter.orderNo ?? filter.order_no ?? filter.id ?? filter._id);
        if (orderNo) await orderApi.remove({ orderNo });
        return emptyResult<T>();
    }

    // 订单详情（按订单号查询）
    const orderNo = str(filter.orderNo ?? filter.order_no);
    if (orderNo) {
        const detail = await orderApi.detail(orderNo);
        return wrapResult<T>([detail as unknown as WedaRecord], 1);
    }

    // 订单列表
    const result = await orderApi.list({
        userPhone: str(filter.userPhone ?? filter.user_phone),
        status: str(filter.status),
        pageNumber: Number(params?.pageNumber ?? 1),
        pageSize: Number(params?.pageSize ?? 20),
    });

    return wrapResult<T>((result?.records ?? []) as unknown as WedaRecord[], result?.total ?? 0);
}

/** 用户（个人中心）：获取用户信息 / 创建用户 / 更新用户信息 */
async function userCall<T>(
    methodName: string,
    params?: WedaRecord,
): Promise<WedaDataSourceResult<T>> {
    const filter = normalizeFilter(params);
    const phone = str(filter.phone);
    const id = str(filter.id ?? filter._id);

    // 创建用户
    if (/Create/i.test(methodName)) {
        const data = (params?.data ?? params?.record ?? {}) as WedaRecord;
        const user = await userApi.create({
            phone: String(data.phone ?? phone ?? ''),
            nickname: str(data.nickname ?? data.nick_name),
            password: str(data.password),
            avatar: str(data.avatar ?? data.avatar_url),
        });
        return wrapResult<T>([user as unknown as WedaRecord], 1);
    }

    // 更新用户信息（昵称 / 头像 / 收藏）
    if (/Update/i.test(methodName)) {
        const data = (params?.update ?? params?.data ?? {}) as WedaRecord;
        const user = await userApi.update({
            id,
            phone,
            nickname: str(data.nickname ?? data.nick_name),
            avatar: str(data.avatar ?? data.avatar_url),
            collection: Array.isArray(data.collection) ? data.collection : undefined,
        });
        return wrapResult<T>([user as unknown as WedaRecord], 1);
    }

    // 查询用户信息
    try {
        const user = await userApi.info({ id, phone });
        return wrapResult<T>([user as unknown as WedaRecord], 1);
    } catch {
        // 用户不存在（如未注册的手机号）：返回空结果，由页面决定是否创建
        return emptyResult<T>();
    }
}

/** 数据源统一入口（只使用 GET / POST） */
export async function httpCallDataSource<T = WedaRecord>({
    dataSourceName,
    methodName,
    params,
}: WedaDataSourceRequest): Promise<WedaDataSourceResult<T>> {
    if (dataSourceName === 'shop_product') return productCall<T>(methodName, params);
    if (dataSourceName === 'shop_order') return orderCall<T>(methodName, params);
    if (dataSourceName === 'shop_user' || dataSourceName === 'shop_member') {
        return userCall<T>(methodName, params);
    }

    // shop_cart 不走接口：购物车由前端 localStorage 维护（src/utils/cartStorage.ts）
    return emptyResult<T>();
}
