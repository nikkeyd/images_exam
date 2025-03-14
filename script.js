// Переменные для управления состоянием
let isDragging = false; // Флаг для перемещения изображения
let startX, startY, offsetX = 0, offsetY = 0; // Координаты для перемещения
let activeTool = 'hand'; // Активный инструмент (по умолчанию "рука")
let img = null; // Переменная для хранения загруженного изображения
let originalImageData = null; // Для хранения оригинальных данных изображения

// Преднастроенные ядра
const kernels = {
    identity: [
        [0, 0, 0],
        [0, 1, 0],
        [0, 0, 0]
    ],
    sharpen: [
        [0, -1, 0],
        [-1, 5, -1],
        [0, -1, 0]
    ],
    gaussian: [
        [1, 2, 1],
        [2, 4, 2],
        [1, 2, 1]
    ],
    boxBlur: [
        [1, 1, 1],
        [1, 1, 1],
        [1, 1, 1]
    ]
};

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

    // Сохраняем оригинальные данные изображения для восстановления
    originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

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

// Функция для построения гистограмм
function drawHistograms() {
    const canvas = document.getElementById('imageCanvas');
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Создаем массивы для хранения гистограмм каждого канала
    const histograms = {
        r: new Array(256).fill(0),
        g: new Array(256).fill(0),
        b: new Array(256).fill(0)
    };

    // Заполняем гистограммы
    for (let i = 0; i < data.length; i += 4) {
        histograms.r[data[i]]++;
        histograms.g[data[i + 1]]++;
        histograms.b[data[i + 2]]++;
    }

    const svg = document.getElementById('histogram');
    svg.innerHTML = ''; // Очищаем предыдущие гистограммы

    // Находим максимальное значение для нормализации гистограмм
    const max = Math.max(...histograms.r, ...histograms.g, ...histograms.b);

    // Рисуем гистограммы для каждого канала
    ['r', 'g', 'b'].forEach((channel, index) => {
        const color = channel === 'r' ? 'red' : channel === 'g' ? 'green' : 'blue';
        histograms[channel].forEach((value, x) => {
            const height = (value / max) * 300; // Нормализуем высоту
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', x);
            rect.setAttribute('y', 300 - height);
            rect.setAttribute('width', 1);
            rect.setAttribute('height', height);
            rect.setAttribute('fill', color);
            svg.appendChild(rect);
        });
    });
}

// Функция для применения коррекции "Кривые"
function applyCurvesCorrection(input1, output1, input2, output2) {
    const canvas = document.getElementById('imageCanvas');
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Создаем lookup table (LUT) для коррекции
    const lut = new Array(256);
    for (let i = 0; i < 256; i++) {
        if (i <= input1) {
            lut[i] = (output1 / input1) * i; // Линейная интерполяция до первой точки
        } else if (i <= input2) {
            lut[i] = output1 + ((output2 - output1) / (input2 - input1)) * (i - input1); // Линейная интерполяция между точками
        } else {
            lut[i] = output2 + ((255 - output2) / (255 - input2)) * (i - input2); // Линейная интерполяция после второй точки
        }
        lut[i] = Math.round(lut[i]); // Округляем значения
    }

    // Применяем LUT к изображению
    for (let i = 0; i < data.length; i += 4) {
        data[i] = lut[data[i]];         // R
        data[i + 1] = lut[data[i + 1]]; // G
        data[i + 2] = lut[data[i + 2]]; // B
    }

    // Обновляем изображение на холсте
    ctx.putImageData(imageData, 0, 0);
}

// Функция для применения ядра свертки
function applyKernel(kernel) {
    const canvas = document.getElementById('imageCanvas');
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Создаем временный холст для обработки краев
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = canvas.width + 2;
    tempCanvas.height = canvas.height + 2;
    tempCtx.drawImage(canvas, 1, 1);

    const tempImageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const tempData = tempImageData.data;

    // Применяем свертку
    for (let y = 1; y < tempCanvas.height - 1; y++) {
        for (let x = 1; x < tempCanvas.width - 1; x++) {
            let r = 0, g = 0, b = 0;

            for (let ky = -1; ky <= 1; ky++) {
                for (let kx = -1; kx <= 1; kx++) {
                    const pixelIndex = ((y + ky) * tempCanvas.width + (x + kx)) * 4;
                    const kernelValue = kernel[ky + 1][kx + 1];

                    r += tempData[pixelIndex] * kernelValue;
                    g += tempData[pixelIndex + 1] * kernelValue;
                    b += tempData[pixelIndex + 2] * kernelValue;
                }
            }

            const pixelIndex = ((y - 1) * canvas.width + (x - 1)) * 4;
            data[pixelIndex] = r;
            data[pixelIndex + 1] = g;
            data[pixelIndex + 2] = b;
        }
    }

    ctx.putImageData(imageData, 0, 0);
}

// Обработчик для открытия модального окна "Кривые"
document.getElementById('curvesTool').addEventListener('click', () => {
    document.getElementById('curvesModal').showModal();
    drawHistograms(); // Рисуем гистограммы при открытии
});

// Обработчик для применения коррекции
document.getElementById('applyCurves').addEventListener('click', () => {
    const input1 = parseInt(document.getElementById('input1').value);
    const output1 = parseInt(document.getElementById('output1').value);
    const input2 = parseInt(document.getElementById('input2').value);
    const output2 = parseInt(document.getElementById('output2').value);

    // Проверяем, что входное значение первой точки меньше второй
    if (input1 >= input2) {
        alert('Входное значение первой точки должно быть меньше второй.');
        return;
    }

    // Применяем коррекцию
    applyCurvesCorrection(input1, output1, input2, output2);
});

// Обработчик для сброса коррекции
document.getElementById('resetCurves').addEventListener('click', () => {
    const canvas = document.getElementById('imageCanvas');
    const ctx = canvas.getContext('2d');
    ctx.putImageData(originalImageData, 0, 0); // Восстанавливаем оригинальное изображение
    drawHistograms(); // Обновляем гистограммы
});

// Обработчик для закрытия модального окна
document.getElementById('closeCurvesModal').addEventListener('click', () => {
    document.getElementById('curvesModal').close();
});

// Обработчик для открытия модального окна фильтрации с использованием ядер
document.getElementById('kernelTool').addEventListener('click', () => {
    document.getElementById('kernelModal').showModal();
    updateKernelInputs(kernels.identity);
});

// Обработчик для выбора предустановленного ядра
document.getElementById('kernelPreset').addEventListener('change', (event) => {
    const preset = event.target.value;
    updateKernelInputs(kernels[preset]);
});

// Функция для обновления полей ввода ядра
function updateKernelInputs(kernel) {
    const inputs = document.querySelectorAll('.kernelInput');
    inputs.forEach((input, index) => {
        input.value = kernel[Math.floor(index / 3)][index % 3];
    });
}

// Обработчик для применения ядра
document.getElementById('applyKernel').addEventListener('click', () => {
    const kernel = [];
    const inputs = document.querySelectorAll('.kernelInput');
    inputs.forEach((input, index) => {
        const row = Math.floor(index / 3);
        if (!kernel[row]) kernel[row] = [];
        kernel[row].push(parseFloat(input.value));
    });

    applyKernel(kernel);
});

// Обработчик для сброса ядра
document.getElementById('resetKernel').addEventListener('click', () => {
    updateKernelInputs(kernels.identity);
    applyKernel(kernels.identity);
});

// Обработчик для закрытия модального окна
document.getElementById('closeKernelModal').addEventListener('click', () => {
    document.getElementById('kernelModal').close();
});

// Инструмент "рука" и "пипетка"
document.getElementById('handTool').addEventListener('click', () => setActiveTool('hand'));
document.getElementById('eyedropperTool').addEventListener('click', () => setActiveTool('eyedropper'));

// Функция для установки активного инструмента
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

    // Отображаем цвет и координаты
    document.getElementById('colorDisplay').style.backgroundColor = color;
    document.getElementById('colorDisplay').textContent = color;
    document.getElementById('coordinates').textContent = `X: ${x}, Y: ${y}`;
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
