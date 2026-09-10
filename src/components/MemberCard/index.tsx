import {
    Bell,
    ChevronRight,
    Clock,
    Heart,
    HelpCircle,
    LogOut,
    type LucideIcon,
    MapPin,
    Settings,
    Ticket,
} from 'lucide-react';

/** 会员信息 */
export interface MemberUser {
    /** 会员 id（尚未创建时为 null） */
    id?: string | null;
    /** 昵称 */
    nickName?: string;
    /** 手机号 */
    phone?: string;
    /** 头像地址 */
    avatarUrl?: string | null;
    /** 会员等级 */
    vipLevel?: number;
}

/** 会员统计数据 */
export interface MemberStatsData {
    /** 优惠券数量 */
    coupons: number;
    /** 积分 */
    points: number;
    /** 收藏数 */
    favorites: number;
    /** 足迹数 */
    views: number;
}

export interface MemberHeaderProps {
    /** 会员信息（未登录为 null） */
    user: MemberUser | null;
    /** 点击头像 */
    onAvatarClick?: () => void;
    /** 是否加载中 */
    loading?: boolean;
}

/** 会员头部：头像 + 昵称 + 手机号 + 等级 */
export function MemberHeader({ user, onAvatarClick, loading = false }: MemberHeaderProps) {
    const nickName = user?.nickName ?? '未登录';
    const phoneText = user?.phone
        ? `${user.phone.slice(0, 3)}****${user.phone.slice(-4)}`
        : '登录后查看更多权益';

    return (
        <div className="bg-gradient-to-b from-orange-50 to-background px-4 pt-8 pb-6">
            <div className="mx-auto flex max-w-lg items-center gap-4">
                <button
                    type="button"
                    onClick={onAvatarClick}
                    className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-md"
                >
                    {user?.avatarUrl ? (
                        <img
                            src={user.avatarUrl}
                            alt={nickName}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <span className="text-3xl">👤</span>
                    )}
                </button>

                <div className="min-w-0 flex-1">
                    <h1 className="truncate text-lg font-semibold text-stone-800">{nickName}</h1>
                    <p className="mt-1 text-xs text-stone-500">{phoneText}</p>
                    {!!user?.vipLevel && user.vipLevel > 0 && (
                        <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                            VIP {user.vipLevel}
                        </span>
                    )}
                </div>

                {loading && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
                )}
            </div>
        </div>
    );
}

export interface MemberStatsProps {
    /** 统计数据 */
    stats: MemberStatsData;
}

/** 会员数据概览（优惠券 / 积分 / 收藏 / 足迹） */
export function MemberStats({ stats }: MemberStatsProps) {
    const items: { key: keyof MemberStatsData; label: string; value: number }[] = [
        { key: 'coupons', label: '优惠券', value: stats.coupons },
        { key: 'points', label: '积分', value: stats.points },
        { key: 'favorites', label: '收藏', value: stats.favorites },
        { key: 'views', label: '足迹', value: stats.views },
    ];

    return (
        <div className="mx-4 rounded-2xl bg-white p-4 shadow-sm">
            <div className="grid grid-cols-4 gap-2">
                {items.map((item) => (
                    <div key={item.key} className="flex flex-col items-center gap-1">
                        <span className="text-lg font-bold text-stone-800">{item.value}</span>
                        <span className="text-xs text-stone-400">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/** 会员菜单项 */
export interface MemberMenuItem {
    /** 菜单 id，与页面 handleMenuClick 的 switch 对应 */
    id: string;
    label: string;
    icon: LucideIcon;
}

export interface MemberMenuProps {
    /** 点击菜单项 */
    onItemClick?: (id: string) => void;
}

/** 会员中心菜单 */
export const MEMBER_MENU_ITEMS: MemberMenuItem[] = [
    { id: 'address', label: '收货地址', icon: MapPin },
    { id: 'coupon', label: '优惠券', icon: Ticket },
    { id: 'favorite', label: '我的收藏', icon: Heart },
    { id: 'history', label: '浏览历史', icon: Clock },
    { id: 'notification', label: '消息通知', icon: Bell },
    { id: 'help', label: '帮助中心', icon: HelpCircle },
    { id: 'settings', label: '设置', icon: Settings },
    { id: 'logout', label: '退出登录', icon: LogOut },
];

export function MemberMenu({ onItemClick }: MemberMenuProps) {
    return (
        <div className="mx-4 mt-3 overflow-hidden rounded-2xl bg-white shadow-sm">
            {MEMBER_MENU_ITEMS.map((item, index) => {
                const Icon = item.icon;

                return (
                    <button
                        type="button"
                        key={item.id}
                        onClick={() => onItemClick?.(item.id)}
                        className={`flex w-full items-center justify-between px-4 py-3.5 ${
                            index === MEMBER_MENU_ITEMS.length - 1
                                ? ''
                                : 'border-b border-stone-100'
                        }`}
                    >
                        <span className="flex items-center gap-3 text-sm text-stone-700">
                            <Icon className="h-4 w-4 text-stone-400" />
                            {item.label}
                        </span>
                        <ChevronRight className="h-4 w-4 text-stone-300" />
                    </button>
                );
            })}
        </div>
    );
}
