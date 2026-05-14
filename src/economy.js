// ============================================
// ECONOMY - Экономическая система
// ============================================

const Economy = {
    // Начальный баланс игрока
    STARTING_MONEY: 500000,

    // Уровни игрока и их бонусы
    levels: [
        { level: 1, name: 'Новичок', xpNeeded: 0, marketSlots: 4, garageSlots: 3 },
        { level: 2, name: 'Любитель', xpNeeded: 500, marketSlots: 5, garageSlots: 4 },
        { level: 3, name: 'Перекупщик', xpNeeded: 1500, marketSlots: 6, garageSlots: 5 },
        { level: 4, name: 'Дилер', xpNeeded: 4000, marketSlots: 7, garageSlots: 6 },
        { level: 5, name: 'Магнат', xpNeeded: 10000, marketSlots: 8, garageSlots: 8 }
    ],

    // Создание нового профиля игрока
    createPlayer(name = 'Игрок') {
        return {
            name,
            money: this.STARTING_MONEY,
            xp: 0,
            level: 1,
            garage: [],
            totalProfit: 0,
            carsSold: 0,
            racesWon: 0,
            reputation: 50 // 0-100, влияет на предложения покупателей
        };
    },

    // Получить текущий уровень
    getLevel(xp) {
        let currentLevel = this.levels[0];
        for (const lvl of this.levels) {
            if (xp >= lvl.xpNeeded) {
                currentLevel = lvl;
            }
        }
        return currentLevel;
    },

    // Купить авто
    buyCar(player, car) {
        if (player.money < car.buyPrice) {
            return { success: false, reason: 'Недостаточно денег' };
        }

        const level = this.getLevel(player.xp);
        if (player.garage.length >= level.garageSlots) {
            return { success: false, reason: 'Гараж полон' };
        }

        player.money -= car.buyPrice;
        player.garage.push({ ...car, boughtFor: car.buyPrice });

        // Раскрываем скрытые дефекты с задержкой (в гараже)
        return { success: true, car };
    },

    // Продать авто
    sellCar(player, carId) {
        const carIndex = player.garage.findIndex(c => c.id === carId);
        if (carIndex === -1) {
            return { success: false, reason: 'Авто не найдено' };
        }

        const car = player.garage[carIndex];
        const sellPrice = CarsDB.calculateSellPrice(car);
        const profit = sellPrice - car.boughtFor - car.totalRepairCost;

        player.money += sellPrice;
        player.garage.splice(carIndex, 1);
        player.carsSold++;
        player.totalProfit += profit;

        // XP за продажу
        const xpGain = Math.max(10, Math.floor(profit / 1000));
        player.xp += xpGain;

        // Репутация
        if (profit > 0) {
            player.reputation = Utils.clamp(player.reputation + 2, 0, 100);
        } else {
            player.reputation = Utils.clamp(player.reputation - 1, 0, 100);
        }

        return {
            success: true,
            sellPrice,
            profit,
            xpGain
        };
    },

    // Ремонт повреждения
    repairDamage(player, carId, damageId) {
        const car = player.garage.find(c => c.id === carId);
        if (!car) return { success: false, reason: 'Авто не найдено' };

        const allDamages = [...car.visibleDamages, ...car.hiddenDamages];
        const damage = allDamages.find(d => d.id === damageId);
        if (!damage) return { success: false, reason: 'Повреждение не найдено' };
        if (car.repaired[damageId]) return { success: false, reason: 'Уже починено' };

        const cost = CarsDB.calculateRepairCost(damage);
        if (player.money < cost) {
            return { success: false, reason: 'Недостаточно денег' };
        }

        player.money -= cost;
        car.repaired[damageId] = true;
        car.totalRepairCost += cost;

        // Улучшаем состояние
        car.condition = Utils.clamp(car.condition + damage.severity * 0.3, 0, 100);

        // Улучшаем характеристики для гонок
        car.maxSpeed *= 1 + (damage.severity / 100) * 0.1;
        car.acceleration *= 1 + (damage.severity / 100) * 0.05;
        car.handling *= 1 + (damage.severity / 100) * 0.05;

        // XP за ремонт
        player.xp += Math.floor(cost / 2000);

        return { success: true, cost };
    },

    // Проверить выгодность покупки (AI подсказка для сложности)
    analyzeDeal(car) {
        const totalVisibleRepair = car.visibleDamages.reduce((sum, d) => {
            return sum + CarsDB.calculateRepairCost(d);
        }, 0);

        const estimatedSellPrice = car.marketPrice * (car.demand > 1 ? 0.9 : 0.7);
        const estimatedProfit = estimatedSellPrice - car.buyPrice - totalVisibleRepair;

        if (estimatedProfit > car.buyPrice * 0.3) return 'excellent';
        if (estimatedProfit > 0) return 'good';
        if (estimatedProfit > -car.buyPrice * 0.1) return 'risky';
        return 'bad';
    }
};
