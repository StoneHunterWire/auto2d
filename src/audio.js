// ============================================
// AUDIO - Звуковая система (с паузой при сворачивании)
// ============================================

const Audio = {
    sounds: {},
    musicVolume: 0.3,
    sfxVolume: 0.5,
    muted: false,
    _context: null,

    init() {
        // Создаём AudioContext при первом взаимодействии
        const initContext = () => {
            if (!this._context) {
                this._context = new (window.AudioContext || window.webkitAudioContext)();
            }
            document.removeEventListener('click', initContext);
            document.removeEventListener('touchstart', initContext);
        };
        document.addEventListener('click', initContext);
        document.addEventListener('touchstart', initContext);

        // Пауза звука при сворачивании (требование Яндекс)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAll();
            } else {
                this.resumeAll();
            }
        });
    },

    // Генерация простых звуков без файлов
    playTone(frequency, duration, type = 'square', volume = 0.3) {
        if (this.muted || !this._context) return;

        const oscillator = this._context.createOscillator();
        const gainNode = this._context.createGain();

        oscillator.type = type;
        oscillator.frequency.value = frequency;
        gainNode.gain.value = volume * this.sfxVolume;

        oscillator.connect(gainNode);
        gainNode.connect(this._context.destination);

        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.001, this._context.currentTime + duration);
        oscillator.stop(this._context.currentTime + duration);
    },

    // Звук покупки
    playBuy() {
        this.playTone(523, 0.1, 'sine');
        setTimeout(() => this.playTone(659, 0.1, 'sine'), 100);
        setTimeout(() => this.playTone(784, 0.2, 'sine'), 200);
    },

    // Звук продажи
    playSell() {
        this.playTone(784, 0.1, 'sine');
        setTimeout(() => this.playTone(988, 0.1, 'sine'), 100);
        setTimeout(() => this.playTone(1175, 0.3, 'sine'), 200);
    },

    // Звук клика
    playClick() {
        this.playTone(440, 0.05, 'square', 0.2);
    },

    // Звук ошибки
    playError() {
        this.playTone(200, 0.2, 'sawtooth', 0.3);
    },

    // Звук ремонта
    playRepair() {
        this.playTone(330, 0.05, 'square', 0.2);
    },

    // Звук двигателя (для гонок)
    playEngine(speed) {
        const freq = 80 + speed * 2;
        this.playTone(freq, 0.1, 'sawtooth', 0.15);
    },

    pauseAll() {
        if (this._context && this._context.state === 'running') {
            this._context.suspend();
        }
    },

    resumeAll() {
        if (this._context && this._context.state === 'suspended') {
            this._context.resume();
        }
    },

    toggleMute() {
        this.muted = !this.muted;
        return this.muted;
    }
};
