/* eslint-disable @eslint-react/no-array-index-key -- 低代码生成组件：列表 key 按平台实现保留 */
import { CheckCircle, Clock, type LucideIcon, Package, Trash2, Truck, XCircle } from 'lucide-react';

import type { OrderRecord } from '@/types/weda';

/** 订单状态展示配置 */
interface OrderStatusConfig {
    label: string;
    color: string;
    bg: string;
    icon: LucideIcon;
}

export interface OrderCardProps {
    /** 订单数据 */
    order: OrderRecord;
    /** 订单操作回调（pay/cancel/confirm/review/delete） */
    onAction?: (action: string, order: OrderRecord) => void;
    /** 点击订单卡片 */
    onClick?: (order: OrderRecord) => void;
}

export function OrderCard({ order, onAction, onClick }: OrderCardProps) {
    const statusConfig: Record<string, OrderStatusConfig> = {
        pending: {
            label: '待付款',
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            icon: Clock,
        },
        paid: {
            label: '待发货',
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            icon: Package,
        },
        shipped: {
            label: '待收货',
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            icon: Truck,
        },
        completed: {
            label: '已完成',
            color: 'text-green-600',
            bg: 'bg-green-50',
            icon: CheckCircle,
        },
        cancelled: {
            label: '已取消',
            color: 'text-stone-400',
            bg: 'bg-stone-100',
            icon: XCircle,
        },
    };
    const status = statusConfig[order.status ?? 'pending'] ?? statusConfig.pending;
    const items = order.items ?? [];
    return (
        <div
            onClick={() => onClick?.(order)}
            className="bg-white rounded-2xl p-4 shadow-card cursor-pointer hover:shadow-soft transition-shadow"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-stone-400">订单号：{order.orderNo}</span>
                <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}
                >
                    {status.label}
                </span>
            </div>

            {/* Products */}
            <div className="space-y-3">
                {items.slice(0, 3).map((item, index) => (
                    <div key={index} className="flex gap-3">
                        <div className="w-16 h-16 bg-stone-100 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm text-stone-800 line-clamp-2 leading-snug">
                                {item.name}
                            </h4>
                            <p className="text-xs text-stone-400 mt-1">{item.spec || '默认规格'}</p>
                            <div className="flex items-center justify-between mt-1">
                                <span className="text-sm font-medium text-primary-600">
                                    ¥{(item.price || 0).toFixed(2)}
                                </span>
                                <span className="text-xs text-stone-400">
                                    x{item.quantity || 1}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
                {items.length > 3 && (
                    <p className="text-xs text-stone-400 text-center">
                        查看全部 {items.length} 件商品
                    </p>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-stone-100">
                <div className="flex items-baseline gap-1">
                    <span className="text-xs text-stone-400">合计</span>
                    <span className="text-lg font-bold text-stone-800">
                        ¥{(order.total || 0).toFixed(2)}
                    </span>
                    {order.freight > 0 && (
                        <span className="text-xs text-stone-400">(含运费¥{order.freight})</span>
                    )}
                </div>

                <div className="flex gap-2 items-center">
                    {/* 待付款状态：显示取消和支付按钮 */}
                    {order.status === 'pending' && (
                        <>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAction?.('cancel', order);
                                }}
                                className="px-4 py-1.5 border border-stone-200 text-stone-500 text-sm rounded-full hover:border-stone-300 transition-colors"
                            >
                                取消订单
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAction?.('pay', order);
                                }}
                                className="px-4 py-1.5 bg-primary-500 text-white text-sm rounded-full hover:bg-primary-600 transition-colors"
                            >
                                立即支付
                            </button>
                        </>
                    )}

                    {/* 待收货状态：显示确认收货按钮 */}
                    {order.status === 'shipped' && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onAction?.('receive', order);
                            }}
                            className="px-4 py-1.5 bg-primary-500 text-white text-sm rounded-full hover:bg-primary-600 transition-colors"
                        >
                            确认收货
                        </button>
                    )}

                    {/* 已完成状态：显示评价和删除按钮 */}
                    {order.status === 'completed' && (
                        <>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAction?.('review', order);
                                }}
                                className="px-4 py-1.5 border border-primary-500 text-primary-500 text-sm rounded-full hover:bg-primary-50 transition-colors"
                            >
                                立即评价
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAction?.('delete', order);
                                }}
                                className="p-1.5 text-stone-400 hover:text-red-500 transition-colors"
                                title="删除订单"
                            >
                                <Trash2 size={18} />
                            </button>
                        </>
                    )}

                    {/* 已取消状态：只显示删除按钮 */}
                    {order.status === 'cancelled' && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onAction?.('delete', order);
                            }}
                            className="p-1.5 text-stone-400 hover:text-red-500 transition-colors"
                            title="删除订单"
                        >
                            <Trash2 size={18} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
export interface OrderTabsProps {
    /** 当前激活 tab */
    activeTab?: string;
    /** tab 切换回调 */
    onTabChange?: (id: string) => void;
    /** 各状态订单数量 */
    counts?: Record<string, number>;
}

/** 订单 tab 项 */
interface OrderTabItem {
    id: string;
    label: string;
    count?: number;
}

export function OrderTabs({ activeTab, onTabChange, counts }: OrderTabsProps) {
    const tabs: OrderTabItem[] = [
        {
            id: 'all',
            label: '全部',
        },
        {
            id: 'pending',
            label: '待付款',
            count: counts?.pending,
        },
        {
            id: 'paid',
            label: '待发货',
            count: counts?.paid,
        },
        {
            id: 'shipped',
            label: '待收货',
            count: counts?.shipped,
        },
        {
            id: 'completed',
            label: '已完成',
            count: counts?.completed,
        },
    ];
    return (
        <div className="sticky sticky-fix-keep-px top-14 z-20 border-b border-stone-100 bg-white">
            {/*
                5 个状态按等分宽度排列（flex-1 + min-w-0 + whitespace-nowrap）：
                1. 各状态的数量是异步加载出来的，等分宽度不会因为「多了数字」而改变每项宽度，
                   也就不会出现 tab 宽度跳动 / 抖动
                2. 去掉 overflow-x-auto：吸顶栏内部存在横向滚动容器时会生成合成层，
                   吸顶栏在页面滚动时会被吸附到整数像素而抖动
                3. 文案与内边距收窄，保证 5 个 tab 加数量后仍在一屏内，不产生横向溢出
            */}
            <div className="flex max-w-lg mx-auto">
                {tabs.map((tab) => (
                    <button
                        type="button"
                        key={tab.id}
                        onClick={() => onTabChange?.(tab.id)}
                        className={`flex-1 min-w-0 whitespace-nowrap px-1 py-3 text-xs font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'text-primary-600 border-primary-600' : 'text-stone-400 border-transparent'}`}
                    >
                        {tab.label}
                        {(tab.count ?? 0) > 0 && (
                            <span
                                className={`ml-0.5 text-[10px] ${activeTab === tab.id ? 'text-primary-600' : 'text-stone-400'}`}
                            >
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
export interface EmptyOrderProps {
    /** 空状态类型：all / pending / paid / shipped / completed / cancelled */
    type?: string;
}

export function EmptyOrder({ type }: EmptyOrderProps) {
    const messages: Record<string, { title: string; desc: string; icon: string }> = {
        all: {
            title: '暂无订单',
            desc: '快去挑选心仪的商品吧',
            icon: '📦',
        },
        pending: {
            title: '暂无待付款订单',
            desc: '看看有哪些商品在等你',
            icon: '💳',
        },
        paid: {
            title: '暂无待发货订单',
            desc: '商品正在准备中',
            icon: '📝',
        },
        shipped: {
            title: '暂无待收货订单',
            desc: '包裹正在路上',
            icon: '🚚',
        },
        completed: {
            title: '暂无已完成订单',
            desc: '完成购买后可查看',
            icon: '✨',
        },
        cancelled: {
            title: '暂无已取消订单',
            desc: '被取消的订单将在此显示',
            icon: '❌',
        },
    };
    const msg = messages[type ?? 'all'] ?? messages.all;
    return (
        <div className="flex flex-col items-center justify-center py-20">
            <div className="text-6xl mb-4">{msg.icon}</div>
            <h3 className="font-serif text-xl text-stone-600 mb-2">{msg.title}</h3>
            <p className="text-sm text-stone-400 mb-6">{msg.desc}</p>
            <button
                type="button"
                onClick={() => {
                    // 跳转到商品列表
                    if (typeof window !== 'undefined') {
                        window.location.href = '/products';
                    }
                }}
                className="px-8 py-2.5 bg-primary-500 text-white font-semibold rounded-full hover:bg-primary-600 transition-colors"
            >
                去购物
            </button>
        </div>
    );
}
