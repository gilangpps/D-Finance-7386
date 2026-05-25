/**
 * IMAGE UTILS
 * Compress and resize images before upload
 */

class ImageUtils {
    /**
     * Compress image file via canvas
     * @param {File} file - image file
     * @param {number} maxWidth - max width px
     * @param {number} maxHeight - max height px
     * @param {number} quality - compression 0-1, default 0.7
     * @returns {Promise<Blob>} compressed image blob
     */
    static async compressImage(file, maxWidth = 1200, maxHeight = 1200, quality = 0.7) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const img = new Image();
                
                img.onload = () => {
                    // Calculate new size maintaining aspect ratio
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > height) {
                        if (width > maxWidth) {
                            height = Math.round((height * maxWidth) / width);
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width = Math.round((width * maxHeight) / height);
                            height = maxHeight;
                        }
                    }
                    
                    // Create canvas and compress
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Convert to blob with compression
                    canvas.toBlob(
                        (blob) => resolve(blob),
                        'image/jpeg',
                        quality
                    );
                };
                
                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = e.target.result;
            };
            
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    /**
     * Convert blob to base64
     * @param {Blob} blob
     * @returns {Promise<string>} base64 string with data:image/jpeg;base64, prefix
     */
    static async blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    /**
     * Compress and convert to base64
     * @param {File} file - image file
     * @param {number} maxWidth
     * @param {number} maxHeight
     * @param {number} quality
     * @returns {Promise<string>} base64 data URL
     */
    static async compressToBase64(file, maxWidth = 1200, maxHeight = 1200, quality = 0.7) {
        try {
            const compressedBlob = await this.compressImage(file, maxWidth, maxHeight, quality);
            const base64 = await this.blobToBase64(compressedBlob);
            console.log(`✓ Image compressed: ${file.size} → ${compressedBlob.size} bytes`);
            return base64;
        } catch (error) {
            console.error('Image compression failed:', error);
            throw error;
        }
    }

    /**
     * Get image file info
     */
    static getImageInfo(file) {
        return {
            name: file.name,
            size: file.size,
            type: file.type,
            sizeKB: (file.size / 1024).toFixed(2)
        };
    }
}

window.ImageUtils = ImageUtils;
