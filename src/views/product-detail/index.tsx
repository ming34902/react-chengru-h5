/* eslint-disable @eslint-react/no-array-index-key -- 低代码生成组件：列表 key 按平台实现保留 */
import { useState } from 'react';

import { Heart, Minus, Plus, Share2, Star } from 'lucide-react';

import { Header } from '@/components/Header';
import { useToast } from '@/components/Toast';

import { useWeda } from '@/hooks/useWeda';
import { selectIsLoggedIn, useUserStore } from '@/stores';

import type { WedaPageProps } from '@/types/weda';

const productDetail = {
    id: 1,
    name: '2024新款韩版宽松休闲运动套装 时尚百搭',
    price: 199.0,
    originalPrice: 399.0,
    description:
        '采用优质面料，舒适透气，款式简约大方，适合各种场合穿着。宽松版型设计，不挑身材，遮肉显瘦。',
    images: [
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=600&fit=crop',
        'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600&h=600&fit=crop',
        'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&h=600&fit=crop',
        'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&h=600&fit=crop',
    ],
    specs: [
        {
            name: '颜色',
            options: ['黑色', '白色', '灰色', '粉色'],
        },
        {
            name: '尺码',
            options: ['S', 'M', 'L', 'XL', 'XXL'],
        },
    ],
    rating: 4.8,
    reviews: 1280,
    sales: 2560,
    stock: 99,
};
const reviews = [
    {
        id: 1,
        user: '林**',
        avatar: null,
        rating: 5,
        content: '质量非常好，尺码标准，面料舒适透气，物流很快，会回购的！',
        images: [
            'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=100&h=100&fit=crop',
        ],
        date: '2024-08-20',
        spec: '黑色 L码',
    },
    {
        id: 2,
        user: '小**',
        avatar: null,
        rating: 5,
        content: '衣服很百搭，穿起来很舒服，卖家服务态度也很好，推荐购买！',
        images: [],
        date: '2024-08-18',
        spec: '白色 M码',
    },
];

export default function ProductDetailPage(props: WedaPageProps) {
    const $w = useWeda(props.$w);
    const [currentImage, setCurrentImage] = useState(0);
    const [selectedSpecs, setSelectedSpecs] = useState<Record<string, string>>({
        颜色: '黑色',
        尺码: 'M',
    });
    const [quantity, setQuantity] = useState(1);
    // 收藏状态统一从 store 读取（user.collection），刷新页面后依然保持
    const isLoggedIn = useUserStore(selectIsLoggedIn);
    const isCollected = useUserStore((state) =>
        (state.user?.collection ?? []).some((item) => String(item.id) === String(productDetail.id)),
    );
    const toggleCollection = useUserStore((state) => state.toggleCollection);
    const { toast } = useToast();
    const handleSpecChange = (specName: string, value: string) => {
        setSelectedSpecs((prev) => ({
            ...prev,
            [specName]: value,
        }));
    };
    const handleAddToCart = () => {
        toast({
            title: '已加入购物车',
            description: `${productDetail.name} x ${quantity}`,
            variant: 'success',
        });
    };
    const handleBuyNow = () => {
        $w.utils.navigateTo({
            pageId: 'checkout',
            params: {
                items: JSON.stringify([
                    {
                        id: productDetail.id,
                        name: productDetail.name,
                        price: productDetail.price,
                        image: productDetail.images[0],
                        quantity,
                        spec: Object.values(selectedSpecs).join(' '),
                    },
                ]),
            },
        });
    };
    const handleCollect = () => {
        if (!isLoggedIn) {
            toast({
                title: '请先登录',
                description: '登录后即可收藏商品',
                variant: 'destructive',
            });
            return;
        }
        // 收藏 / 取消收藏：写入 store 中的 user.collection（收藏商品数组）
        toggleCollection({
            id: productDetail.id,
            name: productDetail.name,
            price: productDetail.price,
            originalPrice: productDetail.originalPrice,
            image: productDetail.images[0],
            images: productDetail.images,
            description: productDetail.description,
            rating: productDetail.rating,
            sales: productDetail.sales,
            stock: productDetail.stock,
        });
        toast({
            title: isCollected ? '已取消收藏' : '收藏成功',
            variant: 'success',
        });
    };
    const handleShare = () => {
        toast({
            title: '分享',
            description: '链接已复制到剪贴板',
        });
    };
    return (
        <div className="min-h-screen bg-background pb-24">
            <Header title="商品详情" showBack onBack={() => $w.utils.navigateBack()} />

            {/* Image Gallery */}
            <div className="relative">
                <div className="aspect-square bg-stone-100">
                    <img
                        src={productDetail.images[currentImage]}
                        alt={productDetail.name}
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Image Dots */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {productDetail.images.map((_, index) => (
                        <button
                            type="button"
                            key={index}
                            onClick={() => setCurrentImage(index)}
                            className={`w-2 h-2 rounded-full transition-all ${index === currentImage ? 'bg-primary-500 w-4' : 'bg-white/70'}`}
                        />
                    ))}
                </div>

                {/* Action Buttons */}
                <div className="absolute top-4 right-4 flex gap-2">
                    <button
                        type="button"
                        onClick={handleCollect}
                        className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-colors ${isCollected ? 'bg-secondary-500 text-white' : 'bg-white/90 text-stone-500'}`}
                    >
                        <Heart className={`w-5 h-5 ${isCollected ? 'fill-white' : ''}`} />
                    </button>
                    <button
                        type="button"
                        onClick={handleShare}
                        className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-md text-stone-500"
                    >
                        <Share2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Product Info */}
            <div className="bg-white rounded-t-3xl -mt-6 relative z-10">
                <div className="p-5">
                    {/* Price */}
                    <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-3xl font-bold text-primary-600">
                            ¥{productDetail.price}
                        </span>
                        {productDetail.originalPrice && (
                            <span className="text-lg text-stone-400 line-through">
                                ¥{productDetail.originalPrice}
                            </span>
                        )}
                    </div>

                    {/* Title */}
                    <h1 className="font-serif text-lg font-semibold text-stone-800 leading-snug mb-3">
                        {productDetail.name}
                    </h1>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-stone-400">
                        <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                            <span>{productDetail.rating}</span>
                        </div>
                        <span>{productDetail.reviews} 条评价</span>
                        <span>{productDetail.sales} 人已买</span>
                    </div>

                    {/* Description */}
                    <p className="mt-4 text-sm text-stone-500 leading-relaxed">
                        {productDetail.description}
                    </p>
                </div>

                {/* Specs */}
                <div className="border-t border-stone-100">
                    {productDetail.specs.map((spec) => (
                        <div key={spec.name} className="px-5 py-4">
                            <h3 className="text-sm font-medium text-stone-600 mb-3">
                                选择 {spec.name}
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {spec.options.map((option) => {
                                    const isSelected = selectedSpecs[spec.name] === option;
                                    return (
                                        <button
                                            type="button"
                                            key={option}
                                            onClick={() => handleSpecChange(spec.name, option)}
                                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${isSelected ? 'bg-primary-500 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
                                        >
                                            {option}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Reviews Preview */}
                <div className="border-t border-stone-100">
                    <div className="flex items-center justify-between px-5 py-4">
                        <h3 className="font-medium text-stone-800">商品评价</h3>
                        <button type="button" className="text-sm bg-transparent text-stone-400">
                            查看全部 →
                        </button>
                    </div>
                    <div className="px-5 pb-4 space-y-4">
                        {reviews.map((review) => (
                            <div key={review.id} className="bg-stone-50 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-sm">
                                        {review.user[0]}
                                    </div>
                                    <span className="text-sm font-medium text-stone-700">
                                        {review.user}
                                    </span>
                                    <div className="flex gap-0.5 ml-auto">
                                        {[...Array(review.rating)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className="w-3 h-3 text-amber-400 fill-amber-400"
                                            />
                                        ))}
                                    </div>
                                </div>
                                <p className="text-sm text-stone-600 leading-relaxed">
                                    {review.content}
                                </p>
                                <div className="flex items-center gap-2 mt-2 text-xs text-stone-400">
                                    <span>{review.spec}</span>
                                    <span>·</span>
                                    <span>{review.date}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 safe-bottom z-50">
                <div className="flex items-center h-16 max-w-lg mx-auto px-4 gap-3">
                    {/* Quantity */}
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center"
                        >
                            <Minus className="w-4 h-4 text-stone-600" />
                        </button>
                        <span className="w-8 text-center font-medium">{quantity}</span>
                        <button
                            type="button"
                            onClick={() => setQuantity(Math.min(productDetail.stock, quantity + 1))}
                            className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center"
                        >
                            <Plus className="w-4 h-4 text-stone-600" />
                        </button>
                    </div>

                    {/* Add to Cart */}
                    <button
                        type="button"
                        onClick={handleAddToCart}
                        className="flex-1 py-3 border-2 border-primary-500 text-primary-500 font-semibold rounded-full hover:bg-primary-50 transition-colors"
                    >
                        加入购物车
                    </button>

                    {/* Buy Now */}
                    <button
                        type="button"
                        onClick={handleBuyNow}
                        className="flex-1 py-3 bg-primary-500 text-white font-semibold rounded-full hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/30"
                    >
                        立即购买
                    </button>
                </div>
            </div>
        </div>
    );
}
