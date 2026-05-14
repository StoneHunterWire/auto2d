// ============================================
// INPUT - Обработка ввода (мышь + тач)
// ============================================

const Input = {
    x: 0,
    y: 0,
    isDown: false,
    justClicked: false,
    clickX: 0,
    clickY: 0,
    _canvas: null,
    _scaleX: 1,
    _scaleY: 1,

    init(canvas) {
        this._canvas = canvas;

        // Mouse events
        canvas.addEventListener('mousemove', (e) => this._onMove(e.clientX, e.clientY));
        canvas.addEventListener('mousedown', (e) => this._onDown(e.clientX, e.clientY));
        canvas.addEventListener('mouseup', () => this._onUp());

        // Touch events
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this._onMove(touch.clientX, touch.clientY);
        }, { passive: false });

        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this._onDown(touch.clientX, touch.clientY);
        }, { passive: false });

        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this._onUp();
        }, { passive: false });

        // Keyboard
        this.keys = {};
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    },

    updateScale(gameWidth, gameHeight) {
        const rect = this._canvas.getBoundingClientRect();
        this._scaleX = gameWidth / rect.width;
        this._scaleY = gameHeight / rect.height;
    },

    _onMove(clientX, clientY) {
        const rect = this._canvas.getBoundingClientRect();
        this.x = (clientX - rect.left) * this._scaleX;
        this.y = (clientY - rect.top) * this._scaleY;
    },

    _onDown(clientX, clientY) {
        this._onMove(clientX, clientY);
        this.isDown = true;
        this.justClicked = true;
        this.clickX = this.x;
        this.clickY = this.y;
    },

    _onUp() {
        this.isDown = false;
    },

    // Вызывать в конце каждого кадра
    endFrame() {
        this.justClicked = false;
    },

    // Проверка нажатия клавиши
    isKeyDown(code) {
        return this.keys[code] || false;
    }
};
