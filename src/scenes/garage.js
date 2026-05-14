// ============================================
// SCENE: GARAGE - Гараж игрока
// ============================================

const GarageScene = {
    selectedCar: null,
    notification: null,

    init() {
        this.selectedCar = null;
        this.notification = null;

        // Раскрываем скрытые дефекты при первом входе в гараж
        Game.player.garage.forEach(car => {
            if (!car.hiddenRevealed && car.hiddenDamages.length > 0) {
                car.hiddenRevealed = true;
                this.notification = {
                    text: `Обнаружены скрытые дефекты у ${car.fullName}!`,
                    color: '#e94560',
                    timer: 5
                };
            }
        });
    },

    update(dt) {
        if (this.notification) {
            this.notification.timer -= dt;
            if (this.notification.timer <= 0) this.notification = null;
        }

        if (Input.justClicked) {
            const cx = Input.clickX;
            const cy = Input.clickY;

            // Кнопка "Рынок"
            if (Utils.isInRect(cx, cy, { x: 20, y: 20, w: 130, h: 40 })) {
                Audio.playClick();
                Game.setScene('market');
                return;
            }

            // Кнопка "Продать" (если выбрано авто)
            if (this.selectedCar && Utils.isInRect(cx, cy, { x: 900, y: 600, w: 150, h: 45 })) {
                Audio.playClick();
                Game.selectedCar = this.selectedCar;
                Game.setScene('sell');
                return;
            }

            // Кнопка "Ремонт"
            if (this.selectedCar && Utils.isInRect(cx, cy, { x: 730, y: 600, w: 150, h: 45 })) {
                Audio.playClick();
                Game.selectedCar = this.selectedCar;
                Game.setScene('repair');
                return;
            }

            // Кнопка "Гонки"
            if (this.selectedCar && Utils.isInRect(cx, cy, { x: 560, y: 600, w: 150, h: 45 })) {
                Audio.playClick();
                Game.selectedCar = this.selectedCar;
                Game.setScene('race');
                return;
            }

            // Выбор авто
            this.selectedCar = null;
            for (let i = 0; i < Game.player.garage.length; i++) {
                const x = 60 + (i % 3) * 400;
                const y = 120 + Math.floor(i / 3) * 220;
                if (Utils.isInRect(cx, cy, { x, y, w: 380, h: 200 })) {
                    Audio.playClick();
                    this.selectedCar = Game.player.garage[i];
                    break;
                }
            }
        }
    },

    render() {
        Renderer.drawGradientBg('#16213e', '#1a1a2e');

        // Заголовок
        Renderer.drawText('МОЙ ГАРАЖ', 640, 30, {
            color: '#4ecdc4', size: 36, align: 'center', bold: true
        });

        // Баланс и уровень
        const level = Economy.getLevel(Game.player.xp);
        Renderer.drawText(`${level.name} | ${Utils.formatMoney(Game.player.money)}`, 1200, 30, {
            color: '#fff', size: 18, align: 'right'
        });
        Renderer.drawText(`Продано: ${Game.player.carsSold} | Прибыль: ${Utils.formatMoney(Game.player.totalProfit)}`, 1200, 55, {
            color: '#aaa', size: 14, align: 'right'
        });

        // Кнопки навигации
        Renderer.drawButton(20, 20, 130, 40, '🏪 Рынок', {
            color: '#e94560', textSize: 16
        });

        // Авто в гараже
        if (Game.player.garage.length === 0) {
            Renderer.drawText('Гараж пуст! Иди на рынок и купи авто.', 640, 360, {
                color: '#888', size: 22, align: 'center'
            });
        } else {
            for (let i = 0; i < Game.player.garage.length; i++) {
                const car = Game.player.garage[i];
                const x = 60 + (i % 3) * 400;
                const y = 120 + Math.floor(i / 3) * 220;
                this._renderGarageCar(car, x, y, car === this.selectedCar);
            }
        }

        // Панель выбранного авто
        if (this.selectedCar) {
            this._renderSelectedPanel();
        }

        // Уведомление
        if (this.notification) {
            Renderer.drawRect(240, 650, 800, 40, this.notification.color, 10);
            Renderer.drawText(this.notification.text, 640, 660, {
                color: '#fff', size: 16, align: 'center', bold: true
            });
        }
    },

    _renderGarageCar(car, x, y, selected) {
        Renderer.drawPanel(x, y, 380, 200, {
            color: selected ? '#1e2a4a' : '#0f1a2e',
            borderColor: selected ? '#4ecdc4' : '#0f3460',
            borderWidth: selected ? 3 : 1
        });

        Renderer.drawCarIcon(x + 70, y + 80, 2, car.color);

        Renderer.drawText(car.fullName, x + 150, y + 20, {
            color: '#fff', size: 18, bold: true
        });
        Renderer.drawText(`${car.year} г.`, x + 150, y + 45, {
            color: '#aaa', size: 14
        });

        // Состояние
        Renderer.drawText(`Состояние: ${Math.floor(car.condition)}%`, x + 150, y + 75, {
            color: '#fff', size: 14
        });
        Renderer.drawProgressBar(x + 150, y + 95, 200, 8, car.condition / 100);

        // Повреждения (оставшиеся)
        const allDamages = [...car.visibleDamages, ...(car.hiddenRevealed ? car.hiddenDamages : [])];
        const unrepairedCount = allDamages.filter(d => !car.repaired[d.id]).length;
        Renderer.drawText(`Повреждений: ${unrepairedCount}`, x + 150, y + 115, {
            color: unrepairedCount > 0 ? '#f39c12' : '#4ecdc4', size: 14
        });

        // Купили за
        Renderer.drawText(`Куплено за: ${Utils.formatMoney(car.boughtFor)}`, x + 150, y + 140, {
            color: '#888', size: 12
        });

        // Вложено в ремонт
        if (car.totalRepairCost > 0) {
            Renderer.drawText(`Ремонт: ${Utils.formatMoney(car.totalRepairCost)}`, x + 150, y + 158, {
                color: '#888', size: 12
            });
        }

        // Скрытые дефекты индикатор
        if (car.hiddenRevealed && car.hiddenDamages.length > 0) {
            Renderer.drawText('⚠', x + 350, y + 20, { color: '#e94560', size: 24 });
        }
    },

    _renderSelectedPanel() {
        const car = this.selectedCar;

        // Нижняя панель
        Renderer.drawPanel(50, 560, 1180, 100, {
            color: '#0f1a2e', borderColor: '#4ecdc4'
        });

        Renderer.drawText(`${car.fullName} | Оценочная продажа: ≈${Utils.formatMoney(CarsDB.calculateSellPrice(car))}`, 70, 575, {
            color: '#fff', size: 16
        });

        // Кнопки действий
        Renderer.drawButton(560, 600, 150, 45, '🏁 Гонки', {
            color: '#8e44ad', hoverColor: '#9b59b6', textSize: 16
        });
        Renderer.drawButton(730, 600, 150, 45, '🔧 Ремонт', {
            color: '#f39c12', hoverColor: '#f5b041', textSize: 16
        });
        Renderer.drawButton(900, 600, 150, 45, '💰 Продать', {
            color: '#4ecdc4', hoverColor: '#6ee6d6', textSize: 16
        });
    }
};
