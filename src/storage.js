// ============================================
// STORAGE - Сохранение (localStorage)
// Yandex SDK будет добавлен позже
// ============================================

const Storage = {
    save(key, data) {
        try {
            localStorage.setItem('autoflip_' + key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Save failed:', e);
            return false;
        }
    },

    load(key) {
        try {
            const json = localStorage.getItem('autoflip_' + key);
            if (json) return JSON.parse(json);
        } catch (e) {
            console.error('Load failed:', e);
        }
        return null;
    },

    saveGame(playerData) {
        return this.save('gameState', playerData);
    },

    loadGame() {
        return this.load('gameState');
    }
};
