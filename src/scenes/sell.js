// ============================================
// SCENE: SELL - Продажа авто
// ============================================

const SellScene = {
    car: null,
    offers: [],
    notification: null,
    timer: 0,
    offerInterval: 3, // Новое предложение каждые 3 сек
    bestOffer: null,

    init() {
        this.car = Game.selectedCar;
        this.offers = [];
        this.notification = null;
        this.timer = 0;
        this.bestOffer = null;

        if (this.car) {
            this._generateInitialOffers();
        }
    },

    _generateInitialOffers() {
        const basePrice = CarsDB.calculateSellPrice(this.car);
        // 3 начальных предложения
        for (let i = 0; i < 3; i++) {
            this.offers.push(this._createOffer(basePrice));
        }
        this.offers.sort((a, b) => b.price - a.price);
    },

    _createOffer(basePrice) {
        const names = ['Антон', 'Сергей', 'Дмитрий', 'Алексей', 'Михаил', 'Павел', 'Николай', 'Ирина', 'Олег', 'Виктор'];
        const reasons = [
            'Хочу для работы', 'Первая машина для сына', 'На запчасти',
            'Для дрифта', 'Для жены', 'Для такси', 'Коллекция', 'Для дачи'
        ];

        const variation = Utils.randomFloat(0.6, 1.2);
        const reputationBonus = 1 + (Game.player.reputation - 50) / 200;
        const price = Math.floor(basePrice * variation * reputationBonus);

        return {
            id: Utils.generateId(),
            name: Utils.randomFrom(names),
            reason: Utils.randomFrom(reasons),
            price,
            expires: 15 + Utils.random(0, 15) // Секунд до истечения
        };
    },

    update(dt) {
        if (this.notification) {
            this.notification.timer -= dt;
            if (this.notification.timer <= 0) this.notification = null;
        }

        // Генерация новых предложений
        this.timer += dt;
        if (this.timer >= this.offerInterval && this.offers.length < 6) {
            this.timer = 0;
            const basePrice = CarsDB.calculateSellPrice(this.car);
            this.offers.push(this._createOffer(basePrice));
            this.offers.sort((a, b) => b.price - a.price);
        }

        // Истечение предложений
        this.offers.forEach(o => o.expires -= dt);
        this.offers = this.offers.filter(o => o.expires > 0);

        if (Input.justClicked) {
            const cx = Input.clickX;
            const cy = Input.clickY;

            // Назад
            if (Utils.isInRect(cx, cy, { x: 20, y: 20, w: 120, h: 40 })) {
                Audio.playClick();
                Game.setScene('garage');
                return;
            }

            // Принять предложение
            for (let i = 0; i < this.offers.length; i++) {
                const y = 200 + i * 80;
                if (Utils.isInRect(cx, cy, { x: 60, y, w: 700, h: 70 })) {
                    this._acceptOffer(this.offers[i]);
                    return;
                }
            }
        }
    },

    _acceptOffer(offer) {
        // Подставляем цену вручную
        const carIndex = Game.player.garage.findIndex(c => c.id === this.car.id);
        if (carIndex === -1) return;

        const car = Game.player.garage[carIndex];
        const profit = offer.price - car.boughtFor - car.totalRepairCost;

        Game.player.money += offer.price;
        Game.player.garage.splice(carIndex, 1);
        Game.player.carsSold++;
        Game.player.totalProfit += profit;
        Game.player.xp += Math.max(10, Math.floor(Math.abs(profit) / 1000));

        if (profit > 0) {
            Game.player.reputation = Utils.clamp(Game.player.reputation + 2, 0, 100);
        }

        Audio.playSell();
        Storage.saveGame(Game.player);

        if (Multiplayer.isConnected) {
            Multiplayer.sendPlayerUpdate(Game.player);
        }

        // Показываем реклама между продажами
        Ads.showInterstitial(() => {
            Game.setScene('garage');
        });

        this.notification = {
            text: profit >= 0
                ? `Продано! Прибыль: +${Utils.formatMoney(profit)}`
                : `Продано с убытком: ${Utils.formatMoney(profit)}`,
            color: profit >= 0 ? '#4ecdc4' : '#e94560',
            timer: 3
        };
    },

    render() {
        Renderer.drawGradientBg('#1a1a2e', '#16213e');

        Renderer.drawText('ПРОДАЖА', 640, 30, {
            color: '#4ecdc4', size: 36, align: 'center', bold: true
        });

        Renderer.drawButton(20, 20, 120, 40, '← Гараж', {
            color: '#0f3460', textSize: 16
        });

        if (!this.car) return;

        // Инфо о машине
        Renderer.drawPanel(800, 120, 400, 300, { color: '#0f1a2e' });
        Renderer.drawCarIcon(1000, 200, 3, this.car.color);
        Renderer.drawText(this.car.fullName, 1000, 260, {
            color: '#fff', size: 20, align: 'center', bold: true
        });
        Renderer.drawText(`Куплено: ${Utils.formatMoney(this.car.boughtFor)}`, 1000, 290, {
            color: '#888', size: 14, align: 'center'
        });
        Renderer.drawText(`Ремонт: ${Utils.formatMoney(this.car.totalRepairCost)}`, 1000, 310, {
            color: '#888', size: 14, align: 'center'
        });
        const total = this.car.boughtFor + this.car.totalRepairCost;
        Renderer.drawText(`Итого вложено: ${Utils.formatMoney(total)}`, 1000, 340, {
            color: '#f39c12', size: 16, align: 'center', bold: true
        });

        // Предложения покупателей
        Renderer.drawText('Предложения покупателей:', 60, 130, {
            color: '#fff', size: 20, bold: true
        });
        Renderer.drawText('(нажми чтобы принять)', 60, 160, {
            color: '#888', size: 14
        });

        for (let i = 0; i < this.offers.length; i++) {
            const offer = this.offers[i];
            const y = 200 + i * 80;
            const isHover = Utils.isInRect(Input.x, Input.y, { x: 60, y, w: 700, h: 70 });
            const profit = offer.price - total;

            Renderer.drawPanel(60, y, 700, 70, {
                color: isHover ? '#1e2a4a' : '#16213e',
                borderColor: profit > 0 ? '#4ecdc4' : '#e94560'
            });

            Renderer.drawText(offer.name, 80, y + 10, {
                color: '#fff', size: 16, bold: true
            });
            Renderer.drawText(`"${offer.reason}"`, 80, y + 32, {
                color: '#aaa', size: 13
            });

            // Цена
            Renderer.drawText(Utils.formatMoney(offer.price), 650, y + 15, {
                color: '#4ecdc4', size: 22, align: 'right', bold: true
            });

            // Прибыль/убыток
            const profitText = profit >= 0 ? `+${Utils.formatMoney(profit)}` : Utils.formatMoney(profit);
            Renderer.drawText(profitText, 650, y + 42, {
                color: profit >= 0 ? '#4ecdc4' : '#e94560', size: 14, align: 'right'
            });

            // Таймер
            const timeLeft = Math.ceil(offer.expires);
            Renderer.drawText(`${timeLeft}с`, 740, y + 30, {
                color: timeLeft < 5 ? '#e94560' : '#888', size: 12
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
