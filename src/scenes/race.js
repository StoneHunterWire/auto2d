// ============================================
// SCENE: RACE - 2D Top-Down гонки
// ============================================

const RaceScene = {
    car: null,
    state: 'countdown', // countdown, racing, finished
    countdown: 3,
    raceTime: 0,
    lap: 0,
    totalLaps: 3,

    // Игрок
    player: { x: 0, y: 0, angle: 0, speed: 0, lapProgress: 0 },
    // Противник (AI или онлайн)
    opponent: { x: 0, y: 0, angle: 0, speed: 0, lapProgress: 0, isAI: true },

    // Трасса
    track: null,
    cameraX: 0,
    cameraY: 0,

    notification: null,

    init() {
        this.car = Game.selectedCar;
        this.state = 'countdown';
        this.countdown = 3;
        this.raceTime = 0;
        this.lap = 0;
        this.notification = null;

        // Генерируем трассу
        this.track = this._generateTrack();

        // Стартовые позиции
        this.player = {
            x: this.track.startX,
            y: this.track.startY,
            angle: 0,
            speed: 0,
            lapProgress: 0,
            lapCount: 0
        };

        this.opponent = {
            x: this.track.startX + 50,
            y: this.track.startY + 30,
            angle: 0,
            speed: 0,
            lapProgress: 0,
            lapCount: 0,
            isAI: !Multiplayer.isConnected,
            targetPoint: 1
        };

        // Онлайн гонка
        if (Multiplayer.isConnected) {
            Multiplayer.on('onRaceData', (data) => {
                this.opponent.x = data.x;
                this.opponent.y = data.y;
                this.opponent.angle = data.angle;
                this.opponent.speed = data.speed;
                this.opponent.lapCount = data.lapCount;
            });
        }
    },

    _generateTrack() {
        // Простая овальная трасса с точками
        const cx = 1500;
        const cy = 1000;
        const rx = 600;
        const ry = 400;
        const points = [];

        for (let i = 0; i < 24; i++) {
            const angle = (i / 24) * Math.PI * 2;
            const wobble = Utils.randomFloat(0.9, 1.1);
            points.push({
                x: cx + Math.cos(angle) * rx * wobble,
                y: cy + Math.sin(angle) * ry * wobble
            });
        }

        return {
            points,
            width: 80,
            startX: points[0].x,
            startY: points[0].y,
            cx, cy
        };
    },

    update(dt) {
        if (this.notification) {
            this.notification.timer -= dt;
            if (this.notification.timer <= 0) this.notification = null;
        }

        // Назад (ESC или кнопка)
        if (Input.justClicked && Utils.isInRect(Input.clickX, Input.clickY, { x: 20, y: 20, w: 100, h: 40 })) {
            Audio.playClick();
            Game.setScene('garage');
            return;
        }

        if (this.state === 'countdown') {
            this.countdown -= dt;
            if (this.countdown <= 0) {
                this.state = 'racing';
            }
            return;
        }

        if (this.state === 'finished') return;

        this.raceTime += dt;

        // === Управление игрока ===
        this._updatePlayer(dt);

        // === AI противника ===
        if (this.opponent.isAI) {
            this._updateAI(dt);
        }

        // Отправка данных по сети
        if (Multiplayer.isConnected && this.state === 'racing') {
            Multiplayer.sendRaceData({
                x: this.player.x,
                y: this.player.y,
                angle: this.player.angle,
                speed: this.player.speed,
                lapCount: this.player.lapCount
            });
        }

        // Камера
        this.cameraX = this.player.x - 640;
        this.cameraY = this.player.y - 360;

        // Проверка кругов
        this._checkLaps();
    },

    _updatePlayer(dt) {
        const p = this.player;
        const carStats = this.car || { maxSpeed: 150, acceleration: 1, handling: 1, braking: 1 };

        const maxSpeed = carStats.maxSpeed * 1.5;
        const accel = carStats.acceleration * 200;
        const handling = carStats.handling * 3;
        const braking = carStats.braking * 300;

        // Управление
        if (Input.isKeyDown('ArrowUp') || Input.isKeyDown('KeyW')) {
            p.speed += accel * dt;
        } else if (Input.isKeyDown('ArrowDown') || Input.isKeyDown('KeyS')) {
            p.speed -= braking * dt;
        } else {
            p.speed *= 0.98; // Трение
        }

        // Тач управление — нажатие на экран = газ
        if (Input.isDown && !Input.isKeyDown('ArrowUp')) {
            p.speed += accel * 0.7 * dt;
            // Поворот к точке нажатия
            const targetAngle = Math.atan2(
                Input.y - 360,
                Input.x - 640
            );
            const diff = targetAngle - p.angle;
            p.angle += Math.sign(diff) * Math.min(Math.abs(diff), handling * dt);
        }

        p.speed = Utils.clamp(p.speed, -maxSpeed * 0.3, maxSpeed);

        // Поворот (клавиатура)
        if (Input.isKeyDown('ArrowLeft') || Input.isKeyDown('KeyA')) {
            p.angle -= handling * dt * (p.speed > 0 ? 1 : -1);
        }
        if (Input.isKeyDown('ArrowRight') || Input.isKeyDown('KeyD')) {
            p.angle += handling * dt * (p.speed > 0 ? 1 : -1);
        }

        // Движение
        p.x += Math.cos(p.angle) * p.speed * dt;
        p.y += Math.sin(p.angle) * p.speed * dt;

        // Звук мотора
        if (Math.abs(p.speed) > 10 && Math.random() < 0.1) {
            Audio.playEngine(Math.abs(p.speed));
        }
    },

    _updateAI(dt) {
        const ai = this.opponent;
        const points = this.track.points;
        const target = points[ai.targetPoint % points.length];

        const dx = target.x - ai.x;
        const dy = target.y - ai.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Поворот к цели
        const targetAngle = Math.atan2(dy, dx);
        const diff = targetAngle - ai.angle;
        ai.angle += Math.sign(diff) * Math.min(Math.abs(diff), 2.5 * dt);

        // Скорость AI
        const aiMaxSpeed = (this.car ? this.car.maxSpeed : 150) * Utils.randomFloat(0.85, 1.0);
        ai.speed = Utils.lerp(ai.speed, aiMaxSpeed, 0.02);

        // Движение
        ai.x += Math.cos(ai.angle) * ai.speed * dt;
        ai.y += Math.sin(ai.angle) * ai.speed * dt;

        // Переход к следующей точке
        if (dist < 80) {
            ai.targetPoint++;
            if (ai.targetPoint % points.length === 0) {
                ai.lapCount++;
            }
        }
    },

    _checkLaps() {
        const p = this.player;
        const startPoint = this.track.points[0];
        const dist = Utils.distance(p.x, p.y, startPoint.x, startPoint.y);

        // Простая проверка — проехал ли через старт
        if (dist < 100 && p.speed > 50 && this.raceTime > 5) {
            p.lapCount++;
            this.raceTime = 0; // Сброс для простоты

            if (p.lapCount >= this.totalLaps) {
                this._finishRace(true);
            }
        }

        // AI финиш
        if (this.opponent.lapCount >= this.totalLaps) {
            this._finishRace(false);
        }
    },

    _finishRace(playerWon) {
        this.state = 'finished';

        if (playerWon) {
            Game.player.racesWon++;
            const prize = Utils.random(10000, 50000);
            Game.player.money += prize;
            Game.player.xp += 100;
            this.notification = {
                text: `Победа! Приз: +${Utils.formatMoney(prize)}`,
                color: '#4ecdc4',
                timer: 10
            };
        } else {
            this.notification = {
                text: 'Поражение! Попробуй улучшить авто.',
                color: '#e94560',
                timer: 10
            };
        }

        Storage.saveGame(Game.player);
    },

    render() {
        // Фон трассы
        Renderer.clear('#2d5a27');

        const ctx = Renderer.ctx;
        ctx.save();
        ctx.translate(-this.cameraX, -this.cameraY);

        // Трасса
        this._renderTrack(ctx);

        // Противник
        this._renderCar(ctx, this.opponent, '#e94560');

        // Игрок
        this._renderCar(ctx, this.player, this.car ? this.car.color : '#4ecdc4');

        ctx.restore();

        // HUD
        this._renderHUD();

        // Отсчёт
        if (this.state === 'countdown') {
            const count = Math.ceil(this.countdown);
            Renderer.drawText(count > 0 ? String(count) : 'GO!', 640, 300, {
                color: '#fff', size: 120, align: 'center', baseline: 'middle', bold: true, shadow: true
            });
        }

        // Финиш
        if (this.state === 'finished' && this.notification) {
            Renderer.drawRect(200, 300, 880, 100, 'rgba(0,0,0,0.8)', 20);
            Renderer.drawText(this.notification.text, 640, 340, {
                color: this.notification.color, size: 28, align: 'center', bold: true
            });
            Renderer.drawButton(520, 370, 240, 40, 'Вернуться в гараж', {
                color: '#0f3460', textSize: 16
            });
        }

        // Кнопка назад
        Renderer.drawButton(20, 20, 100, 40, '← Выход', {
            color: 'rgba(15,52,96,0.8)', textSize: 14
        });
    },

    _renderTrack(ctx) {
        const points = this.track.points;

        // Дорога
        ctx.strokeStyle = '#555';
        ctx.lineWidth = this.track.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.closePath();
        ctx.stroke();

        // Центральная линия
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.setLineDash([20, 20]);
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);

        // Стартовая линия
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y - 40);
        ctx.lineTo(points[0].x, points[0].y + 40);
        ctx.stroke();
    },

    _renderCar(ctx, carObj, color) {
        ctx.save();
        ctx.translate(carObj.x, carObj.y);
        ctx.rotate(carObj.angle);

        // Тело
        ctx.fillStyle = color;
        ctx.fillRect(-20, -10, 40, 20);

        // Лобовое стекло
        ctx.fillStyle = 'rgba(100,200,255,0.5)';
        ctx.fillRect(10, -7, 8, 14);

        // Колёса
        ctx.fillStyle = '#222';
        ctx.fillRect(-18, -13, 10, 4);
        ctx.fillRect(-18, 9, 10, 4);
        ctx.fillRect(10, -13, 10, 4);
        ctx.fillRect(10, 9, 10, 4);

        ctx.restore();
    },

    _renderHUD() {
        // Скорость
        Renderer.drawPanel(540, 640, 200, 60, { color: 'rgba(0,0,0,0.7)' });
        Renderer.drawText(`${Math.floor(Math.abs(this.player.speed))} км/ч`, 640, 660, {
            color: '#fff', size: 24, align: 'center', bold: true
        });

        // Круг
        Renderer.drawText(`Круг: ${this.player.lapCount + 1}/${this.totalLaps}`, 640, 80, {
            color: '#fff', size: 20, align: 'center', bold: true, shadow: true
        });

        // Управление (подсказка)
        Renderer.drawText('WASD / Стрелки / Тач', 640, 700, {
            color: 'rgba(255,255,255,0.5)', size: 12, align: 'center'
        });
    }
};
