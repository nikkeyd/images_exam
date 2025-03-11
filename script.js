// Функция для отображения изображения на холсте
function drawImageOnCanvas(img) {
    const canvas = document.getElementById('imageCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    // Отображаем размеры изображения
    document.getElementById('imageSize').textContent = `${img.width} x ${img.height}`;

    // Добавляем обработчик события для движения мыши по холсту
    canvas.addEventListener('mousemove', function(event) {
        // Получаем реальные размеры холста и его позицию на странице
        const rect = canvas.getBoundingClientRect();

        // Масштабируем координаты курсора относительно реальных размеров холста
        const scaleX = canvas.width / rect.width;  // Масштаб по X
        const scaleY = canvas.height / rect.height; // Масштаб по Y

        // Вычисляем координаты курсора относительно холста с учетом масштабирования
        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;

        // Получаем данные о цвете пикселя в координатах (x, y)
        const pixel = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
        const color = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;

        // Отображаем цвет и координаты в информационной панели
        document.getElementById('colorDisplay').style.backgroundColor = color;
        document.getElementById('colorDisplay').textContent = color;
        document.getElementById('coordinates').textContent = `X: ${Math.floor(x)}, Y: ${Math.floor(y)}`;
    });
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
