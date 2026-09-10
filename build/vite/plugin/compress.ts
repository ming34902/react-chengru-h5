/**
 * Used to package and output gzip. Note that this does not work properly in Vite,
 * the specific reason is still being investigated
 * https://github.com/anncwb/vite-plugin-compression
 *
 * 开启gzip压缩需nginx配合修改 参考：
 * */
import type { Plugin } from 'vite';
import viteCompression from 'vite-plugin-compression';

export function configCompressPlugin(
    compress: 'gzip' | 'brotli' | 'none',
    deleteOriginFile = false,
): Plugin | Plugin[] {
    const compressList = compress.split(',');

    const plugins: Plugin[] = [];

    if (compressList.includes('gzip')) {
        plugins.push(
            viteCompression({
                verbose: true, // 打印压缩信息
                threshold: 1024 * 1000, // 超过1mb开始压缩
                algorithm: 'gzip', // 压缩算法，可选['gzip'，' brotliccompress '，'deflate '，'deflateRaw']
                ext: '.gz',
                deleteOriginFile, // 源文件压缩后是否删除
            }),
        );
    }

    if (compressList.includes('brotli')) {
        plugins.push(
            viteCompression({
                verbose: true, // 打印压缩信息
                threshold: 1024 * 1000, // 超过1mb开始压缩
                algorithm: 'brotliCompress', // 压缩算法，可选['gzip'，' brotliccompress '，'deflate '，'deflateRaw']
                ext: '.br',
                deleteOriginFile, // 源文件压缩后是否删除
            }),
        );
    }
    return plugins;
}
