import type {
    CartRecord,
    MemberRecord,
    OrderItemRecord,
    OrderRecord,
    ProductRecord,
    WedaDataSourceRequest,
    WedaDataSourceResult,
    WedaRecord,
} from '@/types/weda';

/**
 * H5 独立运行时的兜底数据源（无低代码平台时使用）
 *
 * 作用：让同一套低代码页面在 H5 端也能渲染真实内容；
 * 接入微搭容器（window.$w / props.$w）后，本文件不会被使用。
 */

const img = (id: string) => `https://images.unsplash.com/${id}?w=400&h=400&fit=crop`;

/** 商品 mock */
export const mockProducts: ProductRecord[] = [
    {
        _id: 'p_1',
        id: 'p_1',
        name: '2024新款韩版宽松休闲运动套装 时尚百搭',
        price: 199,
        original_price: 399,
        originalPrice: 399,
        image: img('photo-1515886657613-9f3515b0c78f'),
        images: [img('photo-1515886657613-9f3515b0c78f')],
        description: '采用优质面料，舒适透气，款式简约大方，适合各种场合穿着。',
        rating: 4.8,
        sales: 2560,
        stock: 99,
        category: 'clothing',
        is_featured: true,
        is_on_sale: true,
        createdAt: '2024-08-20',
        progress: 68,
    },
    {
        _id: 'p_2',
        id: 'p_2',
        name: '玻尿酸保湿精华液 30ml 补水锁水',
        price: 89,
        original_price: 169,
        originalPrice: 169,
        image: img('photo-1620916566398-39f1143ab7be'),
        images: [img('photo-1620916566398-39f1143ab7be')],
        description: '小分子玻尿酸，快速渗透，长效保湿。',
        rating: 4.9,
        sales: 1820,
        stock: 200,
        category: 'beauty',
        is_featured: true,
        is_on_sale: true,
        createdAt: '2024-08-18',
        progress: 82,
    },
    {
        _id: 'p_3',
        id: 'p_3',
        name: '智能运动手表 GPS定位 心率监测',
        price: 1299,
        original_price: 1999,
        originalPrice: 1999,
        image: img('photo-1523275335684-37898b6baf30'),
        images: [img('photo-1523275335684-37898b6baf30')],
        description: '专业运动算法，50 米防水，续航 14 天。',
        rating: 4.7,
        sales: 960,
        stock: 58,
        category: 'digital',
        is_featured: true,
        is_on_sale: true,
        createdAt: '2024-08-15',
        progress: 45,
    },
    {
        _id: 'p_4',
        id: 'p_4',
        name: '北欧简约实木餐桌 家用小户型',
        price: 899,
        original_price: 1299,
        originalPrice: 1299,
        image: img('photo-1556909114-f6e7ad7d3136'),
        images: [img('photo-1556909114-f6e7ad7d3136')],
        description: '进口橡胶木，承重稳定，环保水性漆。',
        rating: 4.6,
        sales: 320,
        stock: 24,
        category: 'home',
        is_featured: false,
        is_on_sale: true,
        createdAt: '2024-08-12',
        progress: 30,
    },
    {
        _id: 'p_5',
        id: 'p_5',
        name: '男士休闲夹克外套 春秋薄款',
        price: 259,
        original_price: 459,
        originalPrice: 459,
        image: img('photo-1490578474895-699cd4e2cf59'),
        images: [img('photo-1490578474895-699cd4e2cf59')],
        description: '防风面料，立体裁剪，通勤休闲两相宜。',
        rating: 4.5,
        sales: 780,
        stock: 66,
        category: 'mens',
        is_featured: true,
        is_on_sale: true,
        createdAt: '2024-08-10',
        progress: 55,
    },
    {
        _id: 'p_6',
        id: 'p_6',
        name: '零食大礼包 混合口味 整箱装',
        price: 69,
        original_price: 129,
        originalPrice: 129,
        image: img('photo-1504674900247-0877df9cc836'),
        images: [img('photo-1504674900247-0877df9cc836')],
        description: '30 包混合口味，办公室下午茶首选。',
        rating: 4.8,
        sales: 4300,
        stock: 999,
        category: 'food',
        is_featured: false,
        is_on_sale: true,
        createdAt: '2024-08-08',
        progress: 92,
    },
];

/** 购物车 mock */
export const mockCartRecords: CartRecord[] = [
    {
        _id: 'cart_1',
        id: 'cart_1',
        product_id: 'p_1',
        product_name: '2024新款韩版宽松休闲运动套装 时尚百搭',
        product_image: img('photo-1515886657613-9f3515b0c78f'),
        name: '2024新款韩版宽松休闲运动套装 时尚百搭',
        image: img('photo-1515886657613-9f3515b0c78f'),
        price: 199,
        original_price: 399,
        originalPrice: 399,
        quantity: 1,
        spec: '黑色 M码',
        is_selected: true,
        stock: 99,
    },
    {
        _id: 'cart_2',
        id: 'cart_2',
        product_id: 'p_2',
        product_name: '玻尿酸保湿精华液 30ml 补水锁水',
        product_image: img('photo-1620916566398-39f1143ab7be'),
        name: '玻尿酸保湿精华液 30ml 补水锁水',
        image: img('photo-1620916566398-39f1143ab7be'),
        price: 89,
        original_price: 0,
        originalPrice: 0,
        quantity: 2,
        spec: '30ml/瓶',
        is_selected: true,
        stock: 200,
    },
];

const orderItems: OrderItemRecord[] = [
    {
        id: 'oi_1',
        name: '2024新款韩版宽松休闲运动套装',
        image: img('photo-1515886657613-9f3515b0c78f'),
        price: 199,
        quantity: 1,
        spec: '黑色 M码',
    },
    {
        id: 'oi_2',
        name: '玻尿酸保湿精华液 30ml',
        image: img('photo-1620916566398-39f1143ab7be'),
        price: 89,
        quantity: 2,
        spec: '30ml/瓶',
    },
];

/** 订单 mock */
export const mockOrders: OrderRecord[] = [
    {
        _id: 'o_1',
        id: 'o_1',
        orderNo: 'SO202408200001',
        status: 'pending',
        items: orderItems,
        total: 377,
        freight: 0,
        createTime: '2024-08-20 12:30:00',
        payMethod: '',
    },
    {
        _id: 'o_2',
        id: 'o_2',
        orderNo: 'SO202408180002',
        status: 'completed',
        items: orderItems.slice(0, 1),
        total: 199,
        freight: 0,
        createTime: '2024-08-18 09:12:00',
        payMethod: 'wechat',
    },
];

/** 会员 mock（低代码会员页使用） */
export const mockMembers: MemberRecord[] = [
    {
        _id: 'm_1',
        nick_name: '商城会员',
        phone: '13800000000',
        avatar_url: '',
        vip_level: 2,
        points: 1280,
        coupons: 3,
        favorites: 6,
        views: 42,
        addresses: [],
    },
];

/**
 * 兜底数据源调用
 * 写操作（新增/更新/删除）直接视为成功；读操作返回 mock 数据
 */
export function mockCallDataSource<T = WedaRecord>({
    dataSourceName,
    methodName,
    params,
}: WedaDataSourceRequest): Promise<WedaDataSourceResult<T>> {
    if (/Create|Update|Delete/i.test(methodName)) {
        // 新增会员时回传 id，供页面继续使用
        const id = `m_${Date.now()}`;
        return Promise.resolve({
            id,
            data: { id, ...(params?.data ?? params?.record ?? {}) },
        } as WedaDataSourceResult<T>);
    }

    if (dataSourceName === 'shop_member') {
        return Promise.resolve(wrapResult<T>(mockMembers));
    }

    if (dataSourceName === 'shop_product') {
        if (/GetItem/i.test(methodName)) {
            const id = params?.query?._id;
            const item = mockProducts.find((product) => product._id === id || product.id === id);
            return Promise.resolve({ data: item as unknown as T } as WedaDataSourceResult<T>);
        }
        return Promise.resolve(wrapResult<T>(mockProducts));
    }

    if (dataSourceName === 'shop_cart') {
        return Promise.resolve(wrapResult<T>(mockCartRecords));
    }

    if (dataSourceName === 'shop_order') {
        return Promise.resolve(wrapResult<T>(mockOrders));
    }

    return Promise.resolve({ records: [], total: 0 } as WedaDataSourceResult<T>);
}

/**
 * 统一包装返回结构
 *
 * 低代码页面里对返回值的读取方式并不统一：
 * - 有的用 result.records
 * - 有的用 result.data.records
 * - 有的把 result.data 当数组用（result.data.length / result.data[0]）
 * 这里返回"数组 + records 属性"的形式，同时兼容以上几种写法
 */
function wrapResult<T>(records: WedaRecord[]): WedaDataSourceResult<T> {
    const data = Object.assign([...records], { records, total: records.length });

    return {
        records: records as unknown as T[],
        total: records.length,
        data: data as unknown as T,
    } as WedaDataSourceResult<T>;
}
