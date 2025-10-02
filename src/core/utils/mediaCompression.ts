/**
 * Media compression utilities for optimizing file storage
 */

export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1
  format?: 'jpeg' | 'webp' | 'png';
}

export interface AudioCompressionOptions {
  bitRate?: number;
  sampleRate?: number;
  channels?: number;
}

/**
 * Compress an image file using canvas
 */
export const compressImage = async (
  file: File,
  options: ImageCompressionOptions = {}
): Promise<{ blob: Blob; originalSize: number; compressedSize: number; compressionRatio: number }> => {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    format = 'jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > maxWidth || height > maxHeight) {
        const aspectRatio = width / height;
        
        if (width > height) {
          width = Math.min(width, maxWidth);
          height = width / aspectRatio;
        } else {
          height = Math.min(height, maxHeight);
          width = height * aspectRatio;
        }
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }

          const originalSize = file.size;
          const compressedSize = blob.size;
          const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;

          resolve({
            blob,
            originalSize,
            compressedSize,
            compressionRatio
          });
        },
        `image/${format}`,
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Compress audio using Web Audio API (basic implementation)
 * Note: This is a simplified version. For production, consider using libraries like lamejs
 */
export const compressAudio = async (
  audioBlob: Blob,
  options: AudioCompressionOptions = {}
): Promise<{ blob: Blob; originalSize: number; compressedSize: number; compressionRatio: number }> => {
  const {
    sampleRate = 22050, // Reduce from typical 44100
    channels = 1 // Mono instead of stereo
  } = options;

  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Create a new buffer with reduced sample rate and channels
    const length = Math.floor(audioBuffer.length * (sampleRate / audioBuffer.sampleRate));
    const compressedBuffer = audioContext.createBuffer(channels, length, sampleRate);

    // Downsample and convert to mono if needed
    for (let channel = 0; channel < channels; channel++) {
      const inputData = audioBuffer.getChannelData(Math.min(channel, audioBuffer.numberOfChannels - 1));
      const outputData = compressedBuffer.getChannelData(channel);
      
      const ratio = inputData.length / outputData.length;
      
      for (let i = 0; i < outputData.length; i++) {
        const sourceIndex = Math.floor(i * ratio);
        outputData[i] = inputData[sourceIndex];
      }
    }

    // Convert back to blob (simplified - in production, use proper encoding)
    const compressedArrayBuffer = audioBufferToWav(compressedBuffer);
    const compressedBlob = new Blob([compressedArrayBuffer], { type: 'audio/wav' });

    const originalSize = audioBlob.size;
    const compressedSize = compressedBlob.size;
    const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;

    await audioContext.close();

    return {
      blob: compressedBlob,
      originalSize,
      compressedSize,
      compressionRatio
    };
  } catch (error) {
    console.warn('Audio compression failed, returning original:', error);
    // Fallback: return original blob
    return {
      blob: audioBlob,
      originalSize: audioBlob.size,
      compressedSize: audioBlob.size,
      compressionRatio: 0
    };
  }
};

/**
 * Convert AudioBuffer to WAV format
 * Simplified implementation for demo purposes
 */
function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const length = buffer.length * buffer.numberOfChannels * 2;
  const arrayBuffer = new ArrayBuffer(44 + length);
  const view = new DataView(arrayBuffer);
  
  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, buffer.numberOfChannels, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * buffer.numberOfChannels * 2, true);
  view.setUint16(32, buffer.numberOfChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length, true);

  // Convert float samples to 16-bit PCM
  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
      view.setInt16(offset, sample * 0x7FFF, true);
      offset += 2;
    }
  }

  return arrayBuffer;
}

/**
 * Get optimal compression settings based on file size and type
 */
export const getOptimalCompressionSettings = (
  file: File,
  targetSizeKB?: number
): ImageCompressionOptions | AudioCompressionOptions => {
  const fileSizeKB = file.size / 1024;
  
  if (file.type.startsWith('image/')) {
    const settings: ImageCompressionOptions = {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 0.8,
      format: 'jpeg'
    };

    // Adjust based on file size
    if (fileSizeKB > 5000) { // > 5MB
      settings.maxWidth = 1280;
      settings.maxHeight = 720;
      settings.quality = 0.7;
    } else if (fileSizeKB > 2000) { // > 2MB
      settings.quality = 0.75;
    }

    // Adjust for target size
    if (targetSizeKB && fileSizeKB > targetSizeKB * 2) {
      settings.quality = Math.max(0.5, settings.quality! - 0.2);
      settings.maxWidth = Math.min(settings.maxWidth!, 1280);
    }

    return settings;
  } else if (file.type.startsWith('audio/')) {
    const settings: AudioCompressionOptions = {
      sampleRate: 22050,
      channels: 1
    };

    // Adjust based on file size
    if (fileSizeKB > 10000) { // > 10MB
      settings.sampleRate = 16000;
    } else if (fileSizeKB < 1000) { // < 1MB
      settings.sampleRate = 44100;
      settings.channels = 2;
    }

    return settings;
  }

  return {};
};

/**
 * Estimate compression savings
 */
export const estimateCompressionSavings = (
  file: File,
  options: ImageCompressionOptions | AudioCompressionOptions
): { estimatedSizeKB: number; estimatedSavingsPercent: number } => {
  const originalSizeKB = file.size / 1024;
  let estimatedSavingsPercent = 0;

  if (file.type.startsWith('image/')) {
    const imgOptions = options as ImageCompressionOptions;
    const quality = imgOptions.quality || 0.8;
    
    // Rough estimation based on quality and dimensions
    estimatedSavingsPercent = (1 - quality) * 60 + 20; // 20-80% savings
    
    if (imgOptions.maxWidth && imgOptions.maxWidth < 1920) {
      estimatedSavingsPercent += 15;
    }
  } else if (file.type.startsWith('audio/')) {
    const audioOptions = options as AudioCompressionOptions;
    
    // Rough estimation based on sample rate and channels
    if (audioOptions.sampleRate && audioOptions.sampleRate < 44100) {
      estimatedSavingsPercent += 30;
    }
    if (audioOptions.channels === 1) {
      estimatedSavingsPercent += 25;
    }
  }

  estimatedSavingsPercent = Math.min(85, Math.max(10, estimatedSavingsPercent));
  const estimatedSizeKB = originalSizeKB * (1 - estimatedSavingsPercent / 100);

  return {
    estimatedSizeKB,
    estimatedSavingsPercent
  };
};