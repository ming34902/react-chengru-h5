/* eslint-disable react-hooks/exhaustive-deps -- 低代码生成页面：副作用依赖数组按平台生成逻辑保留原样 */
import { useCallback, useEffect, useState } from 'react';

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

import { useWeda } from '@/hooks/useWeda';
import { selectCollection, selectIsLoggedIn, useUserStore } from '@/stores';

import { authApi } from '@/api';
import type { WedaPageProps } from '@/types/weda';
import { logoutUser } from '@/utils/auth';

export default function MemberPage(props: WedaPageProps) {
    const $w = useWeda(props.$w);
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

    // 获取当前用户手机号：低代码平台注入的 currentUser 优先，其次用 store 中的登录用户兜底
    const currentUser = props.$w?.auth?.currentUser;
    const userPhone =
        currentUser?.name ||
        currentUser?.phone ||
        currentUser?.userId ||
        storeUser?.phone ||
        storeUser?.username ||
        '';
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

    // 查询会员数据
    const fetchMemberData = useCallback(async () => {
        if (!userPhone) return;
        setLoading(true);
        try {
            const result = await $w.cloud.callDataSource({
                dataSourceName: 'shop_member',
                methodName: 'wedaGetRecordsV2',
                params: {
                    filter: {
                        where: {
                            $or: [
                                {
                                    phone: {
                                        $eq: userPhone,
                                    },
                                },
                                {
                                    nick_name: {
                                        $eq: userPhone,
                                    },
                                },
                            ],
                        },
                    },
                    select: {
                        $master: true,
                    },
                    pageSize: 1,
                    pageNumber: 1,
                },
            });
            if (result.records && result.records.length > 0) {
                const memberData = result.records[0];
                setUser({
                    id: memberData._id,
                    nickName: memberData.nick_name || '用户' + userPhone.slice(-4),
                    phone: memberData.phone || userPhone,
                    avatarUrl: memberData.avatar_url,
                    vipLevel: memberData.vip_level || 0,
                });
                setStats({
                    coupons: memberData.coupons || 0,
                    points: memberData.points || 0,
                    favorites: memberData.favorites || 0,
                    views: memberData.views || 0,
                });
            } else {
                // 用户不存在，设置为新用户
                setUser({
                    id: null,
                    nickName: '新用户' + userPhone.slice(-4),
                    phone: userPhone,
                    avatarUrl: null,
                    vipLevel: 0,
                });
                setStats({
                    coupons: 0,
                    points: 0,
                    favorites: 0,
                    views: 0,
                });
            }
        } catch (error) {
            console.error('查询会员数据失败:', error);
            toast({
                title: '加载失败',
                description: '获取会员信息失败，请稍后重试',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [userPhone, toast]);

    // 创建新会员
    const createMember = useCallback(async (phone: string, nickname?: string) => {
        try {
            const result = await $w.cloud.callDataSource({
                dataSourceName: 'shop_member',
                methodName: 'wedaCreateV2',
                params: {
                    data: {
                        nick_name: nickname || '用户' + phone.slice(-4),
                        phone: phone,
                        vip_level: 0,
                        points: 100,
                        // 新用户赠送100积分
                        coupons: 1,
                        // 新用户赠送1张优惠券
                        favorites: 0,
                        views: 0,
                        avatar_url: null,
                        addresses: [],
                    },
                },
            });
            setUser((prev) => ({
                ...prev,
                id: result.id,
                nickName: nickname || '用户' + phone.slice(-4),
            }));
            setStats((prev) => ({
                ...prev,
                coupons: 1,
                points: 100,
            }));
            return result.id;
        } catch (error) {
            console.error('创建会员失败:', error);
            throw error;
        }
    }, []);

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

            // 先查询是否存在该手机号的会员
            const result = await $w.cloud.callDataSource({
                dataSourceName: 'shop_member',
                methodName: 'wedaGetRecordsV2',
                params: {
                    filter: {
                        where: {
                            phone: {
                                $eq: phone,
                            },
                        },
                    },
                    select: {
                        $master: true,
                    },
                    pageSize: 1,
                },
            });
            if (result.records && result.records.length > 0) {
                // 已有会员，直接登录
                const memberData = result.records[0];
                setUser({
                    id: memberData._id,
                    nickName: memberData.nick_name || '用户' + phone.slice(-4),
                    phone: memberData.phone,
                    avatarUrl: memberData.avatar_url,
                    vipLevel: memberData.vip_level || 0,
                });
                setStats({
                    coupons: memberData.coupons || 0,
                    points: memberData.points || 0,
                    favorites: memberData.favorites || 0,
                    views: memberData.views || 0,
                });
            } else {
                // 新用户，创建会员
                await createMember(phone);
            }
            // 伪造登录接口：返回本地模拟的 mock-token + 用户信息（登录态写入 store 并持久化）
            const loginResult = await authApi.login({
                username: phone,
                password: formData.password,
            });
            loginToStore(loginResult);

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

            // 检查是否已存在
            const result = await $w.cloud.callDataSource({
                dataSourceName: 'shop_member',
                methodName: 'wedaGetRecordsV2',
                params: {
                    filter: {
                        where: {
                            phone: {
                                $eq: phone,
                            },
                        },
                    },
                    select: {
                        $master: true,
                    },
                    pageSize: 1,
                },
            });
            if (result.records && result.records.length > 0) {
                toast({
                    title: '该手机号已注册',
                    description: '请直接登录',
                    variant: 'destructive',
                });
                setShowRegister(false);
                setShowLogin(true);
                return;
            }

            // 创建新会员
            await createMember(phone, nickname);
            // 注册成功即登录：伪造接口返回 mock-token 并写入 store
            const loginResult = await authApi.login({
                username: phone,
                password: formData.password,
            });
            loginToStore(loginResult);

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
                // 如果是新用户，先创建会员
                if (!user?.id) {
                    try {
                        await createMember(userPhone);
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
                $w.utils.navigateTo({
                    pageId: 'favorites',
                    params: {},
                });
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
            <div className="min-h-screen bg-background">
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
            <div className="min-h-screen bg-background">
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
            <div className="min-h-screen bg-background pb-20">
                <div className="pt-16 pb-8 px-6 bg-gradient-to-b from-orange-50 to-background">
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
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-stone-500">加载中...</p>
                </div>
            </div>
        );
    }
    return (
        <div className="min-h-screen bg-background pb-20">
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
