/* eslint-disable react-hooks/exhaustive-deps -- 低代码生成页面：副作用依赖数组按平台生成逻辑保留原样 */
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import { Header } from '@/components/Header';
import { EmptyOrder, OrderCard, OrderTabs } from '@/components/OrderCard';
import { useToast } from '@/components/Toast';

import { useUserStore } from '@/stores';

import { callDataSource } from '@/api';
import type { OrderRecord, WedaRecord } from '@/types/weda';
import { buildPath } from '@/utils/router';

export default function OrdersPage() {
    const navigate = useNavigate();
    const [filterStatus, setFilterStatus] = useState('all');
    const [orders, setOrders] = useState<OrderRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [counts, setCounts] = useState<Record<string, number>>({
        pending: 0,
        paid: 0,
        shipped: 0,
        completed: 0,
    });
    const { toast } = useToast();

    // 获取当前用户手机号（登录态由 useUserStore 管理）
    const storeUser = useUserStore((state) => state.user);
    const getUserPhone = () =>
        storeUser?.phone || storeUser?.username || localStorage.getItem('user_phone') || '';

    // 查询订单数据
    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            const phone = getUserPhone();
            if (!phone) {
                // 未登录时使用本地存储
                const localOrders = JSON.parse(localStorage.getItem('orders') || '[]');
                setOrders(localOrders);
                updateCounts(localOrders);
                setLoading(false);
                return;
            }

            // 查询真实订单数据
            const result = await callDataSource({
                dataSourceName: 'shop_order',
                methodName: 'wedaGetRecordsV2',
                params: {
                    query: {
                        user_phone: phone,
                    },
                    sort: {
                        createdAt: -1,
                    },
                    pageSize: 100,
                },
            });
            const orderList = (result?.data || []).map((item: WedaRecord) => ({
                id: item.id ?? item._id,
                orderNo: item.orderNo || '',
                status: item.status || 'pending',
                items: item.items || [],
                total: item.payAmount ?? item.totalAmount ?? 0,
                freight: item.freight || 0,
                discountAmount: 0,
                createTime: item.createTime || '',
                address: item.address || {},
                payMethod: item.payMethod || '',
                expressNo: '',
                expressCompany: '',
                remark: item.remark || '',
            }));
            setOrders(orderList);
            updateCounts(orderList);

            // 同步到本地存储作为备份
            localStorage.setItem('orders', JSON.stringify(orderList));
        } catch (error) {
            console.error('查询订单失败:', error);
            // 查询失败时使用本地存储
            const localOrders = JSON.parse(localStorage.getItem('orders') || '[]');
            setOrders(localOrders);
            updateCounts(localOrders);
            toast({
                title: '提示',
                description: '订单数据加载失败，请稍后重试',
                variant: 'warning',
            });
        } finally {
            setLoading(false);
        }
    }, []);

    // 更新各状态订单数量
    const updateCounts = (orderList: OrderRecord[]) => {
        const newCounts = {
            pending: orderList.filter((o) => o.status === 'pending').length,
            paid: orderList.filter((o) => o.status === 'paid').length,
            shipped: orderList.filter((o) => o.status === 'shipped').length,
            completed: orderList.filter((o) => o.status === 'completed').length,
        };
        setCounts(newCounts);
    };

    // 组件挂载时和筛选状态变化时获取数据
    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // 筛选订单
    const filteredOrders =
        filterStatus === 'all' ? orders : orders.filter((order) => order.status === filterStatus);

    // 订单操作处理
    const handleAction = async (action: string, order: OrderRecord) => {
        switch (action) {
            case 'cancel':
                try {
                    // 更新订单状态为已取消
                    await callDataSource({
                        dataSourceName: 'shop_order',
                        methodName: 'wedaUpdateV2',
                        params: {
                            filter: {
                                _id: order.id,
                            },
                            update: {
                                status: 'cancelled',
                            },
                        },
                    });
                    toast({
                        title: '订单已取消',
                        description: `订单号: ${order.orderNo}`,
                        variant: 'success',
                    });

                    // 刷新订单列表
                    fetchOrders();
                } catch (error) {
                    console.error('取消订单失败:', error);
                    toast({
                        title: '取消失败',
                        description: '请稍后重试',
                        variant: 'error',
                    });
                }
                break;
            case 'pay':
                toast({
                    title: '正在跳转支付...',
                    description: `订单金额: ¥${order.total.toFixed(2)}`,
                });
                // 实际跳转微信支付
                setTimeout(() => {
                    navigate(buildPath('/checkout', { orderId: order.id }));
                }, 1500);
                break;
            case 'receive':
                try {
                    // 确认收货
                    await callDataSource({
                        dataSourceName: 'shop_order',
                        methodName: 'wedaUpdateV2',
                        params: {
                            filter: {
                                _id: order.id,
                            },
                            update: {
                                status: 'completed',
                                receive_time: new Date().toISOString(),
                            },
                        },
                    });
                    toast({
                        title: '确认收货成功',
                        description: `订单号: ${order.orderNo}`,
                        variant: 'success',
                    });

                    // 刷新订单列表
                    fetchOrders();
                } catch (error) {
                    console.error('确认收货失败:', error);
                    toast({
                        title: '操作失败',
                        description: '请稍后重试',
                        variant: 'error',
                    });
                }
                break;
            case 'review':
                toast({
                    title: '评价',
                    description: '感谢您的评价',
                });
                break;
            case 'delete':
                try {
                    // 删除已取消/已完成订单
                    await callDataSource({
                        dataSourceName: 'shop_order',
                        methodName: 'wedaDeleteV2',
                        params: {
                            filter: {
                                _id: order.id,
                            },
                        },
                    });
                    toast({
                        title: '订单已删除',
                        description: `订单号: ${order.orderNo}`,
                        variant: 'success',
                    });

                    // 刷新订单列表
                    fetchOrders();
                } catch (error) {
                    console.error('删除订单失败:', error);
                    toast({
                        title: '删除失败',
                        description: '请稍后重试',
                        variant: 'error',
                    });
                }
                break;
            default:
                break;
        }
    };

    // 点击订单卡片
    const handleOrderClick = (order: OrderRecord) => {
        navigate(buildPath('/order-detail', { id: order.id, orderNo: order.orderNo }));
    };
    return (
        <div className="min-h-screen page-content-bg pb-20">
            <Header title="我的订单" />

            {/* Order Tabs */}
            <OrderTabs activeTab={filterStatus} onTabChange={setFilterStatus} counts={counts} />

            {/* Orders List */}
            <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
                {loading ? (
                    // 加载骨架屏（延迟出现，避免数据很快返回时「闪一下」）
                    <div className="skeleton-delayed space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                                    <div className="h-4 w-16 bg-gray-200 rounded"></div>
                                </div>
                                <div className="flex gap-3 mb-4">
                                    <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                                    <div className="flex-1">
                                        <div className="h-4 w-3/4 bg-gray-200 rounded mb-2"></div>
                                        <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                                    <div className="h-8 w-20 bg-gray-200 rounded-lg"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <EmptyOrder type={filterStatus} />
                ) : (
                    filteredOrders.map((order) => (
                        <OrderCard
                            key={order.id}
                            order={order}
                            onAction={handleAction}
                            onClick={handleOrderClick}
                        />
                    ))
                )}
            </main>
        </div>
    );
}
