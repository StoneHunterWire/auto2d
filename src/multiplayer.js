// ============================================
// MULTIPLAYER - Кооперативный режим (соперники)
// ============================================
// Общий рынок, раздельные гаражи и балансы
// Оба игрока видят одни и те же авто на рынке
// Если один купил — авто исчезает у другого

const Multiplayer = {
    isConnected: false,
    isHost: false,
    roomId: null,
    peer: null,
    connection: null,
    opponentData: null,
    sharedMarket: [],
    marketSeed: 0,
    _callbacks: {},

    // Инициализация с PeerJS для P2P связи
    async init() {
        // Динамическая загрузка PeerJS
        if (!window.Peer) {
            await this._loadPeerJS();
        }
    },

    _loadPeerJS() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },

    // Создать комнату (хост)
    async createRoom() {
        await this.init();

        this.isHost = true;
        this.roomId = this._generateRoomCode();
        this.marketSeed = Date.now();

        return new Promise((resolve, reject) => {
            this.peer = new Peer('autoflip-' + this.roomId);

            this.peer.on('open', (id) => {
                console.log('Room created:', this.roomId);

                // Ждём подключения второго игрока
                this.peer.on('connection', (conn) => {
                    this.connection = conn;
                    this._setupConnection(conn);
                    
                    // Отправляем начальные данные
                    conn.on('open', () => {
                        this.isConnected = true;
                        this._send('init', {
                            marketSeed: this.marketSeed,
                            hostName: Game.player.name
                        });
                        if (this._callbacks.onPlayerJoined) {
                            this._callbacks.onPlayerJoined();
                        }
                        resolve(this.roomId);
                    });
                });

                resolve(this.roomId);
            });

            this.peer.on('error', (err) => {
                console.error('PeerJS error:', err);
                reject(err);
            });
        });
    },

    // Присоединиться к комнате
    async joinRoom(roomId) {
        await this.init();

        this.isHost = false;
        this.roomId = roomId;

        return new Promise((resolve, reject) => {
            this.peer = new Peer();

            this.peer.on('open', () => {
                const conn = this.peer.connect('autoflip-' + roomId);
                this.connection = conn;

                conn.on('open', () => {
                    this.isConnected = true;
                    this._setupConnection(conn);
                    resolve(true);
                });

                conn.on('error', (err) => {
                    reject(err);
                });
            });

            this.peer.on('error', (err) => {
                reject(err);
            });

            // Таймаут
            setTimeout(() => reject(new Error('Connection timeout')), 10000);
        });
    },

    _setupConnection(conn) {
        conn.on('data', (data) => {
            this._handleMessage(data);
        });

        conn.on('close', () => {
            this.isConnected = false;
            if (this._callbacks.onDisconnect) {
                this._callbacks.onDisconnect();
            }
        });
    },

    // Отправка сообщения
    _send(type, payload) {
        if (this.connection && this.connection.open) {
            this.connection.send({ type, payload, timestamp: Date.now() });
        }
    },

    // Обработка входящих сообщений
    _handleMessage(data) {
        const { type, payload } = data;

        switch (type) {
            case 'init':
                this.marketSeed = payload.marketSeed;
                this.opponentData = { name: payload.hostName };
                if (this._callbacks.onConnected) {
                    this._callbacks.onConnected(payload);
                }
                break;

            case 'market_buy':
                // Противник купил авто — убираем с рынка
                if (this._callbacks.onOpponentBuy) {
                    this._callbacks.onOpponentBuy(payload.carId);
                }
                break;

            case 'market_refresh':
                // Синхронное обновление рынка
                this.marketSeed = payload.seed;
                if (this._callbacks.onMarketRefresh) {
                    this._callbacks.onMarketRefresh(payload.seed);
                }
                break;

            case 'player_update':
                // Обновление данных противника (баланс, гараж и т.д.)
                this.opponentData = payload;
                if (this._callbacks.onOpponentUpdate) {
                    this._callbacks.onOpponentUpdate(payload);
                }
                break;

            case 'race_challenge':
                if (this._callbacks.onRaceChallenge) {
                    this._callbacks.onRaceChallenge(payload);
                }
                break;

            case 'race_accept':
                if (this._callbacks.onRaceAccept) {
                    this._callbacks.onRaceAccept(payload);
                }
                break;

            case 'race_data':
                if (this._callbacks.onRaceData) {
                    this._callbacks.onRaceData(payload);
                }
                break;

            case 'chat':
                if (this._callbacks.onChat) {
                    this._callbacks.onChat(payload);
                }
                break;
        }
    },

    // === API для игры ===

    // Уведомить о покупке авто
    notifyBuy(carId) {
        this._send('market_buy', { carId });
    },

    // Запросить обновление рынка
    requestMarketRefresh() {
        if (this.isHost) {
            this.marketSeed = Date.now();
            this._send('market_refresh', { seed: this.marketSeed });
            if (this._callbacks.onMarketRefresh) {
                this._callbacks.onMarketRefresh(this.marketSeed);
            }
        }
    },

    // Отправить обновление состояния игрока
    sendPlayerUpdate(playerData) {
        this._send('player_update', {
            name: playerData.name,
            money: playerData.money,
            garageCount: playerData.garage.length,
            totalProfit: playerData.totalProfit,
            level: playerData.level,
            carsSold: playerData.carsSold,
            racesWon: playerData.racesWon
        });
    },

    // Вызов на гонку
    challengeRace(carData) {
        this._send('race_challenge', carData);
    },

    // Принять вызов
    acceptRace(carData) {
        this._send('race_accept', carData);
    },

    // Данные гонки (позиция, скорость)
    sendRaceData(raceState) {
        this._send('race_data', raceState);
    },

    // Подписка на события
    on(event, callback) {
        this._callbacks[event] = callback;
    },

    // Отключение
    disconnect() {
        if (this.connection) this.connection.close();
        if (this.peer) this.peer.destroy();
        this.isConnected = false;
        this.isHost = false;
        this.roomId = null;
    },

    // Генерация кода комнаты
    _generateRoomCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 5; i++) {
            code += chars[Math.floor(Math.random() * chars.length)];
        }
        return code;
    }
};
