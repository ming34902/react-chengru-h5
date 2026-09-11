/* eslint-disable react-hooks/exhaustive-deps -- 低代码生成页面：副作用依赖数组按平台生成逻辑保留原样 */
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';

import {
    CheckCircle,
    Clock,
    Copy,
    CreditCard,
    MapPin,
    MessageCircle,
    Package,
    Truck,
} from 'lucide-react';

import { Header } from '@/components/Header';
import { useToast } from '@/components/Toast';

import { callDataSource } from '@/api';
import type { OrderItemRecord, OrderRecord } from '@/types/weda';

export default function OrderDetailPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [order, setOrder] = useState<OrderRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    // 获取订单号（来自路由 query：/order-detail?orderNo=xxx 或 ?id=xxx）
    const getOrderNo = () => searchParams.get('orderNo') || searchParams.get('id') || '';

    // 查询订单详情
    const fetchOrderDetail = useCallback(async () => {
        try {
            setLoading(true);
            const orderNo = getOrderNo();
            if (!orderNo) {
                // 如果没有订单号，显示空状态
                setLoading(false);
                return;
            }

            // 查询订单数据
            const result = await callDataSource({
                dataSourceName: 'shop_order',
                methodName: 'wedaGetRecordsV2',
                params: {
                    query: {
                        order_no: orderNo,
                    },
                    pageSize: 1,
                },
            });
            if (result?.data && result.data.length > 0) {
                const item = result.data[0];
                const orderData = {
                    id: item._id,
                    orderNo: item.order_no || '',
                    status: item.status || 'pending',
                    items: (item.items || []).map((i: OrderItemRecord) => ({
                        id: i.product_id,
                        name: i.product_name,
                        price: i.price,
                        originalPrice: i.original_price,
                        quantity: i.quantity,
                        image: i.product_image,
                        spec: i.spec,
                    })),
                    subtotal: item.total_amount - (item.freight || 0),
                    freight: item.freight || 0,
                    discount: item.discount_amount || 0,
                    total: item.pay_amount || item.total_amount || 0,
                    address: item.address || {},
                    payMethod: item.pay_method || '',
                    payTime: item.pay_time || '',
                    expressNo: item.express_no || '',
                    expressCompany: item.express_company || '',
                    remark: item.remark || '',
                    createTime: item.createdAt
                        ? new Date(item.createdAt).toLocaleString('zh-CN')
                        : '',
                    shipTime: item.ship_time || '',
                    receiveTime: item.receive_time || '',
                };
                setOrder(orderData);
            } else {
                toast({
                    title: '订单不存在',
                    description: '无法找到该订单',
                    variant: 'warning',
                });
            }
        } catch (error) {
            console.error('加载订单详情失败:', error);
            toast({
                title: '加载失败',
                description: '订单详情加载失败',
                variant: 'error',
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);
    useEffect(() => {
        fetchOrderDetail();
    }, [fetchOrderDetail]);

    // 获取状态文本
    const getStatusText = (status: string) => {
        const statusMap: Record<string, string> = {
            pending: '待支付',
            paid: '已支付',
            shipped: '商品运输中',
            completed: '已完成',
            cancelled: '已取消',
        };
        return statusMap[status] || '未知状态';
    };

    // 获取当前步骤
    const getCurrentStep = (status: string) => {
        const stepMap: Record<string, number> = {
            pending: 0,
            paid: 1,
            shipped: 2,
            completed: 3,
            cancelled: -1,
        };
        return stepMap[status] ?? 0;
    };

    // 状态步骤
    const statusSteps = [
        {
            id: 'created',
            label: '订单创建',
            icon: Clock,
        },
        {
            id: 'paid',
            label: '支付成功',
            icon: CheckCircle,
        },
        {
            id: 'shipped',
            label: '商品发货',
            icon: Truck,
        },
        {
            id: 'delivered',
            label: '确认收货',
            icon: Package,
        },
    ];

    // 复制订单号
    const handleCopyNo = () => {
        if (order?.orderNo) {
            navigator.clipboard.writeText(order.orderNo);
            toast({
                title: '订单号已复制',
                variant: 'success',
            });
        }
    };

    // 联系客服
    const handleContact = () => {
        toast({
            title: '联系客服',
            description: '客服热线: 400-xxx-xxxx',
        });
    };

    // 确认收货
    const handleReceive = async () => {
        try {
            await callDataSource({
                dataSourceName: 'shop_order',
                methodName: 'wedaUpdateV2',
                params: {
                    filter: {
                        order_no: order?.orderNo,
                    },
                    update: {
                        status: 'completed',
                        receive_time: new Date().toISOString(),
                    },
                },
            });
            toast({
                title: '确认收货成功',
                description: '感谢您的购买！',
                variant: 'success',
            });
            fetchOrderDetail();
        } catch (error) {
            console.error('确认收货失败:', error);
            toast({
                title: '操作失败',
                description: '请稍后重试',
                variant: 'error',
            });
        }
    };

    // 查看物流
    const handleLogistics = () => {
        if (order?.expressNo) {
            toast({
                title: '物流信息',
                description: `${order.expressCompany}: ${order.expressNo}`,
            });
        }
    };

    // 继续支付
    const handleContinuePay = () => {
        toast({
            title: '继续支付',
            description: '正在跳转微信支付...',
        });
        setTimeout(() => {
            navigate('/checkout');
        }, 1500);
    };
    if (loading) {
        return (
            <div className="min-h-screen page-content-bg">
                <Header title="订单详情" showBack onBack={() => navigate(-1)} />
                <div className="skeleton-delayed mx-4 mt-4 space-y-4">
                    <div className="bg-white rounded-2xl p-5 animate-pulse">
                        <div className="h-20 bg-gray-200 rounded-xl"></div>
                    </div>
                    <div className="bg-white rounded-2xl p-4 animate-pulse">
                        <div className="h-32 bg-gray-200 rounded-xl"></div>
                    </div>
                </div>
            </div>
        );
    }
    if (!order) {
        return (
            <div className="min-h-screen page-content-bg">
                <Header title="订单详情" showBack onBack={() => navigate(-1)} />
                <div className="flex flex-col items-center justify-center py-20">
                    <p className="text-stone-500">订单不存在</p>
                    <button
                        type="button"
                        onClick={() => navigate('/orders')}
                        className="mt-4 px-6 py-2 bg-primary-500 text-white rounded-full"
                    >
                        返回订单列表
                    </button>
                </div>
            </div>
        );
    }
    const currentStep = getCurrentStep(order.status ?? 'pending');
    const payMethodText = order.payMethod === 'wechat' ? '微信支付' : order.payMethod || '未支付';
    return (
        <div className="min-h-screen page-content-bg pb-28">
            <Header title="订单详情" showBack onBack={() => navigate(-1)} />

            {/* Status Banner */}
            <div
                className={`mx-4 mt-4 rounded-2xl p-5 text-white ${order.status === 'cancelled' ? 'bg-stone-500' : order.status === 'completed' ? 'bg-green-500' : 'bg-gradient-to-r from-primary-500 to-secondary-500'}`}
            >
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                        {order.status === 'cancelled' ? (
                            <Package className="w-6 h-6" />
                        ) : order.status === 'completed' ? (
                            <CheckCircle className="w-6 h-6" />
                        ) : (
                            <Truck className="w-6 h-6" />
                        )}
                    </div>
                    <div>
                        <h2 className="font-semibold text-lg">
                            {getStatusText(order.status ?? 'pending')}
                        </h2>
                        <p className="text-white/80 text-sm mt-1">
                            {order.status === 'pending' && '请尽快完成支付'}
                            {order.status === 'paid' && '商家正在准备商品'}
                            {order.status === 'shipped' && '预计 2-3 天送达'}
                            {order.status === 'completed' && '交易已完成，感谢购买'}
                            {order.status === 'cancelled' && '订单已取消'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Address */}
            <div className="mx-4 mt-3 bg-white rounded-2xl p-4 flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary-500 flex-shrink-0 mt-1" />
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-stone-800">{order.address.name}</span>
                        <span className="text-stone-600">{order.address.phone}</span>
                    </div>
                    <p className="text-sm text-stone-500 mt-1">
                        {order.address.province}
                        {order.address.city}
                        {order.address.district}
                        {order.address.detail}
                    </p>
                </div>
            </div>

            {/* Status Timeline - 只在非取消状态下显示 */}
            {order.status !== 'cancelled' && order.status !== 'pending' && (
                <div className="mx-4 mt-3 bg-white rounded-2xl p-4">
                    <h3 className="font-medium text-stone-800 mb-4">订单跟踪</h3>
                    <div className="relative">
                        {/* Progress Line */}
                        <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-stone-200" />
                        <div
                            className="absolute left-4 top-4 w-0.5 bg-primary-500 transition-all"
                            style={{
                                height:
                                    currentStep > 0
                                        ? `${(currentStep / (statusSteps.length - 1)) * 100}%`
                                        : '0%',
                            }}
                        />

                        {/* Steps */}
                        <div className="space-y-6">
                            {statusSteps.map((step, index) => {
                                const Icon = step.icon;
                                const isActive = index <= currentStep;
                                const isCurrent = index === currentStep;

                                // 获取对应时间
                                let stepTime = '';
                                if (index === 0) stepTime = order?.createTime ?? '';
                                if (index === 1) stepTime = order?.payTime ?? '';
                                if (index === 2) stepTime = order?.shipTime ?? '';
                                if (index === 3) stepTime = order?.receiveTime ?? '';
                                return (
                                    <div key={step.id} className="relative flex items-start gap-3">
                                        <div
                                            className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${isActive ? 'bg-primary-500 text-white' : 'bg-stone-200 text-stone-400'} ${isCurrent ? 'ring-4 ring-primary-200' : ''}`}
                                        >
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 pt-1">
                                            <p
                                                className={`text-sm font-medium ${isActive ? 'text-stone-800' : 'text-stone-400'}`}
                                            >
                                                {step.label}
                                            </p>
                                            {stepTime && (
                                                <p className="text-xs text-stone-400 mt-0.5">
                                                    {stepTime}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Logistics Info */}
            {order.status === 'shipped' && order.expressNo && (
                <div
                    onClick={handleLogistics}
                    className="mx-4 mt-3 bg-white rounded-2xl p-4 cursor-pointer hover:shadow-soft transition-shadow"
                >
                    <h3 className="text-sm font-medium text-stone-600 mb-2">物流信息</h3>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-stone-700">{order.expressCompany}</p>
                            <p className="text-xs text-stone-400 mt-1">{order.expressNo}</p>
                        </div>
                        <span className="text-sm text-primary-600">查看详情 →</span>
                    </div>
                </div>
            )}

            {/* Products */}
            <div className="mx-4 mt-3 bg-white rounded-2xl overflow-hidden">
                <div className="p-4 space-y-3">
                    {(order.items ?? []).map((item, index) => (
                        <div key={item.id || index} className="flex gap-3">
                            <div className="w-20 h-20 bg-stone-100 rounded-xl overflow-hidden flex-shrink-0">
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src =
                                            'https://via.placeholder.com/80?text=商品';
                                    }}
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm text-stone-800 line-clamp-2 leading-snug">
                                    {item.name}
                                </h4>
                                <p className="text-xs text-stone-400 mt-1">{item.spec}</p>
                                <div className="flex items-center justify-between mt-1">
                                    <span className="text-sm font-medium text-primary-600">
                                        ¥{(item.price || 0).toFixed(2)}
                                    </span>
                                    <span className="text-xs text-stone-400">x{item.quantity}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Order Info */}
            <div className="mx-4 mt-3 bg-white rounded-2xl p-4">
                <h3 className="text-sm font-medium text-stone-600 mb-3">订单信息</h3>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-stone-400">订单编号</span>
                        <div className="flex items-center gap-2">
                            <span className="text-stone-700">{order.orderNo}</span>
                            <button
                                type="button"
                                onClick={handleCopyNo}
                                className="text-primary-600 text-xs flex items-center gap-1"
                            >
                                <Copy className="w-3 h-3" />
                                复制
                            </button>
                        </div>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-stone-400">下单时间</span>
                        <span className="text-stone-700">{order.createTime}</span>
                    </div>
                    {order.payTime && (
                        <div className="flex justify-between">
                            <span className="text-stone-400">支付时间</span>
                            <span className="text-stone-700">{order.payTime}</span>
                        </div>
                    )}
                    <div className="flex justify-between">
                        <span className="text-stone-400">支付方式</span>
                        <div className="flex items-center gap-1 text-stone-700">
                            {order.payMethod === 'wechat' ? (
                                <>
                                    <MessageCircle className="w-4 h-4 text-green-600" />
                                    <span>微信支付</span>
                                </>
                            ) : (
                                <>
                                    <CreditCard className="w-4 h-4 text-stone-400" />
                                    <span>{payMethodText}</span>
                                </>
                            )}
                        </div>
                    </div>
                    {order.remark && (
                        <div className="flex justify-between">
                            <span className="text-stone-400">订单备注</span>
                            <span className="text-stone-700">{order.remark}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Summary */}
            <div className="mx-4 mt-3 bg-white rounded-2xl p-4">
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-stone-400">商品金额</span>
                        <span className="text-stone-700">¥{(order.subtotal || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-stone-400">运费</span>
                        <span className="text-stone-700">
                            {order.freight === 0 ? '免运费' : `¥${(order.freight || 0).toFixed(2)}`}
                        </span>
                    </div>
                    {order.discount > 0 && (
                        <div className="flex justify-between">
                            <span className="text-stone-400">优惠</span>
                            <span className="text-primary-600">
                                -¥{(order.discount || 0).toFixed(2)}
                            </span>
                        </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-stone-100">
                        <span className="font-medium text-stone-700">实付金额</span>
                        <span className="text-lg font-bold text-primary-600">
                            ¥{(order.total || 0).toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 safe-bottom z-50">
                <div className="flex items-center justify-center h-16 max-w-lg mx-auto px-4 gap-3">
                    {/* 待支付状态 */}
                    {order.status === 'pending' && (
                        <>
                            <button
                                type="button"
                                onClick={handleContact}
                                className="flex-1 py-2.5 border-2 border-stone-200 text-stone-600 font-medium rounded-full hover:border-stone-300 transition-colors"
                            >
                                联系客服
                            </button>
                            <button
                                type="button"
                                onClick={handleContinuePay}
                                className="flex-1 py-2.5 bg-green-500 text-white font-semibold rounded-full hover:bg-green-600 transition-colors shadow-lg shadow-green-500/30 flex items-center justify-center gap-2"
                            >
                                <MessageCircle className="w-5 h-5" />
                                继续支付
                            </button>
                        </>
                    )}

                    {/* 已发货状态 */}
                    {order.status === 'shipped' && (
                        <>
                            <button
                                type="button"
                                onClick={handleContact}
                                className="flex-1 py-2.5 border-2 border-stone-200 text-stone-600 font-medium rounded-full hover:border-stone-300 transition-colors"
                            >
                                联系客服
                            </button>
                            <button
                                type="button"
                                onClick={handleReceive}
                                className="flex-1 py-2.5 bg-primary-500 text-white font-semibold rounded-full hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/30"
                            >
                                确认收货
                            </button>
                        </>
                    )}

                    {/* 已完成状态 */}
                    {order.status === 'completed' && (
                        <button
                            type="button"
                            className="flex-1 py-2.5 border-2 border-primary-500 text-primary-500 font-medium rounded-full hover:bg-primary-50 transition-colors"
                        >
                            立即评价
                        </button>
                    )}

                    {/* 已取消状态 */}
                    {order.status === 'cancelled' && (
                        <button
                            type="button"
                            onClick={() => navigate('/orders')}
                            className="flex-1 py-2.5 bg-primary-500 text-white font-semibold rounded-full hover:bg-primary-600 transition-colors"
                        >
                            返回订单列表
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
