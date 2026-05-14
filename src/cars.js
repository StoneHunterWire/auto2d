// ============================================
// CARS - База данных автомобилей
// ============================================

const CarsDB = {
    // Марки и модели с базовыми характеристиками
    brands: [
        {
            name: 'Ваз',
            models: [
                { model: '2106', year: [1976, 1995], basePrice: 80000, maxSpeed: 140, icon: '#4a90d9' },
                { model: '2109', year: [1987, 2004], basePrice: 100000, maxSpeed: 160, icon: '#6ab04c' },
                { model: '2114', year: [2001, 2013], basePrice: 150000, maxSpeed: 170, icon: '#c0392b' },
                { model: 'Priora', year: [2007, 2018], basePrice: 220000, maxSpeed: 180, icon: '#8e44ad' },
                { model: 'Granta', year: [2011, 2023], basePrice: 350000, maxSpeed: 175, icon: '#2c3e50' }
            ]
        },
        {
            name: 'Toyota',
            models: [
                { model: 'Corolla', year: [2000, 2015], basePrice: 400000, maxSpeed: 190, icon: '#f39c12' },
                { model: 'Camry', year: [2005, 2020], basePrice: 800000, maxSpeed: 210, icon: '#1abc9c' },
                { model: 'Mark II', year: [1996, 2004], basePrice: 350000, maxSpeed: 220, icon: '#e74c3c' }
            ]
        },
        {
            name: 'BMW',
            models: [
                { model: 'E36', year: [1990, 2000], basePrice: 300000, maxSpeed: 230, icon: '#3498db' },
                { model: 'E46', year: [1998, 2006], basePrice: 450000, maxSpeed: 240, icon: '#2c3e50' },
                { model: 'E39', year: [1995, 2003], basePrice: 500000, maxSpeed: 250, icon: '#34495e' }
            ]
        },
        {
            name: 'Mercedes',
            models: [
                { model: 'W124', year: [1984, 1997], basePrice: 350000, maxSpeed: 220, icon: '#7f8c8d' },
                { model: 'W211', year: [2002, 2009], basePrice: 600000, maxSpeed: 240, icon: '#2c3e50' },
                { model: 'W220', year: [1998, 2005], basePrice: 500000, maxSpeed: 250, icon: '#1a1a2e' }
            ]
        },
        {
            name: 'Honda',
            models: [
                { model: 'Civic', year: [1998, 2012], basePrice: 350000, maxSpeed: 200, icon: '#e67e22' },
                { model: 'Accord', year: [2003, 2015], basePrice: 500000, maxSpeed: 210, icon: '#16a085' }
            ]
        },
        {
            name: 'Mitsubishi',
            models: [
                { model: 'Lancer', year: [2000, 2015], basePrice: 350000, maxSpeed: 200, icon: '#d35400' },
                { model: 'Galant', year: [1996, 2012], basePrice: 280000, maxSpeed: 210, icon: '#8e44ad' }
            ]
        }
    ],

    // Типы повреждений
    damageTypes: [
        { id: 'engine', name: 'Двигатель', repairCost: [15000, 80000], difficulty: 3 },
        { id: 'transmission', name: 'Коробка', repairCost: [10000, 60000], difficulty: 3 },
        { id: 'body', name: 'Кузов', repairCost: [5000, 40000], difficulty: 2 },
        { id: 'paint', name: 'Покраска', repairCost: [3000, 25000], difficulty: 1 },
        { id: 'suspension', name: 'Подвеска', repairCost: [5000, 30000], difficulty: 2 },
        { id: 'interior', name: 'Салон', repairCost: [3000, 20000], difficulty: 1 },
        { id: 'electrical', name: 'Электрика', repairCost: [5000, 35000], difficulty: 2 },
        { id: 'brakes', name: 'Тормоза', repairCost: [3000, 15000], difficulty: 1 }
    ],

    // Генерация случайного авто для рынка
    generateCar(priceRange = 'all') {
        const brand = Utils.randomFrom(this.brands);
        const modelData = Utils.randomFrom(brand.models);
        const year = Utils.random(modelData.year[0], modelData.year[1]);
        const age = 2024 - year;

        // Состояние зависит от возраста
        const baseCondition = Utils.clamp(100 - age * 3 - Utils.random(0, 20), 10, 85);

        // Видимые повреждения (то что видно при покупке)
        const visibleDamages = [];
        const numVisible = Utils.random(1, 3);
        const shuffledDamages = Utils.shuffle(this.damageTypes);
        for (let i = 0; i < numVisible; i++) {
            visibleDamages.push({
                ...shuffledDamages[i],
                severity: Utils.random(20, 80) // % серьёзности
            });
        }

        // Скрытые дефекты (сюрприз после покупки!)
        const hiddenDamages = [];
        if (Math.random() < 0.4) { // 40% шанс скрытого дефекта
            const hiddenCount = Utils.random(1, 2);
            for (let i = numVisible; i < numVisible + hiddenCount && i < shuffledDamages.length; i++) {
                hiddenDamages.push({
                    ...shuffledDamages[i],
                    severity: Utils.random(30, 90)
                });
            }
        }

        // Цена покупки (со скидкой из-за повреждений)
        const conditionFactor = baseCondition / 100;
        const ageFactor = Math.max(0.3, 1 - age * 0.04);
        const damageFactor = 1 - (visibleDamages.reduce((sum, d) => sum + d.severity, 0) / (numVisible * 100)) * 0.5;
        const buyPrice = Math.floor(modelData.basePrice * ageFactor * damageFactor * Utils.randomFloat(0.6, 0.9));

        // Рыночная стоимость в идеальном состоянии (для данного года)
        const marketPrice = Math.floor(modelData.basePrice * ageFactor * Utils.randomFloat(0.9, 1.2));

        // Рыночный спрос (влияет на скорость продажи)
        const demand = Utils.randomFloat(0.5, 1.5);

        return {
            id: Utils.generateId(),
            brand: brand.name,
            model: modelData.model,
            fullName: `${brand.name} ${modelData.model}`,
            year,
            condition: baseCondition,
            maxSpeed: modelData.maxSpeed * (baseCondition / 100),
            color: modelData.icon,
            buyPrice,
            marketPrice,
            demand,
            visibleDamages,
            hiddenDamages,
            hiddenRevealed: false,
            repaired: {},
            totalRepairCost: 0,
            // Характеристики для гонок
            acceleration: Utils.randomFloat(0.5, 1.5) * conditionFactor,
            handling: Utils.randomFloat(0.5, 1.5) * conditionFactor,
            braking: Utils.randomFloat(0.5, 1.5) * conditionFactor
        };
    },

    // Генерация рынка (набор авто для покупки)
    generateMarket(count = 6, seed = null) {
        // Если передан seed — генерируем одинаковый рынок для обоих игроков
        if (seed !== null) {
            const oldRandom = Math.random;
            let s = seed;
            Math.random = () => {
                s = (s * 1664525 + 1013904223) & 0xFFFFFFFF;
                return (s >>> 0) / 0xFFFFFFFF;
            };
            const cars = [];
            for (let i = 0; i < count; i++) {
                cars.push(this.generateCar());
            }
            Math.random = oldRandom;
            return cars;
        }

        const cars = [];
        for (let i = 0; i < count; i++) {
            cars.push(this.generateCar());
        }
        return cars;
    },

    // Рассчитать стоимость ремонта
    calculateRepairCost(damage) {
        const baseCost = Utils.random(damage.repairCost[0], damage.repairCost[1]);
        return Math.floor(baseCost * (damage.severity / 100));
    },

    // Рассчитать цену продажи после ремонта
    calculateSellPrice(car) {
        // Считаем текущее состояние
        let repairBonus = 0;
        const allDamages = [...car.visibleDamages, ...(car.hiddenRevealed ? car.hiddenDamages : [])];

        allDamages.forEach(d => {
            if (car.repaired[d.id]) {
                repairBonus += d.severity / 100 * 0.3; // Каждый ремонт добавляет к стоимости
            }
        });

        const finalCondition = Utils.clamp(car.condition + repairBonus * 100, 0, 100);
        const sellFactor = (finalCondition / 100) * car.demand;
        return Math.floor(car.marketPrice * sellFactor * Utils.randomFloat(0.85, 1.15));
    }
};
