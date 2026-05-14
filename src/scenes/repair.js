// ============================================
// SCENE: REPAIR - Ремонт авто
// ============================================

const RepairScene = {
    car: null,
    damages: [],
    notification: null,
    miniGame: null, // Мини-игра ремонта (если активна)

    init() {
        this.car = Game.selectedCar;
        this.notification = null;
        this.miniGame = null;
        this._updateDamageList();
    },

    _updateDamageList() {
        if (!this.car) return;
        const all = [...this.car.visibleDamages, ...(this.car.hiddenRevealed ? this.car.hiddenDamages : [])];
        this.damages = all.map(d => ({
            ...d,
            cost: CarsDB.calculateRepairCost(d),
            repaired: this.car.repaired[d.id] || false
        }));
    },

    update(dt) {
        if (this.notification) {
            this.notification.timer -= dt;
            if (this.notification.timer <= 0) this.notification = null;
        }

        // Мини-игра активна
        if (this.miniGame) {
            this._updateMiniGame(dt);
            return;
        }

        if (Input.justClicked) {
            const cx = Input.clickX;
            const cy = Input.clickY;

            // Назад
            if (Utils.isInRect(cx, cy, { x: 20, y: 20, w: 120, h: 40 })) {
                Audio.playClick();
                Game.setScene('garage');
                return;
            }

            // Клик по повреждению для ремонта
            for (let i = 0; i < this.damages.length; i++) {
                const d = this.damages[i];
                if (d.repaired) continue;
                const y = 150 + i * 90;
                if (Utils.isInRect(cx, cy, { x: 60, y, w: 600, h: 80 })) {
                    this._startRepair(d);
                    return;
                }
            }
        }
    },

    _startRepair(damage) {
        const result = Economy.repairDamage(Game.player, this.car.id, damage.id);
        if (result.success) {
            Audio.playRepair();
            // Запускаем мини-игру
            this.miniGame = {
                type: damage.id,
                progress: 0,
                target: 100,
                speed: 1.5 + damage.difficulty * 0.5,
                clicks: 0,
                needed: 5 + damage.difficulty * 3,
                done: false
            };
            this._updateDamageList();
            this.notification = {
                text: `Ремонт: -${Utils.formatMoney(result.cost)}`,
                color: '#f39c12',
                timer: 3
            };
            Storage.saveGame(Game.player);
            if (Multiplayer.isConnected) {
                Multiplayer.sendPlayerUpdate(Game.player);
            }
        } else {
            Audio.playError();
            this.notification = { text: result.reason, color: '#e94560', timer: 3 };
        }
    },

    _updateMiniGame(dt) {
        const mg = this.miniGame;
        mg.progress += mg.speed * dt * 20;

        if (Input.justClicked) {
            mg.clicks++;
            mg.progress += 15;
            Audio.playRepair();
        }

        if (mg.progress >= mg.target || mg.clicks >= mg.needed) {
            mg.done = true;
            this.miniGame = null;
            this.notification = { text: 'Ремонт завершён!', color: '#4ecdc4', timer: 2 };
        }
    },

    render() {
        Renderer.drawGradientBg('#1a1a2e', '#0f3460');

        // Заголовок
        Renderer.drawText('МАСТЕРСКАЯ', 640, 30, {
            color: '#f39c12', size: 36, align: 'center', bold: true
        });

        // Баланс
        Renderer.drawText(Utils.formatMoney(Game.player.money), 1200, 30, {
            color: '#4ecdc4', size: 20, align: 'right'
        });

        // Назад
        Renderer.drawButton(20, 20, 120, 40, '← Гараж', {
            color: '#0f3460', textSize: 16
        });

        if (!this.car) {
            Renderer.drawText('Нет выбранного авто', 640, 360, {
                color: '#888', size: 22, align: 'center'
            });
            return;
        }

        // Авто
        Renderer.drawCarIcon(900, 250, 4, this.car.color);
        Renderer.drawText(this.car.fullName, 900, 320, {
            color: '#fff', size: 24, align: 'center', bold: true
        });
        Renderer.drawText(`Состояние: ${Math.floor(this.car.condition)}%`, 900, 350, {
            color: '#4ecdc4', size: 16, align: 'center'
        });
        Renderer.drawProgressBar(780, 375, 240, 12, this.car.condition / 100);

        // Мини-игра
        if (this.miniGame) {
            this._renderMiniGame();
            return;
        }

        // Список повреждений
        Renderer.drawText('Повреждения:', 60, 110, {
            color: '#fff', size: 20, bold: true
        });

        for (let i = 0; i < this.damages.length; i++) {
            const d = this.damages[i];
            const y = 150 + i * 90;

            const bgColor = d.repaired ? '#1a3a2e' : '#1a1a2e';
            const borderColor = d.repaired ? '#4ecdc4' : '#f39c12';
            Renderer.drawPanel(60, y, 600, 80, { color: bgColor, borderColor });

            Renderer.drawText(d.name, 80, y + 10, {
                color: d.repaired ? '#4ecdc4' : '#fff', size: 18, bold: true
            });
            Renderer.drawText(`Серьёзность: ${d.severity}%`, 80, y + 35, {
                color: '#aaa', size: 14
            });

            if (d.repaired) {
                Renderer.drawText('✓ Починено', 550, y + 30, {
                    color: '#4ecdc4', size: 16, align: 'right'
                });
            } else {
                Renderer.drawText(Utils.formatMoney(d.cost), 550, y + 10, {
                    color: '#f39c12', size: 18, align: 'right', bold: true
                });
                Renderer.drawText('Нажми для ремонта', 550, y + 35, {
                    color: '#888', size: 12, align: 'right'
                });
            }
        }

        // Уведомление
        if (this.notification) {
            Renderer.drawRect(240, 650, 800, 40, this.notification.color, 10);
            Renderer.drawText(this.notification.text, 640, 660, {
                color: '#fff', size: 16, align: 'center', bold: true
            });
        }
    },

    _renderMiniGame() {
        const mg = this.miniGame;

        Renderer.drawPanel(200, 400, 880, 200, {
            color: '#0f1a2e', borderColor: '#f39c12', borderWidth: 3
        });

        Renderer.drawText('Нажимай быстрее для ремонта!', 640, 430, {
            color: '#fff', size: 22, align: 'center', bold: true
        });

        Renderer.drawProgressBar(250, 490, 780, 30, mg.progress / mg.target, '#f39c12');

        Renderer.drawText(`${Math.min(Math.floor(mg.progress), 100)}%`, 640, 540, {
            color: '#fff', size: 28, align: 'center', bold: true
        });
    }
};
