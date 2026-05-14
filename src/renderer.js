// ============================================
// RENDERER - Отрисовка на Canvas
// ============================================

const Renderer = {
    canvas: null,
    ctx: null,
    width: 1280,
    height: 720,

    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
    },

    resize() {
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        Input.updateScale(this.width, this.height);
    },

    clear(color = '#1a1a2e') {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this.width, this.height);
    },

    // Прямоугольник
    drawRect(x, y, w, h, color, radius = 0) {
        this.ctx.fillStyle = color;
        if (radius > 0) {
            this.ctx.beginPath();
            this.ctx.roundRect(x, y, w, h, radius);
            this.ctx.fill();
        } else {
            this.ctx.fillRect(x, y, w, h);
        }
    },

    // Обводка
    drawRectOutline(x, y, w, h, color, lineWidth = 2, radius = 0) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        if (radius > 0) {
            this.ctx.beginPath();
            this.ctx.roundRect(x, y, w, h, radius);
            this.ctx.stroke();
        } else {
            this.ctx.strokeRect(x, y, w, h);
        }
    },

    // Текст
    drawText(text, x, y, options = {}) {
        const {
            color = '#ffffff',
            size = 20,
            align = 'left',
            baseline = 'top',
            font = 'Segoe UI',
            bold = false,
            shadow = false
        } = options;

        this.ctx.font = `${bold ? 'bold ' : ''}${size}px ${font}`;
        this.ctx.textAlign = align;
        this.ctx.textBaseline = baseline;

        if (shadow) {
            this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
            this.ctx.fillText(text, x + 2, y + 2);
        }

        this.ctx.fillStyle = color;
        this.ctx.fillText(text, x, y);
    },

    // Кнопка с hover-эффектом
    drawButton(x, y, w, h, text, options = {}) {
        const {
            color = '#e94560',
            hoverColor = '#ff6b6b',
            textColor = '#ffffff',
            textSize = 20,
            radius = 10,
            enabled = true
        } = options;

        const isHover = Utils.isInRect(Input.x, Input.y, { x, y, w, h });
        const btnColor = !enabled ? '#555555' : (isHover ? hoverColor : color);

        this.drawRect(x, y, w, h, btnColor, radius);
        this.drawText(text, x + w / 2, y + h / 2, {
            color: textColor,
            size: textSize,
            align: 'center',
            baseline: 'middle',
            bold: true
        });

        return { x, y, w, h, isHover };
    },

    // Прогресс бар
    drawProgressBar(x, y, w, h, progress, color = '#4ecdc4', bgColor = '#16213e') {
        this.drawRect(x, y, w, h, bgColor, h / 2);
        if (progress > 0) {
            this.drawRect(x, y, w * Math.min(progress, 1), h, color, h / 2);
        }
    },

    // Карточка (панель)
    drawPanel(x, y, w, h, options = {}) {
        const {
            color = '#16213e',
            borderColor = '#0f3460',
            borderWidth = 2,
            radius = 12
        } = options;

        this.drawRect(x, y, w, h, color, radius);
        this.drawRectOutline(x, y, w, h, borderColor, borderWidth, radius);
    },

    // Иконка авто (простая 2D отрисовка)
    drawCarIcon(x, y, scale = 1, color = '#e94560') {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        // Кузов
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(-30, -10, 60, 20, 5);
        ctx.fill();

        // Крыша
        ctx.beginPath();
        ctx.roundRect(-15, -22, 30, 14, 4);
        ctx.fill();

        // Колёса
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(-18, 12, 7, 0, Math.PI * 2);
        ctx.arc(18, 12, 7, 0, Math.PI * 2);
        ctx.fill();

        // Диски
        ctx.fillStyle = '#888';
        ctx.beginPath();
        ctx.arc(-18, 12, 3, 0, Math.PI * 2);
        ctx.arc(18, 12, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    },

    // Градиентный фон
    drawGradientBg(color1, color2) {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
};
