declare type Recordable<T = any> = Record<string, T>;

declare type ReadonlyRecordable<T = any> = {
    readonly [key: string]: T;
};

declare const __APP_INFO__: {
    pkg: {
        name: string;
        version: string;
        dependencies: Recordable<string>;
        devDependencies: Recordable<string>;
    };
    lastBuildTime: string;
};

declare interface Window {
    webkit: any;
    NativeCallJs: any;
    VConsole: any;
    /** 原生/微信容器注入的 JSBridge（示例：@/components/CartItem 中使用） */
    __wx__?: {
        utils: {
            navigateTo: (options: { pageId: string }) => void;
        };
    };
}
