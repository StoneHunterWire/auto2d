// ============================================
// SCENE: MAIN MENU - Главное меню
// ============================================

const MenuScene = {
    buttons: [],
    titleAnim: 0,
    carAnim: 0,

    init() {
        this.titleAnim = 0;
        this.carAnim = 0;
    },

    update(dt) {
        this.titleAnim += dt * 2;
        this.carAnim += dt * 3;

        if (Input.justClicked) {
            // Одиночная игра
            if (Utils.isInRect(Input.clickX, Input.clickY, { x: 440, y: 320, w: 400, h: 60 })) {
                Audio.playClick();
                Game.startSinglePlayer();
            }
            // Кооператив
            if (Utils.isInRect(Input.clickX, Input.clickY, { x: 440, y: 400, w: 400, h: 60 })) {
                Audio.playClick();
                Game.setScene('coop_lobby');
            }
            // Настройки звука
            if (Utils.isInRect(Input.clickX, Input.clickY, { x: 440, y: 480, w: 400, h: 60 })) {
                Audio.playClick();
                Audio.toggleMute();
            }
        }
    },

    render() {
        // Фон
        Renderer.drawGradientBg('#0f0c29', '#302b63');

        // Декоративные авто
        const carY = 200 + Math.sin(this.carAnim) * 10;
        Renderer.drawCarIcon(300, carY, 2, '#e94560');
        Renderer.drawCarIcon(980, carY + 20, 2, '#4ecdc4');

        // Заголовок
        const titleY = 100 + Math.sin(this.titleAnim) * 5;
        Renderer.drawText('AUTO FLIP', 640, titleY, {
            color: '#e94560',
            size: 72,
            align: 'center',
            bold: true,
            shadow: true
        });
        Renderer.drawText('ПЕРЕКУП', 640, titleY + 75, {
            color: '#4ecdc4',
            size: 32,
            align: 'center'
        });

        // Описание
        Renderer.drawText('Покупай, ремонтируй, продавай!', 640, 260, {
            color: '#aaa',
            size: 18,
            align: 'center'
        });

        // Кнопки
        Renderer.drawButton(440, 320, 400, 60, 'ОДИНОЧНАЯ ИГРА', {
            color: '#e94560',
            hoverColor: '#ff6b6b'
        });

        Renderer.drawButton(440, 400, 400, 60, 'КООПЕРАТИВ (PvP)', {
            color: '#0f3460',
            hoverColor: '#1a5276'
        });

        const muteText = Audio.muted ? 'ЗВУК: ВЫКЛ' : 'ЗВУК: ВКЛ';
        Renderer.drawButton(440, 480, 400, 60, muteText, {
            color: '#16213e',
            hoverColor: '#1a3a5c'
        });

        // Версия
        Renderer.drawText('v0.1.0 | Yandex Games', 640, 680, {
            color: '#555',
            size: 14,
            align: 'center'
        });
    }
};
