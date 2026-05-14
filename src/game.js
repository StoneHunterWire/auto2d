// ============================================
// GAME - Главный контроллер игры
// ============================================

const Game = {
    player: null,
    selectedCar: null,
    currentScene: null,
    scenes: {},
    ysdk: null,
    isReady: false,
    lastTime: 0,

    async start() {
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

        // Инициализация Yandex Games SDK (с таймаутом)
        try {
            if (typeof YaGames !== 'undefined') {
                // Таймаут 3 сек — если SDK не отвечает, продолжаем без него
                this.ysdk = await Promise.race([
                    YaGames.init(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('SDK timeout')), 3000))
                ]);
                console.log('Yandex SDK initialized');

                // Инициализация подсистем
                await Storage.init(this.ysdk);
                Ads.init(this.ysdk);
            } else {
                console.warn('YaGames not found, running in local mode');
            }
        } catch (e) {
            console.warn('Yandex SDK not available (local dev mode):', e.message);
        }

        // Загрузка сохранения
        const savedData = await Storage.loadGame();
        if (savedData) {
            this.player = savedData;
            console.log('Game loaded:', this.player.name);
        }

        // Скрываем экран загрузки
        const loadingEl = document.getElementById('loading');
        if (loadingEl) loadingEl.style.display = 'none';

        // Стартуем меню
        this.setScene('menu');

        // Сообщаем SDK что игра готова
        if (this.ysdk) {
            this.ysdk.features.LoadingAPI.ready();
        }

        this.isReady = true;

        // Запуск game loop
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    },

    loop(timestamp) {
        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1); // Макс 100ms
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
        // Отправляем своё состояние сопернику
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
