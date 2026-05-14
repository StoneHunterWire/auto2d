// ============================================
// ADS - Заглушка (Yandex SDK будет добавлен позже)
// ============================================

const Ads = {
    // Полноэкранная реклама — пока просто вызываем callback
    showInterstitial(onComplete) {
        if (onComplete) onComplete();
    },

    // Rewarded реклама — пока просто даём награду
    showRewarded(onRewarded, onSkipped) {
        if (onRewarded) onRewarded();
    }
};
