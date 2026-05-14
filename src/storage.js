// ============================================
// STORAGE - Сохранение через Yandex SDK
// ============================================

const Storage = {
    _player: null,
    _ysdk: null,

    async init(ysdk) {
        this._ysdk = ysdk;
        try {
            this._player = await ysdk.getPlayer();
        } catch (e) {
            console.warn('Player init failed, using localStorage fallback');
        }
    },

    async save(key, data) {
        const json = JSON.stringify(data);

        // Пробуем сохранить через Yandex
        if (this._player) {
            try {
                await this._player.setData({ [key]: json });
                return true;
            } catch (e) {
                console.warn('Yandex save failed:', e);
            }
        }

        // Fallback на localStorage
        try {
            localStorage.setItem('autoflip_' + key, json);
            return true;
        } catch (e) {
            console.error('LocalStorage save failed:', e);
            return false;
        }
    },

    async load(key) {
        // Пробуем загрузить через Yandex
        if (this._player) {
            try {
                const data = await this._player.getData([key]);
                if (data && data[key]) {
                    return JSON.parse(data[key]);
                }
            } catch (e) {
                console.warn('Yandex load failed:', e);
            }
        }

        // Fallback на localStorage
        try {
            const json = localStorage.getItem('autoflip_' + key);
            if (json) return JSON.parse(json);
        } catch (e) {
            console.error('LocalStorage load failed:', e);
        }

        return null;
    },

    async saveGame(playerData) {
        return this.save('gameState', playerData);
    },

    async loadGame() {
        return this.load('gameState');
    },

    // Лидерборд
    async submitScore(score) {
        if (!this._ysdk) return;
        try {
            const lb = await this._ysdk.getLeaderboards();
            await lb.setLeaderboardScore('totalProfit', score);
        } catch (e) {
            console.warn('Leaderboard submit failed:', e);
        }
    }
};
