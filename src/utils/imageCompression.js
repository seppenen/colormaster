/**
 * Сжимает изображение на стороне клиента с использованием Canvas.
 * @param {File} file - Исходный файл изображения.
 * @param {Object} options - Настройки сжатия.
 * @param {number} options.maxWidth - Максимальная ширина.
 * @param {number} options.maxHeight - Максимальная высота.
 * @param {number} options.quality - Качество (0.1 - 1.0).
 * @returns {Promise<Blob>} - Сжатое изображение в виде Blob.
 */
export const compressImage = (file, options = { maxWidth: 1200, maxHeight: 1200, quality: 0.7 }) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Расчет новых размеров с сохранением пропорций
        if (width > height) {
          if (width > options.maxWidth) {
            height *= options.maxWidth / width;
            width = options.maxWidth;
          }
        } else {
          if (height > options.maxHeight) {
            width *= options.maxHeight / height;
            height = options.maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Возвращаем новый файл с тем же именем, но сжатый
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Canvas toBlob failed'));
            }
          },
          'image/jpeg',
          options.quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};
