import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

const ffmpeg = createFFmpeg({ log: true });

export async function transcodeToMP4(blob) {
    if (!ffmpeg.isLoaded()) {
        await ffmpeg.load(); // 加载 FFmpeg 核心文件
    }

    // 将 Blob 转换为 FFmpeg 可处理的文件
    const inputFileName = 'input.webm';
    const outputFileName = 'output.mp4';
    ffmpeg.FS('writeFile', inputFileName, await fetchFile(blob));

    // 转码为 MP4（H.264 + AAC 编码）
    await ffmpeg.run('-i', inputFileName, '-c:v', 'libx264', '-preset', 'fast', '-c:a', 'aac', '-movflags', 'faststart', outputFileName);

    // 获取输出文件
    const data = ffmpeg.FS('readFile', outputFileName);
    const mp4Blob = new Blob([data.buffer], { type: 'video/mp4' });

    // 清理 FFmpeg 文件系统
    ffmpeg.FS('unlink', inputFileName);
    ffmpeg.FS('unlink', outputFileName);

    return mp4Blob;
}