// ============================================
// SCENE: MARKET - Авторынок
// ============================================

const MarketScene = {
    cars: [],
    scrollY: 0,
    selectedCar: null,
    notification: null,
    refreshTimer: 0,
    REFRESH_INTERVAL: 120, // Обновление рынка каждые 120 секунд

    init() {
        this.refreshMarket();
        this.scrollY = 0;
        this.selectedCar = null;
        this.notification = null;
        this.refreshTimer = this.REFRESH_INTERVAL;

        // Мультиплеер: подписка на события
        if (Multiplayer.isConnected) {
            Multiplayer.on('onOpponentBuy', (carId) => {
                this.cars = this.cars.filter(c => c.id !== carId);
                this.notification = { text: 'Соперник купил авто!', color: '#e94560', timer: 3 };
            });
            Multiplayer.on('onMarketRefresh', (seed) => {
                this._regenerateFromSeed(seed);
            });
        }
    },

    refreshMarket() {
        const seed = Multiplayer.isConnected ? Multiplayer.marketSeed : Date.now();
        const level = Economy.getLevel(Game.player.xp);
        this.cars = CarsDB.generateMarket(level.marketSlots, seed);
    },

    _regenerateFromSeed(seed) {
        const level = Economy.getLevel(Game.player.xp);
        this.cars = CarsDB.generateMarket(level.marketSlots, seed);
        this.notification = { text: 'Рынок обновился!', color: '#4ecdc4', timer: 3 };
    },

    update(dt) {
        // Таймер обновления рынка
        this.refreshTimer -= dt;
        if (this.refreshTimer <= 0) {
            this.refreshTimer = this.REFRESH_INTERVAL;
            if (Multiplayer.isConnected && Multiplayer.isHost) {
                Multiplayer.requestMarketRefresh();
            } else if (!Multiplayer.isConnected) {
                this.refreshMarket();
            }
        }

        // Уведомления
        if (this.notification) {
            this.notification.timer -= dt;
            if (this.notification.timer <= 0) this.notification = null;
        }

        if (Input.justClicked) {
            const cx = Input.clickX;
            const cy = Input.clickY;

            // Кнопка "Назад"
            if (Utils.isInRect(cx, cy, { x: 20, y: 20, w: 100, h: 40 })) {
                Audio.playClick();
                Game.setScene('garage');
                return;
            }

            // Клик по карточке авто
            if (!this.selectedCar) {
                for (let i = 0; i < this.cars.length; i++) {
                    const cardY = 120 + i * 130 + this.scrollY;
                    if (cardY < 60 || cardY > 650) continue;
                    if (Utils.isInRect(cx, cy, { x: 60, y: cardY, w: 860, h: 120 })) {
                        Audio.playClick();
                        this.selectedCar = this.cars[i];
                        return;
                    }
                }
            } else {
                // Кнопка "Купить"
                if (Utils.isInRect(cx, cy, { x: 500, y: 550, w: 200, h: 50 })) {
                    this._buySelectedCar();
                    return;
                }
                // Кнопка "Закрыть"
                if (Utils.isInRect(cx, cy, { x: 280, y: 550, w: 200, h: 50 })) {
                    Audio.playClick();
                    this.selectedCar = null;
                    return;
                }
            }
        }
    },

    _buySelectedCar() {
        const result = Economy.buyCar(Game.player, this.selectedCar);
        if (result.success) {
            Audio.playBuy();
            // Убираем с рынка
            this.cars = this.cars.filter(c => c.id !== this.selectedCar.id);
            // Уведомляем соперника
            if (Multiplayer.isConnected) {
                Multiplayer.notifyBuy(this.selectedCar.id);
                Multiplayer.sendPlayerUpdate(Game.player);
            }
            this.notification = {
                text: `Куплено: ${this.selectedCar.fullName}!`,
                color: '#4ecdc4',
                timer: 3
            };
            this.selectedCar = null;
            // Сохраняем
            Storage.saveGame(Game.player);
        } else {
            Audio.playError();
            this.notification = { text: result.reason, color: '#e94560', timer: 3 };
        }
    },

    render() {
        Renderer.drawGradientBg('#1a1a2e', '#16213e');

        // Заголовок
        Renderer.drawText('АВТОРЫНОК', 640, 30, {
            color: '#e94560', size: 36, align: 'center', bold: true
        });

        // Баланс
        Renderer.drawText(Utils.formatMoney(Game.player.money), 1100, 30, {
            color: '#4ecdc4', size: 24, align: 'right', bold: true
        });

        // Таймер обновления
        Renderer.drawText(`Обновление: ${Math.ceil(this.refreshTimer)}с`, 1100, 60, {
            color: '#888', size: 14, align: 'right'
        });

        // Кнопка назад
        Renderer.drawButton(20, 20, 100, 40, '← Гараж', {
            color: '#0f3460', textSize: 16
        });

        // Соперник (если кооператив)
        if (Multiplayer.isConnected && Multiplayer.opponentData) {
            Renderer.drawPanel(950, 80, 300, 60);
            Renderer.drawText(`Соперник: ${Multiplayer.opponentData.name}`, 960, 90, {
                color: '#e94560', size: 14
            });
            Renderer.drawText(Utils.formatMoney(Multiplayer.opponentData.money || 0), 960, 115, {
                color: '#fff', size: 16, bold: true
            });
        }

        // Список авто
        this.ctx = Renderer.ctx;
        for (let i = 0; i < this.cars.length; i++) {
            const car = this.cars[i];
            const y = 120 + i * 130 + this.scrollY;
            if (y < 60 || y > 700) continue;

            this._renderCarCard(car, 60, y, 860, 120);
        }

        // Подробности авто (модалка)
        if (this.selectedCar) {
            this._renderCarDetails();
        }

        // Уведомление
        if (this.notification) {
            Renderer.drawRect(240, 650, 800, 40, this.notification.color, 10);
            Renderer.drawText(this.notification.text, 640, 660, {
                color: '#fff', size: 18, align: 'center', bold: true
            });
        }
    },

    _renderCarCard(car, x, y, w, h) {
        const isHover = Utils.isInRect(Input.x, Input.y, { x, y, w, h });
        Renderer.drawPanel(x, y, w, h, {
            color: isHover ? '#1e2a4a' : '#16213e',
            borderColor: isHover ? '#e94560' : '#0f3460'
        });

        // Иконка авто
        Renderer.drawCarIcon(x + 60, y + h / 2, 1.5, car.color);

        // Название
        Renderer.drawText(car.fullName, x + 120, y + 15, {
            color: '#fff', size: 22, bold: true
        });
        Renderer.drawText(`${car.year} г.`, x + 120, y + 42, {
            color: '#aaa', size: 16
        });

        // Состояние
        const condColor = car.condition > 60 ? '#4ecdc4' : car.condition > 30 ? '#f39c12' : '#e94560';
        Renderer.drawText(`Состояние: ${Math.floor(car.condition)}%`, x + 120, y + 65, {
            color: condColor, size: 14
        });
        Renderer.drawProgressBar(x + 120, y + 85, 200, 10, car.condition / 100, condColor);

        // Повреждения
        const dmgText = car.visibleDamages.map(d => d.name).join(', ');
        Renderer.drawText(`Повреждения: ${dmgText}`, x + 350, y + 42, {
            color: '#f39c12', size: 14
        });

        // Цена
        Renderer.drawText(Utils.formatMoney(car.buyPrice), x + w - 30, y + h / 2, {
            color: '#4ecdc4', size: 24, align: 'right', baseline: 'middle', bold: true
        });

        // Индикатор выгодности
        const deal = Economy.analyzeDeal(car);
        const dealColors = { excellent: '#4ecdc4', good: '#6ab04c', risky: '#f39c12', bad: '#e94560' };
        const dealText = { excellent: '★★★', good: '★★', risky: '★', bad: '✗' };
        Renderer.drawText(dealText[deal], x + w - 30, y + 15, {
            color: dealColors[deal], size: 18, align: 'right'
        });
    },

    _renderCarDetails() {
        const car = this.selectedCar;

        // Затемнение
        Renderer.drawRect(0, 0, 1280, 720, 'rgba(0,0,0,0.7)');

        // Панель
        Renderer.drawPanel(200, 100, 880, 520, {
            color: '#1a1a2e', borderColor: '#e94560', borderWidth: 3
        });

        // Заголовок
        Renderer.drawText(car.fullName, 640, 130, {
            color: '#fff', size: 32, align: 'center', bold: true
        });
        Renderer.drawText(`${car.year} год`, 640, 170, {
            color: '#aaa', size: 20, align: 'center'
        });

        // Иконка
        Renderer.drawCarIcon(640, 240, 3, car.color);

        // Характеристики
        Renderer.drawText('Характеристики:', 250, 300, { color: '#4ecdc4', size: 18, bold: true });
        Renderer.drawText(`Макс. скорость: ${Math.floor(car.maxSpeed)} км/ч`, 250, 330, { color: '#fff', size: 16 });
        Renderer.drawText(`Разгон: ${car.acceleration.toFixed(1)}/1.5`, 250, 355, { color: '#fff', size: 16 });
        Renderer.drawText(`Управляемость: ${car.handling.toFixed(1)}/1.5`, 250, 380, { color: '#fff', size: 16 });

        // Повреждения
        Renderer.drawText('Видимые повреждения:', 650, 300, { color: '#f39c12', size: 18, bold: true });
        car.visibleDamages.forEach((d, i) => {
            const cost = CarsDB.calculateRepairCost(d);
            Renderer.drawText(`• ${d.name} (${d.severity}%) — ≈${Utils.formatMoney(cost)}`, 650, 330 + i * 28, {
                color: '#fff', size: 15
            });
        });

        // Скрытые дефекты предупреждение
        Renderer.drawText('⚠ Возможны скрытые дефекты!', 640, 470, {
            color: '#e94560', size: 16, align: 'center'
        });

        // Цена
        Renderer.drawText(`Цена: ${Utils.formatMoney(car.buyPrice)}`, 640, 510, {
            color: '#4ecdc4', size: 28, align: 'center', bold: true
        });

        // Кнопки
        Renderer.drawButton(280, 550, 200, 50, 'Закрыть', {
            color: '#555', hoverColor: '#777'
        });

        const canBuy = Game.player.money >= car.buyPrice;
        Renderer.drawButton(500, 550, 200, 50, 'Купить', {
            color: canBuy ? '#4ecdc4' : '#555',
            hoverColor: canBuy ? '#6ee6d6' : '#555',
            enabled: canBuy
        });
    }
};
