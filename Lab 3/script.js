// Переменные для управления состоянием
let isDragging = false; // Флаг для перемещения изображения
let startX, startY, offsetX = 0, offsetY = 0; // Координаты для перемещения
let activeTool = 'hand'; // Активный инструмент (по умолчанию "рука")
let img = null; // Переменная для хранения загруженного изображения

// Функция для отображения изображения на холсте
function drawImageOnCanvas(image) {
    const canvas = document.getElementById('imageCanvas');
    const ctx = canvas.getContext('2d');

    // Устанавливаем размеры холста равными размерам изображения
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);

    // Сохраняем изображение в переменную
    img = image;

    // Отображаем размеры изображения
    document.getElementById('imageSize').textContent = `${image.width} x ${image.height}`;
}

// Функция для масштабирования изображения с использованием алгоритма ближайшего соседа
function scaleImageWithNearestNeighbor(image, scale) {
    const canvas = document.getElementById('imageCanvas');
    const ctx = canvas.getContext('2d');

    // Вычисляем новые размеры
    const newWidth = Math.floor(image.width * scale);
    const newHeight = Math.floor(image.height * scale);

    // Создаем временный холст для исходного изображения
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = image.width;
    tempCanvas.height = image.height;
    tempCtx.drawImage(image, 0, 0);

    // Получаем данные пикселей исходного изображения
    const srcImageData = tempCtx.getImageData(0, 0, image.width, image.height);
    const srcData = srcImageData.data;

    // Создаем новый ImageData для масштабированного изображения
    const dstImageData = ctx.createImageData(newWidth, newHeight);
    const dstData = dstImageData.data;

    // Масштабируем изображение с использованием алгоритма ближайшего соседа
    for (let y = 0; y < newHeight; y++) {
        for (let x = 0; x < newWidth; x++) {
            // Вычисляем координаты в исходном изображении
            const srcX = Math.floor((x / newWidth) * image.width);
            const srcY = Math.floor((y / newHeight) * image.height);

            // Вычисляем индексы в массивах данных
            const srcIndex = (srcY * image.width + srcX) * 4;
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
            const image = new Image();
            image.onload = function() {
                drawImageOnCanvas(image);
            };
            image.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Загрузка изображения по URL
document.getElementById('loadImageUrl').addEventListener('click', function() {
    const imageUrl = document.getElementById('imageUrlInput').value;
    if (imageUrl) {
        const image = new Image();
        image.onload = function() {
            drawImageOnCanvas(image);
        };
        image.onerror = function() {
            alert('Не удалось загрузить изображение. Проверьте URL.');
        };
        image.src = imageUrl;
    } else {
        alert('Пожалуйста, введите URL изображения.');
    }
});

// Масштабирование изображения
document.getElementById('scale').addEventListener('input', function(event) {
    const scale = event.target.value / 100;
    const canvas = document.getElementById('imageCanvas');
    const image = new Image();
    image.src = canvas.toDataURL();
    image.onload = function() {
        scaleImageWithNearestNeighbor(image, scale);
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

    const image = new Image();
    image.src = canvas.toDataURL();
    image.onload = function() {
        if (keepAspect) {
            const aspectRatio = image.width / image.height;
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
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
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

// Инструмент "рука" и "пипетка"
document.getElementById('handTool').addEventListener('click', () => setActiveTool('hand'));
document.getElementById('eyedropperTool').addEventListener('click', () => setActiveTool('eyedropper'));

function setActiveTool(tool) {
    activeTool = tool;

    // Убираем активное состояние у всех кнопок
    document.querySelectorAll('.toolbar button').forEach(btn => btn.classList.remove('active'));

    // Добавляем активное состояние выбранной кнопке
    document.getElementById(`${tool}Tool`).classList.add('active');

    const canvas = document.getElementById('imageCanvas');
    if (tool === 'hand') {
        canvas.style.cursor = 'grab';
        canvas.addEventListener('mousedown', startDrag);
        canvas.addEventListener('mousemove', drag);
        canvas.addEventListener('mouseup', endDrag);
    } else if (tool === 'eyedropper') {
        canvas.style.cursor = 'crosshair';
        canvas.removeEventListener('mousedown', startDrag);
        canvas.removeEventListener('mousemove', drag);
        canvas.removeEventListener('mouseup', endDrag);

        // Обработчик для выбора цвета
        canvas.addEventListener('click', pickColor);
    }
}

// Функция для выбора цвета с помощью пипетки
function pickColor(event) {
    if (activeTool !== 'eyedropper') return;

    const canvas = document.getElementById('imageCanvas');
    const ctx = canvas.getContext('2d');

    // Получаем координаты клика относительно холста
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Получаем данные о цвете пикселя
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const color = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;

    // Отображаем цвет и координаты (включая Z, если это необходимо)
    document.getElementById('colorDisplay').style.backgroundColor = color;
    document.getElementById('colorDisplay').textContent = color;
    document.getElementById('coordinates').textContent = `X: ${x}, Y: ${y}, Z: ${pixel[3]}`; // Z - альфа-канал
}

// Функции для перемещения изображения
function startDrag(e) {
    if (activeTool === 'hand') {
        isDragging = true;
        startX = e.clientX - offsetX;
        startY = e.clientY - offsetY;
    }
}

function drag(e) {
    if (isDragging && activeTool === 'hand') {
        offsetX = e.clientX - startX;
        offsetY = e.clientY - startY;
        const canvas = document.getElementById('imageCanvas');
        canvas.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    }
}

function endDrag() {
    isDragging = false;
}
