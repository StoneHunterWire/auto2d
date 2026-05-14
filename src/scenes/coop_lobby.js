// ============================================
// SCENE: COOP LOBBY - Лобби кооператива
// ============================================

const CoopLobbyScene = {
    state: 'menu', // menu, creating, joining, waiting, connected
    roomCode: '',
    inputCode: '',
    error: null,
    notification: null,

    init() {
        this.state = 'menu';
        this.roomCode = '';
        this.inputCode = '';
        this.error = null;
        this.notification = null;
    },

    update(dt) {
        if (this.notification) {
            this.notification.timer -= dt;
            if (this.notification.timer <= 0) this.notification = null;
        }

        if (Input.justClicked) {
            const cx = Input.clickX;
            const cy = Input.clickY;

            // Назад
            if (Utils.isInRect(cx, cy, { x: 20, y: 20, w: 120, h: 40 })) {
                Audio.playClick();
                Multiplayer.disconnect();
                Game.setScene('menu');
                return;
            }

            if (this.state === 'menu') {
                // Создать комнату
                if (Utils.isInRect(cx, cy, { x: 440, y: 300, w: 400, h: 60 })) {
                    Audio.playClick();
                    this._createRoom();
                }
                // Присоединиться
                if (Utils.isInRect(cx, cy, { x: 440, y: 380, w: 400, h: 60 })) {
                    Audio.playClick();
                    this.state = 'joining';
                    this.inputCode = '';
                }
            }

            if (this.state === 'joining') {
                // Кнопки ввода кода
                this._handleCodeInput(cx, cy);

                // Подключиться
                if (Utils.isInRect(cx, cy, { x: 490, y: 520, w: 300, h: 50 })) {
                    if (this.inputCode.length === 5) {
                        this._joinRoom();
                    }
                }
            }

            if (this.state === 'connected') {
                // Начать игру
                if (Utils.isInRect(cx, cy, { x: 440, y: 450, w: 400, h: 60 })) {
                    Audio.playClick();
                    Game.startMultiplayer();
                }
            }
        }
    },

    async _createRoom() {
        this.state = 'creating';
        try {
            const code = await Multiplayer.createRoom();
            this.roomCode = code;
            this.state = 'waiting';

            Multiplayer.on('onPlayerJoined', () => {
                this.state = 'connected';
                this.notification = { text: 'Соперник подключился!', color: '#4ecdc4', timer: 5 };
            });
        } catch (e) {
            this.error = 'Ошибка создания комнаты';
            this.state = 'menu';
        }
    },

    async _joinRoom() {
        this.state = 'creating';
        try {
            await Multiplayer.joinRoom(this.inputCode);
            this.state = 'connected';

            Multiplayer.on('onConnected', (data) => {
                this.notification = { text: `Подключено к ${data.hostName}!`, color: '#4ecdc4', timer: 5 };
            });
        } catch (e) {
            this.error = 'Не удалось подключиться. Проверь код.';
            this.state = 'joining';
        }
    },

    _handleCodeInput(cx, cy) {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        const startX = 290;
        const startY = 400;
        const btnSize = 45;
        const cols = 8;

        for (let i = 0; i < chars.length; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = startX + col * (btnSize + 5);
            const y = startY + row * (btnSize + 5);

            if (Utils.isInRect(cx, cy, { x, y, w: btnSize, h: btnSize })) {
                if (this.inputCode.length < 5) {
                    this.inputCode += chars[i];
                    Audio.playClick();
                }
                return;
            }
        }

        // Удалить символ
        if (Utils.isInRect(cx, cy, { x: 700, y: 340, w: 80, h: 40 })) {
            this.inputCode = this.inputCode.slice(0, -1);
            Audio.playClick();
        }
    },

    render() {
        Renderer.drawGradientBg('#0f0c29', '#302b63');

        Renderer.drawText('КООПЕРАТИВ', 640, 50, {
            color: '#e94560', size: 42, align: 'center', bold: true
        });

        Renderer.drawText('Соревнуйся с другом: общий рынок, раздельные гаражи!', 640, 100, {
            color: '#aaa', size: 16, align: 'center'
        });

        Renderer.drawButton(20, 20, 120, 40, '← Назад', {
            color: '#0f3460', textSize: 16
        });

        if (this.state === 'menu') {
            Renderer.drawButton(440, 300, 400, 60, 'СОЗДАТЬ КОМНАТУ', {
                color: '#e94560', hoverColor: '#ff6b6b'
            });
            Renderer.drawButton(440, 380, 400, 60, 'ПРИСОЕДИНИТЬСЯ', {
                color: '#0f3460', hoverColor: '#1a5276'
            });

            Renderer.drawText('Создай комнату и поделись кодом с другом', 640, 480, {
                color: '#888', size: 14, align: 'center'
            });
        }

        if (this.state === 'creating') {
            Renderer.drawText('Подключение...', 640, 350, {
                color: '#fff', size: 24, align: 'center'
            });
        }

        if (this.state === 'waiting') {
            Renderer.drawText('Код комнаты:', 640, 250, {
                color: '#fff', size: 20, align: 'center'
            });
            // Крупный код
            Renderer.drawPanel(440, 280, 400, 80, { borderColor: '#4ecdc4', borderWidth: 3 });
            Renderer.drawText(this.roomCode, 640, 310, {
                color: '#4ecdc4', size: 48, align: 'center', bold: true
            });
            Renderer.drawText('Сообщи этот код сопернику', 640, 390, {
                color: '#aaa', size: 16, align: 'center'
            });
            Renderer.drawText('Ожидание подключения...', 640, 430, {
                color: '#f39c12', size: 18, align: 'center'
            });
        }

        if (this.state === 'joining') {
            Renderer.drawText('Введи код комнаты:', 640, 250, {
                color: '#fff', size: 20, align: 'center'
            });

            // Поле ввода
            Renderer.drawPanel(440, 280, 400, 60, { borderColor: '#e94560', borderWidth: 2 });
            Renderer.drawText(this.inputCode || '_____', 640, 300, {
                color: this.inputCode ? '#fff' : '#555', size: 36, align: 'center', bold: true
            });

            // Кнопка удалить
            Renderer.drawButton(700, 340, 80, 40, '⌫', {
                color: '#555', textSize: 20
            });

            // Виртуальная клавиатура
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            const startX = 290;
            const startY = 400;
            const btnSize = 45;
            const cols = 8;

            for (let i = 0; i < chars.length; i++) {
                const col = i % cols;
                const row = Math.floor(i / cols);
                const x = startX + col * (btnSize + 5);
                const y = startY + row * (btnSize + 5);
                Renderer.drawButton(x, y, btnSize, btnSize, chars[i], {
                    color: '#16213e', hoverColor: '#1a5276', textSize: 16
                });
            }

            // Кнопка подключиться
            const canConnect = this.inputCode.length === 5;
            Renderer.drawButton(490, 520, 300, 50, 'ПОДКЛЮЧИТЬСЯ', {
                color: canConnect ? '#4ecdc4' : '#555',
                enabled: canConnect
            });
        }

        if (this.state === 'connected') {
            Renderer.drawText('Соперник подключён!', 640, 300, {
                color: '#4ecdc4', size: 28, align: 'center', bold: true
            });

            if (Multiplayer.opponentData) {
                Renderer.drawText(`Противник: ${Multiplayer.opponentData.name}`, 640, 350, {
                    color: '#fff', size: 18, align: 'center'
                });
            }

            Renderer.drawButton(440, 450, 400, 60, 'НАЧАТЬ ИГРУ', {
                color: '#e94560', hoverColor: '#ff6b6b'
            });
        }

        // Ошибка
        if (this.error) {
            Renderer.drawText(this.error, 640, 600, {
                color: '#e94560', size: 16, align: 'center'
            });
        }

        // Уведомление
        if (this.notification) {
            Renderer.drawRect(240, 650, 800, 40, this.notification.color, 10);
            Renderer.drawText(this.notification.text, 640, 660, {
                color: '#fff', size: 16, align: 'center', bold: true
            });
        }
    }
};
