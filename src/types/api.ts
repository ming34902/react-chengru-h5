import type { ProductRecord } from './weda';

/**
 * 接口数据模型（与 docs/apifox.json 中的 Schema 一一对应）
 *
 * 约定：
 * - 所有接口统一返回 { code, message, data }，code === 0 表示成功（见 API_SUCCESS_CODE）
 * - 接口只使用 GET / POST 两种方法：查询用 GET（参数放 query），写操作用 POST（参数放 body）
 * - 购物车不提供后端接口，由前端 localStorage 维护（见 src/utils/cartStorage.ts），
 *   但数据模型 CartItemModel 依旧在这里定义，apifox 中也保留该 Schema 便于对齐
 */

/** 统一响应结构 */
export interface ApiResponse<T = unknown> {
    /** 业务状态码，0 = 成功 */
    code: number;
    /** 提示信息 */
    message: string;
    /** 业务数据 */
    data: T;
}

/** 成功状态码 */
export const API_SUCCESS_CODE = 0;

/** 分页结构 */
export interface PageResult<T> {
    /** 当前页数据 */
    records: T[];
    /** 总条数 */
    total: number;
    /** 页码（从 1 开始） */
    pageNumber: number;
    /** 每页条数 */
    pageSize: number;
}

/** 分页查询公共参数 */
export interface PageQuery {
    pageNumber?: number;
    pageSize?: number;
}

// ============================================================================
// 商品
// ============================================================================

/** 商品（列表 / 详情） */
export interface ProductModel extends ProductRecord {
    /** 商品 id */
    id: string | number;
    /** 商品名称 */
    name: string;
    /** 现价 */
    price: number;
    /** 原价 */
    originalPrice?: number;
    /** 主图 */
    image?: string;
    /** 图集 */
    images?: string[];
    /** 描述 */
    description?: string;
    /** 评分 */
    rating?: number;
    /** 销量 */
    sales?: number;
    /** 库存 */
    stock?: number;
    /** 分类 id（clothing/mens/beauty/digital/home/food/sports/books/toys） */
    category?: string;
    /** 是否推荐 */
    isFeatured?: boolean;
    /** 是否上架 */
    isOnSale?: boolean;
    /** 创建时间 */
    createdAt?: string;
}

/** 商品列表查询参数（GET /products） */
export interface ProductQuery extends PageQuery {
    /** 分类 id，all/空表示全部 */
    category?: string;
    /** 关键字（商品名模糊匹配） */
    keyword?: string;
    /** 排序：recommended | sales | price_asc | price_desc | newest */
    sort?: string;
    /** 只看推荐商品 */
    isFeatured?: boolean;
    /** 只看上架商品 */
    isOnSale?: boolean;
}

// ============================================================================
// 用户（个人中心）/ 登录注册
// ============================================================================

/** 收藏的商品（商品快照 + 收藏时间，随用户信息一起返回） */
export interface FavoriteModel extends ProductRecord {
    /** 收藏时间（毫秒时间戳） */
    collectedAt?: number;
}

/** 用户信息（个人中心） */
export interface UserModel {
    /** 用户 id */
    id: string;
    /** 账号（默认等于手机号） */
    username: string;
    /** 昵称 */
    nickname: string;
    /** 手机号 */
    phone?: string;
    /** 头像 */
    avatar?: string;
    /** 会员等级 */
    vipLevel: number;
    /** 积分 */
    points: number;
    /** 优惠券数量 */
    coupons: number;
    /** 足迹数 */
    views: number;
    /** 收藏商品列表 */
    collection: FavoriteModel[];
}

/** 登录入参（POST /auth/login） */
export interface LoginRequest {
    /** 用户名 / 手机号 */
    username: string;
    /** 密码 */
    password: string;
}

/** 登录返回（POST /auth/login、POST /auth/register） */
export interface LoginResult {
    /** 登录凭证（本地 mock 返回 mock-token，换成 Apifox 云 mock 后同样由接口返回） */
    token: string;
    /** 用户信息 */
    user: UserModel;
}

/** 注册入参（POST /auth/register） */
export interface RegisterRequest {
    /** 手机号 */
    phone: string;
    /** 昵称（可选，默认「用户+手机号后四位」） */
    nickname?: string;
    /** 密码 */
    password: string;
}

/** 创建用户入参（POST /user/create） */
export interface CreateUserRequest {
    /** 手机号（必填，作为账号） */
    phone: string;
    /** 昵称 */
    nickname?: string;
    /** 密码（不传则默认 123456） */
    password?: string;
    /** 头像 */
    avatar?: string;
}

/** 更新用户入参（POST /user/update） */
export interface UpdateUserRequest {
    /** 用户 id 或手机号，二选一 */
    id?: string;
    phone?: string;
    nickname?: string;
    avatar?: string;
    /** 收藏商品列表（传入则整体覆盖） */
    collection?: FavoriteModel[];
}

/** 获取用户信息参数（GET /user/info） */
export interface UserInfoQuery {
    /** 用户 id / 手机号，不传则按登录态（token）取当前用户 */
    id?: string;
    phone?: string;
}

// ============================================================================
// 订单
// ============================================================================

/** 订单状态：待付款 / 待发货 / 待收货 / 已完成 / 已取消 */
export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled';

/** 收货地址 */
export interface AddressModel {
    id?: string;
    /** 收货人 */
    name: string;
    /** 联系电话 */
    phone: string;
    /** 省市区 */
    province?: string;
    city?: string;
    district?: string;
    /** 详细地址 */
    detail: string;
}

/** 订单商品明细 */
export interface OrderItemModel {
    id: string | number;
    productId?: string | number;
    name?: string;
    image?: string;
    price?: number;
    originalPrice?: number;
    quantity?: number;
    spec?: string;
}

/** 订单 */
export interface OrderModel {
    /** 订单 id */
    id: string;
    /** 订单号 */
    orderNo: string;
    /** 订单状态 */
    status: OrderStatus;
    /** 商品明细 */
    items: OrderItemModel[];
    /** 商品总额 */
    totalAmount: number;
    /** 运费 */
    freight?: number;
    /** 实付金额 */
    payAmount?: number;
    /** 收货地址 */
    address?: AddressModel | null;
    /** 备注 */
    remark?: string;
    /** 下单用户手机号 */
    userPhone?: string;
    /** 支付方式：wechat | alipay | '' */
    payMethod?: string;
    /** 下单时间 */
    createTime?: string;
    /** 支付时间 */
    payTime?: string;
    /** 收货时间 */
    receiveTime?: string;
}

/** 订单查询参数（GET /orders） */
export interface OrderQuery extends PageQuery {
    /** 订单状态，all/空表示全部 */
    status?: string;
    /** 用户手机号 */
    userPhone?: string;
}

/** 创建订单入参（POST /orders/create） */
export interface OrderCreateRequest {
    items: OrderItemModel[];
    address?: AddressModel | null;
    remark?: string;
    userPhone?: string;
    freight?: number;
}

/** 订单支付入参（POST /orders/pay） */
export interface OrderPayRequest {
    orderNo: string;
    /** 支付方式，默认 wechat */
    payMethod?: string;
}

/** 更新订单状态入参（POST /orders/update-status） */
export interface OrderStatusRequest {
    orderNo: string;
    status: OrderStatus;
}

/** 删除订单入参（POST /orders/remove） */
export interface OrderRemoveRequest {
    orderNo: string;
}

/** 删除类操作返回 */
export interface RemoveResult {
    success: boolean;
}

// ============================================================================
// 购物车（前端 localStorage 维护，仅数据模型，无接口）
// ============================================================================

/** 购物车商品 */
export interface CartItemModel {
    id: string;
    /** 关联商品 id */
    productId?: string | number;
    /** 商品名称 */
    name: string;
    /** 商品图片 */
    image?: string;
    /** 现价 */
    price: number;
    /** 原价 */
    originalPrice?: number;
    /** 数量 */
    quantity: number;
    /** 规格 */
    spec?: string;
    /** 是否勾选（购物车结算用） */
    selected?: boolean;
}
