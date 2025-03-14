// Функция для отображения изображения на холсте
function drawImageOnCanvas(img) {
    const canvas = document.getElementById('imageCanvas');
    const ctx = canvas.getContext('2d');

    // Устанавливаем размеры холста равными размерам изображения
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    // Отображаем размеры изображения
    document.getElementById('imageSize').textContent = `${img.width} x ${img.height}`;

    // Добавляем обработчик события для движения мыши по холсту
    canvas.addEventListener('mousemove', function(event) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;

        // Получаем данные о цвете пикселя
        const pixel = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
        const color = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;

        // Отображаем цвет и координаты
        document.getElementById('colorDisplay').style.backgroundColor = color;
        document.getElementById('colorDisplay').textContent = color;
        document.getElementById('coordinates').textContent = `X: ${Math.floor(x)}, Y: ${Math.floor(y)}`;
    });
}

// Функция для масштабирования изображения с использованием алгоритма ближайшего соседа
function scaleImageWithNearestNeighbor(img, scale) {
    const canvas = document.getElementById('imageCanvas');
    const ctx = canvas.getContext('2d');

    // Вычисляем новые размеры
    const newWidth = Math.floor(img.width * scale);
    const newHeight = Math.floor(img.height * scale);

    // Создаем временный холст для исходного изображения
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = img.width;
    tempCanvas.height = img.height;
    tempCtx.drawImage(img, 0, 0);

    // Получаем данные пикселей исходного изображения
    const srcImageData = tempCtx.getImageData(0, 0, img.width, img.height);
    const srcData = srcImageData.data;

    // Создаем новый ImageData для масштабированного изображения
    const dstImageData = ctx.createImageData(newWidth, newHeight);
    const dstData = dstImageData.data;

    // Масштабируем изображение с использованием алгоритма ближайшего соседа
    for (let y = 0; y < newHeight; y++) {
        for (let x = 0; x < newWidth; x++) {
            // Вычисляем координаты в исходном изображении
            const srcX = Math.floor((x / newWidth) * img.width);
            const srcY = Math.floor((y / newHeight) * img.height);

            // Вычисляем индексы в массивах данных
            const srcIndex = (srcY * img.width + srcX) * 4;
            const dstIndex = (y * newWidth + x) * 4;

            // Копируем данные пикселя
            dstData[dstIndex] = srcData[srcIndex];         // R
            dstData[dstIndex + 1] = srcData[srcIndex + 1]; // G
            dstData[dstIndex + 2] = srcData[srcIndex + 2]; // B
            dstData[dstIndex + 3] = srcData[srcIndex + 3]; // A
        }
    }

    // Устанавливаем новые размеры холста
    canvas.width = newWidth;
    canvas.height = newHeight;

    // Рисуем масштабированное изображение
    ctx.putImageData(dstImageData, 0, 0);
}

// Загрузка изображения с компьютера
document.getElementById('imageInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                drawImageOnCanvas(img);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Загрузка изображения по URL
document.getElementById('loadImageUrl').addEventListener('click', function() {
    const imageUrl = document.getElementById('imageUrlInput').value;
    if (imageUrl) {
        const img = new Image();
        img.onload = function() {
            drawImageOnCanvas(img);
        };
        img.onerror = function() {
            alert('Не удалось загрузить изображение. Проверьте URL.');
        };
        img.src = imageUrl;
    } else {
        alert('Пожалуйста, введите URL изображения.');
    }
});

// Масштабирование изображения
document.getElementById('scale').addEventListener('input', function(event) {
    const scale = event.target.value / 100;
    const canvas = document.getElementById('imageCanvas');
    const img = new Image();
    img.src = canvas.toDataURL();
    img.onload = function() {
        scaleImageWithNearestNeighbor(img, scale);
    };
});

// Открытие модального окна
document.getElementById('openModal').addEventListener('click', function() {
    document.getElementById('modal').showModal();
});

// Закрытие модального окна
document.getElementById('cancel').addEventListener('click', function() {
    document.getElementById('modal').close();
});

// Изменение размера изображения
document.getElementById('modal').addEventListener('submit', function(event) {
    event.preventDefault();
    const width = parseInt(document.getElementById('width').value);
    const height = parseInt(document.getElementById('height').value);
    const keepAspect = document.getElementById('keepAspect').checked;
    const canvas = document.getElementById('imageCanvas');
    const ctx = canvas.getContext('2d');

    const img = new Image();
    img.src = canvas.toDataURL();
    img.onload = function() {
        if (keepAspect) {
            const aspectRatio = img.width / img.height;
            if (width / height > aspectRatio) {
                canvas.width = height * aspectRatio;
                canvas.height = height;
            } else {
                canvas.width = width;
                canvas.height = width / aspectRatio;
            }
        } else {
            canvas.width = width;
            canvas.height = height;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        document.getElementById('modal').close();
    };
});

// Сохранение изображения
document.getElementById('saveImage').addEventListener('click', function() {
    const canvas = document.getElementById('imageCanvas');
    const link = document.createElement('a');
    link.download = 'image.png';
    link.href = canvas.toDataURL();
    link.click();
});
