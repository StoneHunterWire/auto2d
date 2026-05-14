// ============================================
// UTILS - Вспомогательные функции
// ============================================

const Utils = {
    // Случайное число в диапазоне
    random(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    // Случайное число с плавающей точкой
    randomFloat(min, max) {
        return Math.random() * (max - min) + min;
    },

    // Случайный элемент массива
    randomFrom(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    },

    // Форматирование денег
    formatMoney(amount) {
        return amount.toLocaleString('ru-RU') + ' ₽';
    },

    // Clamp значения
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    // Линейная интерполяция
    lerp(a, b, t) {
        return a + (b - a) * t;
    },

    // Расстояние между точками
    distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    },

    // Проверка клика/тача в прямоугольнике
    isInRect(x, y, rect) {
        return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
    },

    // Генерация UUID
    generateId() {
        return 'xxxx-xxxx-xxxx'.replace(/x/g, () => 
            Math.floor(Math.random() * 16).toString(16)
        );
    },

    // Задержка
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    // Easing функции для анимаций
    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    },

    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    },

    // Перемешивание массива (Fisher-Yates)
    shuffle(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }
};
