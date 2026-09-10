import * as React from 'react';

import { X } from 'lucide-react';

/** Toast 变体 */
export type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'destructive';

/** toast() 的参数 */
export interface ToastOptions {
    /** 标题 */
    title?: string;
    /** 描述 */
    description?: string;
    /** 变体，默认 default */
    variant?: ToastVariant;
    /** 展示时长（毫秒），默认 3000 */
    duration?: number;
}

/** 内部维护的 toast 数据 */
interface ToastItem extends ToastOptions {
    id: number;
}

/** useToast 的返回值 */
export interface ToastContextValue {
    toast: (options: ToastOptions) => void;
}

/** 容器样式 */
const containerClassMap: Record<ToastVariant, string> = {
    success: 'bg-green-50/95 border border-green-200',
    error: 'bg-red-50/95 border border-red-200',
    warning: 'bg-amber-50/95 border border-amber-200',
    destructive: 'bg-red-50/95 border border-red-200',
    default: 'bg-white/95 border border-stone-200',
};

/** 标题样式 */
const titleClassMap: Record<ToastVariant, string> = {
    success: 'text-green-800',
    error: 'text-red-800',
    warning: 'text-amber-800',
    destructive: 'text-red-800',
    default: 'text-stone-800',
};

/** 描述样式 */
const descriptionClassMap: Record<ToastVariant, string> = {
    success: 'text-green-600',
    error: 'text-red-600',
    warning: 'text-amber-600',
    destructive: 'text-red-600',
    default: 'text-stone-500',
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

export interface ToastProviderProps {
    children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
    const [toasts, setToasts] = React.useState<ToastItem[]>([]);

    const addToast = React.useCallback(
        ({ title, description, variant = 'default', duration = 3000 }: ToastOptions) => {
            const id = Date.now();
            setToasts((prev) => [...prev, { id, title, description, variant }]);
            setTimeout(() => {
                setToasts((prev) => prev.filter((toastItem) => toastItem.id !== id));
            }, duration);
        },
        [],
    );

    const removeToast = React.useCallback((id: number) => {
        setToasts((prev) => prev.filter((toastItem) => toastItem.id !== id));
    }, []);

    const contextValue = React.useMemo<ToastContextValue>(() => ({ toast: addToast }), [addToast]);

    return (
        <ToastContext.Provider value={contextValue}>
            {children}
            <div className="fixed top-4 right-4 z-[100] space-y-2 max-w-sm">
                {toasts.map((toastItem) => {
                    const variant = toastItem.variant ?? 'default';

                    return (
                        <div
                            key={toastItem.id}
                            className={`p-4 rounded-xl shadow-lg backdrop-blur-md flex items-start gap-3 animate-in slide-in-from-right ${containerClassMap[variant]}`}
                        >
                            <div className="flex-1">
                                {toastItem.title && (
                                    <p className={`text-sm font-medium ${titleClassMap[variant]}`}>
                                        {toastItem.title}
                                    </p>
                                )}
                                {toastItem.description && (
                                    <p className={`text-xs mt-1 ${descriptionClassMap[variant]}`}>
                                        {toastItem.description}
                                    </p>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => removeToast(toastItem.id)}
                                className="text-stone-400 hover:text-stone-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast(): ToastContextValue {
    const context = React.useContext(ToastContext);
    if (!context) {
        return {
            toast: () => {},
        };
    }
    return context;
}

export default ToastProvider;
