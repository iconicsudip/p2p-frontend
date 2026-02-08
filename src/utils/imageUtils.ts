/**
 * Compresses an image file to be under a target size using HTML Canvas.
 * @param file The original image file
 * @param maxSizeMB The maximum size in MB (default: 1)
 * @returns A Promise resolving to the compressed File
 */
export const compressImage = async (file: File, maxSizeMB: number = 1): Promise<File> => {
    // If file is already smaller than target, return original
    if (file.size <= maxSizeMB * 1024 * 1024) {
        return file;
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;

            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Calculate new dimensions (max dimension 1920px to save safer starting point, or keep original aspect ratio)
                // We'll try to just reduce quality first, but resizing is also good practice for huge images
                const MAX_DIMENSION = 1920;
                if (width > height && width > MAX_DIMENSION) {
                    height *= MAX_DIMENSION / width;
                    width = MAX_DIMENSION;
                } else if (height > MAX_DIMENSION) {
                    width *= MAX_DIMENSION / height;
                    height = MAX_DIMENSION;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                // Iterative compression to find the right quality
                let quality = 0.9;
                const compress = () => {
                    canvas.toBlob(
                        (blob) => {
                            if (!blob) {
                                reject(new Error('Compression failed'));
                                return;
                            }

                            if (blob.size <= maxSizeMB * 1024 * 1024 || quality <= 0.2) {
                                // Create a new File from the blob
                                const compressedFile = new File([blob], file.name, {
                                    type: 'image/jpeg', // Force JPEG for better compression
                                    lastModified: Date.now(),
                                });
                                resolve(compressedFile);
                            } else {
                                // Reduce quality and try again
                                quality -= 0.1;
                                compress();
                            }
                        },
                        'image/jpeg',
                        quality
                    );
                };

                compress();
            };

            img.onerror = (error) => reject(error);
        };

        reader.onerror = (error) => reject(error);
    });
};
