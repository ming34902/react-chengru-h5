import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import { Dialog } from 'antd-mobile';

import {
    LoginForm,
    type LoginFormData,
    RegisterForm,
    type RegisterFormData,
} from '@/components/LoginForm';
import {
    MemberHeader,
    MemberMenu,
    MemberStats,
    type MemberStatsData,
    type MemberUser,
} from '@/components/MemberCard';
import { useToast } from '@/components/Toast';

import { selectCollection, selectIsLoggedIn, useUserStore } from '@/stores';

import { authApi } from '@/api';
import type { UserModel } from '@/types/api';
import { logoutUser } from '@/utils/auth';

export default function MemberPage() {
    const navigate = useNavigate();
    const [showLogin, setShowLogin] = useState(false);
    const [showRegister, setShowRegister] = useState(false);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    // 用户数据状态
    const [user, setUser] = useState<MemberUser | null>(null);
    const [stats, setStats] = useState<MemberStatsData>({
        coupons: 0,
        points: 0,
        favorites: 0,
        views: 0,
    });

    // 登录态统一由 useUserStore 管理（mock-token + user，刷新页面不丢失）
    const isLoggedInFromStore = useUserStore(selectIsLoggedIn);
    const storeUser = useUserStore((state) => state.user);
    /** 收藏商品列表（store 中 user.collection） */
    const collection = useUserStore(selectCollection);
    const loginToStore = useUserStore((state) => state.login);

    // 获取当前用户手机号（登录态由 useUserStore 管理，刷新页面不丢失）
    const userPhone = storeUser?.phone || storeUser?.username || '';
    const isLoggedIn = !!userPhone || isLoggedInFromStore;

    /**
     * 展示用的会员信息：优先使用会员接口数据；
     * 已登录（store 中已有登录成功后的 mock-token）但会员数据还没回来时，
     * 先用 store 中的用户信息兜底，避免 MemberCard 空白。
     */
    const displayUser: MemberUser | null =
        user ??
        (storeUser
            ? {
                  id: storeUser.id,
                  nickName: storeUser.nickname || storeUser.username,
                  phone: storeUser.phone || storeUser.username,
                  avatarUrl: storeUser.avatar,
                  vipLevel: 0,
              }
            : null);

    /**
     * MemberCard 的 loading：
     * 获取到登录成功后的 token（即已登录）时即为 false，不再展示 loading 圆圈样式
     */
    const memberCardLoading = loading && !isLoggedInFromStore;

    // 查询会员数据（GET /user/info：昵称、头像、等级、积分、优惠券、收藏）
    const fetchMemberData = useCallback(async () => {
        if (!userPhone) return;
        setLoading(true);
        try {
            const info = await authApi.getUserInfo({ phone: userPhone });
            setUser({
                id: info.id,
                nickName: info.nickname || '用户' + userPhone.slice(-4),
                phone: info.phone || userPhone,
                avatarUrl: info.avatar,
                vipLevel: info.vipLevel || 0,
            });
            setStats({
                coupons: info.coupons || 0,
                points: info.points || 0,
                favorites: info.collection?.length ?? 0,
                views: info.views || 0,
            });
        } catch (error) {
            // 用户不存在时回退到 store 中的登录信息（displayUser 有兜底）
            console.warn('查询会员数据失败:', error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, [userPhone]);

    // 说明：创建用户由接口完成（POST /user/create，见 handleLogin），这里不再单独维护本地创建逻辑

    // 初始化加载
    useEffect(() => {
        if (isLoggedIn) {
            fetchMemberData();
        }
    }, [isLoggedIn, fetchMemberData]);
    const handleAvatarClick = () => {
        if (!isLoggedIn) {
            setShowLogin(true);
        } else {
            toast({
                title: '个人资料',
                description: '编辑个人资料',
            });
        }
    };
    const handleLogin = async (formData: LoginFormData) => {
        setLoading(true);
        try {
            const phone = formData.phone;
            let info: UserModel;

            try {
                // 查询用户是否存在（GET /user/info）
                info = await authApi.getUserInfo({ phone });
            } catch {
                // 未注册：创建用户（POST /user/create，新用户默认 100 积分 + 1 张优惠券）
                info = await authApi.createUser({ phone, password: formData.password });
            }

            // 登录（POST /auth/login）：token 由接口返回并写入 localStorage
            const loginResult = await authApi.login({
                username: phone,
                password: formData.password,
            });
            loginToStore(loginResult);

            setUser({
                id: info.id,
                nickName: info.nickname || '用户' + phone.slice(-4),
                phone: info.phone || phone,
                avatarUrl: info.avatar,
                vipLevel: info.vipLevel || 0,
            });
            setStats({
                coupons: info.coupons || 0,
                points: info.points || 0,
                favorites: info.collection?.length ?? 0,
                views: info.views || 0,
            });

            setShowLogin(false);
            toast({
                title: '登录成功',
                description: '欢迎回来！',
                variant: 'success',
            });
        } catch (error) {
            console.error('登录失败:', error);
            toast({
                title: '登录失败',
                description: (error as Error).message || '请稍后重试',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };
    const handleRegister = async (formData: RegisterFormData) => {
        setLoading(true);
        try {
            const phone = formData.phone;
            const nickname = formData.nickname;

            // 注册（POST /auth/register）：手机号已存在时接口返回错误；注册成功即返回 token
            const loginResult = await authApi.register({
                phone,
                nickname,
                password: formData.password,
            });
            loginToStore(loginResult);

            const info = loginResult.user;
            setUser({
                id: info.id,
                nickName: info.nickname || nickname || '用户' + phone.slice(-4),
                phone: info.phone || phone,
                avatarUrl: info.avatar,
                vipLevel: info.vipLevel || 0,
            });
            setStats({
                coupons: info.coupons || 0,
                points: info.points || 0,
                favorites: info.collection?.length ?? 0,
                views: info.views || 0,
            });

            setShowRegister(false);
            setShowLogin(false);
            toast({
                title: '注册成功',
                description: '欢迎加入我们！新用户赠送100积分和1张优惠券',
                variant: 'success',
            });
        } catch (error) {
            console.error('注册失败:', error);
            toast({
                title: '注册失败',
                description: (error as Error).message || '请稍后重试',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };
    const handleMenuClick = async (id: string) => {
        if (!isLoggedIn && id !== 'help' && id !== 'settings') {
            setShowLogin(true);
            return;
        }
        switch (id) {
            case 'address':
                // 新用户先创建用户（POST /user/create）
                if (!user?.id) {
                    try {
                        const info = await authApi.createUser({ phone: userPhone });
                        setUser({
                            id: info.id,
                            nickName: info.nickname,
                            phone: info.phone || userPhone,
                            avatarUrl: info.avatar,
                            vipLevel: info.vipLevel || 0,
                        });
                        toast({
                            title: '已创建账户',
                            description: '正在跳转收货地址管理...',
                            variant: 'success',
                        });
                    } catch {
                        toast({
                            title: '操作失败',
                            description: '请稍后重试',
                            variant: 'destructive',
                        });
                        return;
                    }
                }
                toast({
                    title: '收货地址',
                    description: '正在开发中...',
                });
                break;
            case 'coupon':
                toast({
                    title: '优惠券',
                    // description: `您有 ${stats.coupons} 张可用优惠券`,
                    description: '正在开发中...',
                });
                break;
            case 'favorite':
                // 跳转收藏商品列表页面（数据取自 store 中的 user.collection）
                navigate('/favorites');
                break;
            case 'history':
                toast({
                    title: '浏览历史',
                    description: '正在开发中...',
                });
                break;
            case 'notification':
                toast({
                    title: '消息通知',
                    description: '正在开发中...',
                });
                break;
            case 'help':
                toast({
                    title: '帮助中心',
                    description: '正在开发中...',
                });
                break;
            case 'settings':
                toast({
                    title: '设置',
                    description: '正在开发中...',
                });
                break;
            case 'logout':
                // 退出登录：先弹二次确认弹窗，点「确定」后再执行退出逻辑
                Dialog.confirm({
                    title: '退出登录',
                    content: '确定要退出当前账号吗？',
                    confirmText: '确定',
                    cancelText: '取消',
                    onConfirm: async () => {
                        // 清理本地 mock-token + store 中的登录态 / 用户信息 / 收藏
                        await logoutUser();
                        setUser(null);
                        setStats({
                            coupons: 0,
                            points: 0,
                            favorites: 0,
                            views: 0,
                        });
                        toast({
                            title: '已退出登录',
                            variant: 'success',
                        });
                    },
                });
                break;
            default:
                break;
        }
    };

    // Show Login Form
    if (showLogin) {
        return (
            <div className="min-h-screen page-content-bg">
                <LoginForm
                    onLogin={handleLogin}
                    onRegister={() => {
                        setShowLogin(false);
                        setShowRegister(true);
                    }}
                    onForgotPassword={() =>
                        toast({
                            title: '忘记密码',
                            description: '请联系客服找回',
                        })
                    }
                    loading={loading}
                />
            </div>
        );
    }

    // Show Register Form
    if (showRegister) {
        return (
            <div className="min-h-screen page-content-bg">
                <div className="flex items-center justify-center h-14 bg-white border-b border-stone-100">
                    <span className="font-serif text-lg font-semibold text-stone-800">注册</span>
                </div>
                <RegisterForm
                    onRegister={handleRegister}
                    onLogin={() => {
                        setShowRegister(false);
                        setShowLogin(true);
                    }}
                    loading={loading}
                />
            </div>
        );
    }

    // 未登录状态
    if (!isLoggedIn) {
        return (
            <div className="min-h-screen page-content-bg pb-20">
                <div className="pt-16 pb-8 px-6 bg-gradient-to-b from-orange-50 to-[var(--page-content-bg)]">
                    <div className="text-center">
                        <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-stone-100 flex items-center justify-center">
                            <span className="text-5xl">👤</span>
                        </div>
                        <p className="text-stone-500 mb-6">登录后享受更多会员权益</p>
                        <div className="flex gap-3 justify-center">
                            <button
                                type="button"
                                onClick={() => setShowLogin(true)}
                                className="px-8 py-2.5 bg-orange-500 text-white font-semibold rounded-full"
                            >
                                登录
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowRegister(true)}
                                className="px-8 py-2.5 bg-transparent border border-orange-500 text-orange-500 font-semibold rounded-full"
                            >
                                注册
                            </button>
                        </div>
                    </div>
                </div>

                {/* Guest Menu */}
                <div className="px-4 mt-4">
                    <div className="bg-white rounded-2xl p-4">
                        <div className="grid grid-cols-4 gap-4">
                            {[
                                {
                                    id: 'coupon',
                                    icon: '🎫',
                                    label: '优惠券',
                                },
                                {
                                    id: 'favorite',
                                    icon: '❤️',
                                    label: '收藏',
                                },
                                {
                                    id: 'history',
                                    icon: '📜',
                                    label: '足迹',
                                },
                                {
                                    id: 'help',
                                    icon: '❓',
                                    label: '帮助',
                                },
                            ].map((item) => (
                                <button
                                    type="button"
                                    key={item.id}
                                    onClick={() => handleMenuClick(item.id)}
                                    className="flex flex-col items-center gap-1.5 py-3"
                                >
                                    <span className="text-2xl">{item.icon}</span>
                                    <span className="text-xs text-stone-600">{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 加载状态（已登录时用 store 中的用户兜底，不再整页 loading）
    if (loading && !displayUser) {
        return (
            <div className="min-h-screen page-content-bg flex items-center justify-center">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-stone-500">加载中...</p>
                </div>
            </div>
        );
    }
    return (
        <div className="min-h-screen page-content-bg pb-20">
            {/* Member Header（loading 只在未登录/首次拉取时展示，登录成功后为 false） */}
            <MemberHeader
                user={displayUser}
                onAvatarClick={handleAvatarClick}
                loading={memberCardLoading}
            />

            {/* Member Stats */}
            <MemberStats stats={{ ...stats, favorites: collection.length }} />

            {/* Member Menu */}
            <MemberMenu onItemClick={handleMenuClick} />

            {/* VIP Banner */}
            <div className="mx-4 mt-6 mb-4 p-4 bg-gradient-to-r from-amber-400 to-amber-500 rounded-2xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <span className="text-2xl">👑</span>
                        </div>
                        <div>
                            <p className="text-white font-semibold">
                                {(displayUser?.vipLevel ?? 0) > 0
                                    ? `VIP ${displayUser?.vipLevel ?? 0} 会员`
                                    : '升级钻石会员'}
                            </p>
                            <p className="text-white/80 text-xs">
                                {(displayUser?.vipLevel ?? 0) > 0
                                    ? '享受更多专属权益'
                                    : '享受更多专属权益'}
                            </p>
                        </div>
                    </div>
                    {(displayUser?.vipLevel ?? 0) < 5 && (
                        <button
                            type="button"
                            className="px-4 py-1.5 bg-white text-amber-600 text-sm font-semibold rounded-full"
                        >
                            立即升级
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
