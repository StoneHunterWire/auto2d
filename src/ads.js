// ============================================
// ADS - Реклама Yandex Games SDK
// ============================================

const Ads = {
    _ysdk: null,
    _lastAdTime: 0,
    _minInterval: 60000, // Минимум 60 сек между рекламой

    init(ysdk) {
        this._ysdk = ysdk;
    },

    // Полноэкранная реклама (между действиями)
    showInterstitial(onComplete) {
        const now = Date.now();
        if (now - this._lastAdTime < this._minInterval) {
            if (onComplete) onComplete();
            return;
        }

        if (!this._ysdk) {
            if (onComplete) onComplete();
            return;
        }

        this._ysdk.adv.showFullscreenAdv({
            callbacks: {
                onOpen: () => {
                    Audio.pauseAll();
                },
                onClose: (wasShown) => {
                    Audio.resumeAll();
                    this._lastAdTime = Date.now();
                    if (onComplete) onComplete();
                },
                onError: (error) => {
                    console.warn('Ad error:', error);
                    if (onComplete) onComplete();
                }
            }
        });
    },

    // Rewarded реклама (за бонус)
    showRewarded(onRewarded, onSkipped) {
        if (!this._ysdk) {
            if (onRewarded) onRewarded();
            return;
        }

        this._ysdk.adv.showRewardedVideo({
            callbacks: {
                onOpen: () => {
                    Audio.pauseAll();
                },
                onRewarded: () => {
                    if (onRewarded) onRewarded();
                },
                onClose: () => {
                    Audio.resumeAll();
                },
                onError: (error) => {
                    console.warn('Rewarded ad error:', error);
                    if (onSkipped) onSkipped();
                }
            }
        });
    }
};
