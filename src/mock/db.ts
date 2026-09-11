import type {
    CreateUserRequest,
    OrderModel,
    OrderStatus,
    ProductModel,
    UpdateUserRequest,
    UserModel,
} from '@/types/api';

/**
 * 本地 mock 数据库
 *
 * 说明：
 * - 商品：只读种子数据（写死在代码里，README/Apifox 示例与之对齐）
 * - 用户 / 订单：落地到 localStorage，保证「注册、创建用户、下单」刷新后仍然存在
 * - 购物车不在这里维护：购物车由前端 localStorage 直接管理（src/utils/cartStorage.ts）
 *
 * 后续接入 Apifox 云 mock 时，本文件与 src/mock/server.ts 一起删除即可，
 * 页面与 src/api 层不需要改动（只需把 VITE_USE_MOCK 置为 false 并配置 VITE_GLOB_API_URL）。
 */

/** mock 数据在 localStorage 中的 key */
const USERS_STORAGE_KEY = 'mock_db_users';
const ORDERS_STORAGE_KEY = 'mock_db_orders';

const img = (id: string) => `https://images.unsplash.com/${id}?w=400&h=400&fit=crop`;

/** 商品种子数据 */
export const PRODUCTS: ProductModel[] = [
    {
        id: 'p_1',
        name: '2024新款韩版宽松休闲运动套装 时尚百搭',
        price: 199,
        originalPrice: 399,
        image: img('photo-1515886657613-9f3515b0c78f'),
        images: [img('photo-1515886657613-9f3515b0c78f')],
        description: '采用优质面料，舒适透气，款式简约大方，适合各种场合穿着。',
        rating: 4.8,
        sales: 2560,
        stock: 99,
        category: 'clothing',
        isFeatured: true,
        isOnSale: true,
        createdAt: '2024-08-20',
        progress: 68,
    },
    {
        id: 'p_2',
        name: '玻尿酸保湿精华液 30ml 补水锁水',
        price: 89,
        originalPrice: 169,
        image: img('photo-1620916566398-39f1143ab7be'),
        images: [img('photo-1620916566398-39f1143ab7be')],
        description: '小分子玻尿酸，快速渗透，长效保湿。',
        rating: 4.9,
        sales: 1820,
        stock: 200,
        category: 'beauty',
        isFeatured: true,
        isOnSale: true,
        createdAt: '2024-08-18',
        progress: 82,
    },
    {
        id: 'p_3',
        name: '智能运动手表 GPS定位 心率监测',
        price: 1299,
        originalPrice: 1999,
        image: img('photo-1523275335684-37898b6baf30'),
        images: [img('photo-1523275335684-37898b6baf30')],
        description: '专业运动算法，50 米防水，续航 14 天。',
        rating: 4.7,
        sales: 960,
        stock: 58,
        category: 'digital',
        isFeatured: true,
        isOnSale: true,
        createdAt: '2024-08-15',
        progress: 45,
    },
    {
        id: 'p_4',
        name: '北欧简约实木餐桌 家用小户型',
        price: 899,
        originalPrice: 1299,
        image: img('photo-1556909114-f6e7ad7d3136'),
        images: [img('photo-1556909114-f6e7ad7d3136')],
        description: '进口橡胶木，承重稳定，环保水性漆。',
        rating: 4.6,
        sales: 320,
        stock: 24,
        category: 'home',
        isFeatured: false,
        isOnSale: true,
        createdAt: '2024-08-12',
        progress: 30,
    },
    {
        id: 'p_5',
        name: '男士休闲夹克外套 春秋薄款',
        price: 259,
        originalPrice: 459,
        image: img('photo-1490578474895-699cd4e2cf59'),
        images: [img('photo-1490578474895-699cd4e2cf59')],
        description: '防风面料，立体裁剪，通勤休闲两相宜。',
        rating: 4.5,
        sales: 780,
        stock: 66,
        category: 'mens',
        isFeatured: true,
        isOnSale: true,
        createdAt: '2024-08-10',
        progress: 55,
    },
    {
        id: 'p_6',
        name: '零食大礼包 混合口味 整箱装',
        price: 69,
        originalPrice: 129,
        image: img('photo-1504674900247-0877df9cc836'),
        images: [img('photo-1504674900247-0877df9cc836')],
        description: '30 包混合口味，办公室下午茶首选。',
        rating: 4.8,
        sales: 4300,
        stock: 999,
        category: 'food',
        isFeatured: false,
        isOnSale: true,
        createdAt: '2024-08-08',
        progress: 92,
    },
    {
        id: 'p_7',
        name: '专业跑步鞋 减震透气 男女同款',
        price: 359,
        originalPrice: 599,
        image: img('photo-1579952363873-27f3bade9f55'),
        images: [img('photo-1579952363873-27f3bade9f55')],
        description: '回弹中底，透气网面，日常通勤与慢跑都合适。',
        rating: 4.7,
        sales: 1260,
        stock: 120,
        category: 'sports',
        isFeatured: true,
        isOnSale: true,
        createdAt: '2024-08-06',
        progress: 61,
    },
    {
        id: 'p_8',
        name: '畅销小说合集 全 5 册',
        price: 128,
        originalPrice: 240,
        image: img('photo-1495446815901-a7297e633e8d'),
        images: [img('photo-1495446815901-a7297e633e8d')],
        description: '精装正版，假期书单推荐。',
        rating: 4.9,
        sales: 640,
        stock: 300,
        category: 'books',
        isFeatured: false,
        isOnSale: true,
        createdAt: '2024-08-04',
        progress: 20,
    },
];

/** 用户表行（含密码，接口返回前会剔除） */
interface UserRow extends UserModel {
    password: string;
}

/** 默认演示账号 */
const DEFAULT_USERS: UserRow[] = [
    {
        id: 'u_1001',
        username: '13800000000',
        nickname: '商城会员',
        phone: '13800000000',
        avatar: 'https://picsum.photos/200/300',
        vipLevel: 2,
        points: 1280,
        coupons: 3,
        views: 42,
        collection: [],
        password: '123456',
    },
];

/** 默认订单 */
const DEFAULT_ORDERS: OrderModel[] = [
    {
        id: 'o_1',
        orderNo: 'SO202408200001',
        status: 'pending',
        items: [
            {
                id: 'p_1',
                productId: 'p_1',
                name: '2024新款韩版宽松休闲运动套装 时尚百搭',
                image: img('photo-1515886657613-9f3515b0c78f'),
                price: 199,
                quantity: 1,
                spec: '黑色 M码',
            },
            {
                id: 'p_2',
                productId: 'p_2',
                name: '玻尿酸保湿精华液 30ml 补水锁水',
                image: img('photo-1620916566398-39f1143ab7be'),
                price: 89,
                quantity: 2,
                spec: '30ml/瓶',
            },
        ],
        totalAmount: 377,
        freight: 0,
        payAmount: 377,
        address: null,
        remark: '',
        userPhone: '13800000000',
        payMethod: '',
        createTime: '2024-08-20 12:30:00',
    },
    {
        id: 'o_2',
        orderNo: 'SO202408180002',
        status: 'completed',
        items: [
            {
                id: 'p_1',
                productId: 'p_1',
                name: '2024新款韩版宽松休闲运动套装 时尚百搭',
                image: img('photo-1515886657613-9f3515b0c78f'),
                price: 199,
                quantity: 1,
                spec: '黑色 M码',
            },
        ],
        totalAmount: 199,
        freight: 0,
        payAmount: 199,
        address: null,
        remark: '',
        userPhone: '13800000000',
        payMethod: 'wechat',
        createTime: '2024-08-18 09:12:00',
        payTime: '2024-08-18 09:15:00',
        receiveTime: '2024-08-20 10:00:00',
    },
];

/** 读取 localStorage（解析失败时回退默认值） */
function readStorage<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        const parsed: unknown = JSON.parse(raw);
        return (parsed as T) ?? fallback;
    } catch {
        return fallback;
    }
}

/** 写入 localStorage */
function writeStorage<T>(key: string, value: T): void {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // 忽略隐私模式等写入失败
    }
}

/** 当前时间（YYYY-MM-DD HH:mm:ss） */
export function nowText(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(
        d.getMinutes(),
    )}:${pad(d.getSeconds())}`;
}

/** 通用分页 */
export function paginate<T>(
    list: T[],
    pageNumber = 1,
    pageSize = 10,
): { records: T[]; total: number; pageNumber: number; pageSize: number } {
    const safePage = Math.max(1, Number(pageNumber) || 1);
    const safeSize = Math.max(1, Number(pageSize) || 10);
    const start = (safePage - 1) * safeSize;

    return {
        records: list.slice(start, start + safeSize),
        total: list.length,
        pageNumber: safePage,
        pageSize: safeSize,
    };
}

// ============================================================================
// 商品
// ============================================================================

/** 商品列表（分类 / 关键字 / 推荐 / 上架 / 排序 / 分页） */
export function listProducts(query: {
    category?: string;
    keyword?: string;
    sort?: string;
    isFeatured?: boolean | string;
    isOnSale?: boolean | string;
    pageNumber?: number;
    pageSize?: number;
}) {
    const { category, keyword, sort } = query;
    const onlyFeatured = query.isFeatured === true || query.isFeatured === 'true';
    const onlyOnSale = query.isOnSale === true || query.isOnSale === 'true';

    const list = PRODUCTS.filter((product) => {
        const matchCategory =
            !category || category === 'all' ? true : product.category === category;
        const matchKeyword = !keyword ? true : (product.name ?? '').includes(String(keyword));
        const matchFeatured = onlyFeatured ? !!product.isFeatured : true;
        const matchOnSale = onlyOnSale ? !!product.isOnSale : true;
        return matchCategory && matchKeyword && matchFeatured && matchOnSale;
    });

    const sorted = [...list];
    switch (sort) {
        case 'sales':
        case 'sales_desc':
            sorted.sort((a, b) => Number(b.sales ?? 0) - Number(a.sales ?? 0));
            break;
        case 'price_asc':
            sorted.sort((a, b) => a.price - b.price);
            break;
        case 'price_desc':
            sorted.sort((a, b) => b.price - a.price);
            break;
        case 'newest':
            sorted.sort((a, b) =>
                String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')),
            );
            break;
        default:
            sorted.sort(
                (a, b) =>
                    Number(!!b.isFeatured) - Number(!!a.isFeatured) ||
                    Number(b.sales ?? 0) - Number(a.sales ?? 0),
            );
    }

    return paginate(sorted, query.pageNumber, query.pageSize ?? 12);
}

/** 商品详情 */
export function findProduct(id: string | number | undefined): ProductModel | undefined {
    if (id === undefined || id === null || id === '') return undefined;
    return PRODUCTS.find((product) => String(product.id) === String(id));
}

// ============================================================================
// 用户
// ============================================================================

/** 读取用户表 */
export function getUsers(): UserRow[] {
    return readStorage<UserRow[]>(USERS_STORAGE_KEY, DEFAULT_USERS);
}

/** 写入用户表 */
function saveUsers(rows: UserRow[]): void {
    writeStorage(USERS_STORAGE_KEY, rows);
}

/** 创建用户（注册 / 创建用户接口共用） */
export function createUserRow(payload: CreateUserRequest): { user?: UserRow; error?: string } {
    const phone = String(payload.phone ?? '').trim();
    if (!phone) return { error: '手机号不能为空' };
    if (findUserRow({ phone })) return { error: '该手机号已注册' };

    const row: UserRow = {
        id: `u_${Date.now()}`,
        username: phone,
        nickname: payload.nickname?.trim() || `用户${phone.slice(-4)}`,
        phone,
        avatar: payload.avatar ?? 'https://picsum.photos/200/300',
        vipLevel: 0,
        points: 100,
        coupons: 1,
        views: 0,
        collection: [],
        password: payload.password || '123456',
    };

    const users = getUsers();
    users.push(row);
    saveUsers(users);
    return { user: row };
}

/** 更新用户信息（昵称 / 头像 / 收藏列表） */
export function updateUserRow(payload: UpdateUserRequest): UserRow | undefined {
    const users = getUsers();
    const index = users.findIndex(
        (user) =>
            (!!payload.id && String(user.id) === String(payload.id)) ||
            (!!payload.phone && user.phone === payload.phone),
    );
    if (index < 0) return undefined;

    const row = users[index];
    if (payload.nickname !== undefined) row.nickname = payload.nickname;
    if (payload.avatar !== undefined) row.avatar = payload.avatar;
    if (payload.collection !== undefined) row.collection = payload.collection;
    users[index] = row;
    saveUsers(users);
    return row;
}

/** 校验账号（用户名或手机号）+ 密码，成功返回用户行 */
export function verifyUser(account: string, password: string): UserRow | undefined {
    const row = findUserRow({ username: account }) ?? findUserRow({ phone: account });
    if (!row || row.password !== password) return undefined;
    return row;
}

// ============================================================================
// 订单
// ============================================================================

/** 读取订单表 */
export function getOrders(): OrderModel[] {
    return readStorage<OrderModel[]>(ORDERS_STORAGE_KEY, DEFAULT_ORDERS);
}

/** 写入订单表 */
function saveOrders(rows: OrderModel[]): void {
    writeStorage(ORDERS_STORAGE_KEY, rows);
}

/** 订单列表（用户 / 状态 / 分页，按下单时间倒序） */
export function listOrders(query: {
    userPhone?: string;
    status?: string;
    pageNumber?: number;
    pageSize?: number;
}) {
    let list = getOrders();
    if (query.userPhone) list = list.filter((order) => order.userPhone === query.userPhone);
    if (query.status && query.status !== 'all') {
        list = list.filter((order) => order.status === query.status);
    }
    list = [...list].sort((a, b) =>
        String(b.createTime ?? '').localeCompare(String(a.createTime ?? '')),
    );

    return paginate(list, query.pageNumber, query.pageSize ?? 20);
}

/** 订单详情（orderNo 或 id） */
export function findOrder(orderNo: string): OrderModel | undefined {
    return getOrders().find((order) => order.orderNo === orderNo || order.id === orderNo);
}

/** 生成订单号 */
export function nextOrderNo(): string {
    return `SO${nowText().replace(/[-: ]/g, '')}${String(Date.now()).slice(-3)}`;
}

/** 新增订单（最新的排前面） */
export function insertOrder(order: OrderModel): OrderModel {
    const rows = getOrders();
    rows.unshift(order);
    saveOrders(rows);
    return order;
}

/** 更新订单状态 */
export function updateOrderStatus(orderNo: string, status: OrderStatus): OrderModel | undefined {
    const rows = getOrders();
    const index = rows.findIndex((order) => order.orderNo === orderNo || order.id === orderNo);
    if (index < 0) return undefined;

    const row = rows[index];
    row.status = status;
    if (status === 'paid') {
        row.payMethod = row.payMethod || 'wechat';
        row.payTime = nowText();
    }
    if (status === 'completed') row.receiveTime = nowText();
    rows[index] = row;
    saveOrders(rows);
    return row;
}

/** 删除订单 */
export function removeOrder(orderNo: string): boolean {
    const rows = getOrders();
    const next = rows.filter((order) => order.orderNo !== orderNo && order.id !== orderNo);
    if (next.length === rows.length) return false;

    saveOrders(next);
    return true;
}

/** 按 id / 手机号 / 账号查找用户（含密码，仅内部使用） */
export function findUserRow(params: {
    id?: string;
    phone?: string;
    username?: string;
}): UserRow | undefined {
    const users = getUsers();
    return users.find((user) => {
        if (params.id && String(user.id) === String(params.id)) return true;
        if (params.phone && user.phone === params.phone) return true;
        if (
            params.username &&
            (user.username === params.username || user.phone === params.username)
        ) {
            return true;
        }
        return false;
    });
}

/** 剔除密码，得到接口返回的用户信息 */
export function toUser(row: UserRow): UserModel {
    const { password: _password, ...user } = row;
    return user;
}
