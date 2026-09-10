import { useEffect, useState } from 'react';

import { ChevronLeft, ChevronRight } from 'lucide-react';

/** 轮播项 */
export interface BannerItem {
    /** 唯一标识（图片重复时建议传入） */
    id?: string | number;
    /** 图片地址 */
    image: string;
    /** 主标题 */
    title?: string;
    /** 副标题 */
    subtitle?: string;
}

export interface BannerProps {
    /** 轮播数据 */
    banners?: BannerItem[];
}

/** 自动轮播间隔（毫秒） */
const AUTO_PLAY_INTERVAL = 4000;
/** 手动操作后暂停自动轮播的时长（毫秒） */
const AUTO_PLAY_RESUME_DELAY = 10000;
/** 默认空数组，避免直接用数组字面量作为默认值触发不必要的重复渲染 */
const EMPTY_BANNERS: BannerItem[] = [];

export function Banner({ banners = EMPTY_BANNERS }: BannerProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    useEffect(() => {
        if (!isAutoPlaying || banners.length <= 1) return;

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % banners.length);
        }, AUTO_PLAY_INTERVAL);

        return () => clearInterval(timer);
    }, [isAutoPlaying, banners.length]);

    /** 手动操作后暂停一会，再恢复自动轮播 */
    const pauseTemporarily = () => {
        setIsAutoPlaying(false);
        setTimeout(() => setIsAutoPlaying(true), AUTO_PLAY_RESUME_DELAY);
    };

    const goToSlide = (index: number) => {
        setCurrentIndex(index);
        pauseTemporarily();
    };

    const goToPrev = () => {
        setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
        pauseTemporarily();
    };

    const goToNext = () => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
        pauseTemporarily();
    };

    if (banners.length === 0) {
        return (
            <div className="relative w-full aspect-[16/9] bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-primary-600 font-serif text-lg">精选推荐</span>
                </div>
            </div>
        );
    }

    return (
        <div
            className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden group"
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
        >
            <div
                className="flex transition-transform duration-500 ease-out h-full"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
                {banners.map((banner, index) => (
                    <div
                        key={banner.id ?? banner.image}
                        className="flex-shrink-0 w-full h-full relative"
                    >
                        <img
                            src={banner.image}
                            alt={banner.title ?? `Banner ${index + 1}`}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-5">
                            <h3 className="font-serif text-white text-xl font-semibold drop-shadow-lg">
                                {banner.title}
                            </h3>
                            {banner.subtitle && (
                                <p className="text-white/80 text-sm mt-1 drop-shadow">
                                    {banner.subtitle}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* 左右切换 */}
            {banners.length > 1 && (
                <>
                    <button
                        type="button"
                        onClick={goToPrev}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-white"
                    >
                        <ChevronLeft className="w-4 h-4 text-stone-700" />
                    </button>
                    <button
                        type="button"
                        onClick={goToNext}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-white"
                    >
                        <ChevronRight className="w-4 h-4 text-stone-700" />
                    </button>
                </>
            )}

            {/* 指示点 */}
            {banners.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {banners.map((banner, index) => (
                        <button
                            type="button"
                            key={banner.id ?? banner.image}
                            onClick={() => goToSlide(index)}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                index === currentIndex
                                    ? 'bg-white w-6'
                                    : 'bg-white/50 hover:bg-white/70'
                            }`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default Banner;
