/**
 * 低代码（微搭 weda）运行时与业务数据模型类型定义
 *
 * 背景：商城页面最初由低代码平台生成，依赖平台注入的 `$w` 运行时
 * （cloud 数据源 / utils 跳转 / auth 登录态）。现在页面已改为直接用 react-router + src/api，
 * 这里的运行时类型（WedaRuntime / WedaPageProps）与 src/hooks/useWeda 一起保留，
 * 供低代码平台（微搭容器 / 小程序端）接入时复用。
 *
 * 说明：数据源返回的字段由平台侧数据源动态决定，因此业务模型保留索引签名，
 * 既能约束常用字段，又不会因为字段增删导致大面积类型报错。
 */

/** 通用记录类型 */
export type WedaRecord = Record<string, any>;

/** 数据源调用入参 */
export interface WedaDataSourceRequest {
    /** 数据源名称，如 shop_product */
    dataSourceName: string;
    /** 数据源方法，如 wedaGetRecordsV2 / wedaGetItemV2 / wedaCreateV2 / wedaUpdateV2 / wedaDeleteV2 */
    methodName: string;
    /** 查询参数 */
    params?: WedaRecord;
}

/** 数据源调用返回 */
export interface WedaDataSourceResult<T = WedaRecord> {
    /** 列表数据 */
    records?: T[];
    /** 记录总数 */
    total?: number;
    /** 单条数据（wedaGetItemV2 等） */
    data?: T;
    [key: string]: any;
}

/** 页面跳转参数（低代码平台的 pageId + params） */
export interface WedaNavigateOptions {
    /** 低代码页面 id，如 home / products / product-detail */
    pageId: string;
    /** 页面参数 */
    params?: WedaRecord;
}

/** 当前登录用户 */
export interface WedaUserInfo extends WedaRecord {
    _id?: string;
    name?: string;
    phone?: string;
}

/** 低代码运行时 */
export interface WedaRuntime {
    cloud: {
        callDataSource<T = WedaRecord>(
            request: WedaDataSourceRequest,
        ): Promise<WedaDataSourceResult<T>>;
    };
    utils: {
        navigateTo(options: WedaNavigateOptions): void;
        navigateBack(): void;
    };
    auth: {
        currentUser: WedaUserInfo | null;
    };
    /** 页面上下文（低代码平台注入，如页面入参） */
    page: {
        dataset: {
            /** 页面参数，如 { orderNo } */
            params?: WedaRecord;
            [key: string]: any;
        };
    };
}

/** 低代码页面组件的入参（平台会把 $w 注入进来） */
export interface WedaPageProps {
    $w?: WedaRuntime;
    /** 平台注入的其他页面参数 */
    [key: string]: any;
}

// ============================================================================
// 业务数据模型
// ============================================================================

/** 商品 */
export interface ProductRecord extends WedaRecord {
    id?: string | number;
    _id?: string;
    name?: string;
    price: number;
    originalPrice?: number;
    image?: string;
    images?: string[];
    description?: string;
    rating?: number;
    sales?: number;
    stock?: number;
    category?: string;
    is_featured?: boolean;
    is_on_sale?: boolean;
    createdAt?: string;
    /** 秒杀进度（百分比） */
    progress?: number;
}

/** 购物车记录 */
export interface CartRecord extends WedaRecord {
    id: string | number;
    /** 现价 */
    price: number;
    /** 数量 */
    quantity: number;
    _id?: string;
    product_id?: string | number;
    selected?: boolean;
    spec?: string;
    name?: string;
    image?: string;
}

/** 订单商品明细 */
export interface OrderItemRecord extends WedaRecord {
    id?: string | number;
    name?: string;
    price?: number;
    image?: string;
    quantity?: number;
    spec?: string;
}

/** 订单 */
export interface OrderRecord extends WedaRecord {
    id?: string | number;
    _id?: string;
    orderNo?: string;
    status?: string;
    totalAmount?: number;
    items?: OrderItemRecord[];
    createTime?: string;
    payMethod?: string;
}

/** 商品评价 */
export interface ReviewRecord extends WedaRecord {
    id?: string | number;
    user?: string;
    rating?: number;
    content?: string;
    spec?: string;
    date?: string;
}

/** 会员 */
export interface MemberRecord extends WedaRecord {
    _id?: string;
    nick_name?: string;
    phone?: string;
    avatar_url?: string;
    /** 会员等级 */
    vip_level?: number;
    /** 积分 */
    points?: number;
    /** 优惠券数量 */
    coupons?: number;
    /** 收藏数 */
    favorites?: number;
    /** 足迹数 */
    views?: number;
    addresses?: unknown[];
}
