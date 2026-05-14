// ============================================
// GAME - Главный контроллер игры
// ============================================

const Game = {
    player: null,
    selectedCar: null,
    currentScene: null,
    scenes: {},
    isReady: false,
    lastTime: 0,

    start() {
        console.log('Auto Flip - Запуск...');

        // Инициализация рендера и ввода
        Renderer.init();
        Input.init(Renderer.canvas);
        Audio.init();

        // Регистрация сцен
        this.scenes = {
            menu: MenuScene,
            market: MarketScene,
            garage: GarageScene,
            repair: RepairScene,
            sell: SellScene,
            race: RaceScene,
            coop_lobby: CoopLobbyScene
        };

        // Загрузка сохранения
        const savedData = Storage.loadGame();
        if (savedData) {
            this.player = savedData;
            console.log('Game loaded:', this.player.name);
        }

        // Скрываем экран загрузки
        const loadingEl = document.getElementById('loading');
        if (loadingEl) loadingEl.style.display = 'none';

        // Стартуем меню
        this.setScene('menu');

        this.isReady = true;

        // Запуск game loop
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    },

    loop(timestamp) {
        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
        this.lastTime = timestamp;

        // Обновление
        if (this.currentScene && this.currentScene.update) {
            this.currentScene.update(dt);
        }

        // Рендер
        if (this.currentScene && this.currentScene.render) {
            this.currentScene.render();
        }

        // Очистка ввода
        Input.endFrame();

        requestAnimationFrame((t) => this.loop(t));
    },

    setScene(name) {
        if (this.scenes[name]) {
            this.currentScene = this.scenes[name];
            if (this.currentScene.init) {
                this.currentScene.init();
            }
            console.log('Scene:', name);
        }
    },

    // Одиночная игра
    startSinglePlayer() {
        if (!this.player) {
            this.player = Economy.createPlayer('Игрок');
        }
        this.setScene('garage');
    },

    // Мультиплеер
    startMultiplayer() {
        if (!this.player) {
            this.player = Economy.createPlayer('Игрок');
        }
        Multiplayer.sendPlayerUpdate(this.player);
        this.setScene('garage');
    },

    // Авто-сохранение каждые 30 секунд
    _autoSaveInterval: null,
    startAutoSave() {
        this._autoSaveInterval = setInterval(() => {
            if (this.player) {
                Storage.saveGame(this.player);
            }
        }, 30000);
    }
};

// === ЗАПУСК ===
window.addEventListener('load', () => {
    Game.start();
    Game.startAutoSave();
});
