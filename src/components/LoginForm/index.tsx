import { useState } from 'react';

import { Eye, EyeOff, Lock, Phone, User } from 'lucide-react';

/** 登录表单数据 */
export interface LoginFormData {
    phone: string;
    password: string;
}

/** 注册表单数据 */
export interface RegisterFormData {
    phone: string;
    nickname: string;
    password: string;
}

export interface LoginFormProps {
    /** 提交登录 */
    onLogin?: (formData: LoginFormData) => void;
    /** 切换到注册 */
    onRegister?: () => void;
    /** 忘记密码 */
    onForgotPassword?: () => void;
    /** 是否提交中 */
    loading?: boolean;
}

/** 登录表单 */
export function LoginForm({
    onLogin,
    onRegister,
    onForgotPassword,
    loading = false,
}: LoginFormProps) {
    const [phone, setPhone] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [showPassword, setShowPassword] = useState<boolean>(false);

    const canSubmit = phone.trim().length >= 6 && password.length > 0 && !loading;

    const handleSubmit = () => {
        if (!canSubmit) return;
        onLogin?.({ phone: phone.trim(), password });
    };

    return (
        <div className="mx-auto max-w-lg px-6 pt-10">
            <h1 className="font-serif text-2xl font-bold text-stone-800">欢迎回来</h1>
            <p className="mt-2 text-sm text-stone-400">登录后同步你的购物车与订单</p>

            <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm">
                    <Phone className="h-4 w-4 text-stone-400" />
                    <input
                        type="tel"
                        inputMode="numeric"
                        value={phone}
                        placeholder="请输入手机号"
                        onChange={(event) => setPhone(event.target.value)}
                        className="flex-1 bg-transparent text-sm text-stone-800 outline-none placeholder:text-stone-400"
                    />
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm">
                    <Lock className="h-4 w-4 text-stone-400" />
                    <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        placeholder="请输入密码"
                        onChange={(event) => setPassword(event.target.value)}
                        className="flex-1 bg-transparent text-sm text-stone-800 outline-none placeholder:text-stone-400"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="bg-transparent"
                    >
                        {showPassword ? (
                            <EyeOff className="h-4 w-4 text-stone-400" />
                        ) : (
                            <Eye className="h-4 w-4 text-stone-400" />
                        )}
                    </button>
                </div>
            </div>

            <button
                type="button"
                disabled={!canSubmit}
                onClick={handleSubmit}
                className={`mt-6 w-full rounded-full py-3.5 text-sm font-semibold text-white transition-colors ${
                    canSubmit ? 'bg-orange-500 hover:bg-orange-600' : 'bg-stone-300'
                }`}
            >
                {loading ? '登录中...' : '登录'}
            </button>

            <div className="mt-4 flex items-center justify-between text-xs text-stone-400">
                <button
                    type="button"
                    onClick={onForgotPassword}
                    className="bg-transparent hover:text-stone-600"
                >
                    忘记密码
                </button>
                <button
                    type="button"
                    onClick={onRegister}
                    className="bg-transparent hover:text-stone-600"
                >
                    还没有账号？去注册
                </button>
            </div>
        </div>
    );
}

export interface RegisterFormProps {
    /** 提交注册 */
    onRegister?: (formData: RegisterFormData) => void;
    /** 切换到登录 */
    onLogin?: () => void;
    /** 是否提交中 */
    loading?: boolean;
}

/** 注册表单 */
export function RegisterForm({ onRegister, onLogin, loading = false }: RegisterFormProps) {
    const [phone, setPhone] = useState<string>('');
    const [nickname, setNickname] = useState<string>('');
    const [password, setPassword] = useState<string>('');

    const canSubmit = phone.trim().length >= 6 && password.length > 0 && !loading;

    const handleSubmit = () => {
        if (!canSubmit) return;
        onRegister?.({ phone: phone.trim(), nickname: nickname.trim(), password });
    };

    return (
        <div className="mx-auto max-w-lg px-6 pt-10">
            <h1 className="font-serif text-2xl font-bold text-stone-800">注册新账号</h1>
            <p className="mt-2 text-sm text-stone-400">注册即送 100 积分和 1 张优惠券</p>

            <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm">
                    <Phone className="h-4 w-4 text-stone-400" />
                    <input
                        type="tel"
                        inputMode="numeric"
                        value={phone}
                        placeholder="请输入手机号"
                        onChange={(event) => setPhone(event.target.value)}
                        className="flex-1 bg-transparent text-sm text-stone-800 outline-none placeholder:text-stone-400"
                    />
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm">
                    <User className="h-4 w-4 text-stone-400" />
                    <input
                        type="text"
                        value={nickname}
                        placeholder="请输入昵称（可选）"
                        onChange={(event) => setNickname(event.target.value)}
                        className="flex-1 bg-transparent text-sm text-stone-800 outline-none placeholder:text-stone-400"
                    />
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm">
                    <Lock className="h-4 w-4 text-stone-400" />
                    <input
                        type="password"
                        value={password}
                        placeholder="请设置密码"
                        onChange={(event) => setPassword(event.target.value)}
                        className="flex-1 bg-transparent text-sm text-stone-800 outline-none placeholder:text-stone-400"
                    />
                </div>
            </div>

            <button
                type="button"
                disabled={!canSubmit}
                onClick={handleSubmit}
                className={`mt-6 w-full rounded-full py-3.5 text-sm font-semibold text-white transition-colors ${
                    canSubmit ? 'bg-orange-500 hover:bg-orange-600' : 'bg-stone-300'
                }`}
            >
                {loading ? '注册中...' : '注册'}
            </button>

            <div className="mt-4 text-center text-xs text-stone-400">
                <button type="button" onClick={onLogin} className="hover:text-stone-600">
                    已有账号？去登录
                </button>
            </div>
        </div>
    );
}

export default RegisterForm;
