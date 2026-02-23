import { Capacitor } from '@capacitor/core';
import { 
  AdMob, 
  BannerAdOptions, 
  BannerAdSize, 
  BannerAdPosition, 
  RewardAdPluginEvents,
  InterstitialAdPluginEvents
} from '@capacitor-community/admob';

export const isNative = Capacitor.isNativePlatform();

// Full Ad Unit IDs from Google AdMob
const AD_UNITS = {
  banner: 'ca-app-pub-3806916534802053/4349550649',
  interstitial: 'ca-app-pub-3806916534802053/9080326085',
  rewarded: 'ca-app-pub-3806916534802053/3715125826'
};

export const initAdMob = async () => {
  if (isNative) {
    try {
      await AdMob.initialize({});
    } catch (e) {
      console.error('AdMob init failed', e);
    }
  }
};

export const showNativeBanner = async () => {
  if (!isNative) return;
  const options: BannerAdOptions = {
    adId: AD_UNITS.banner,
    adSize: BannerAdSize.BANNER,
    position: BannerAdPosition.BOTTOM_CENTER,
    margin: 0,
    isTesting: true // using test mode for development
  };
  try {
    await AdMob.showBanner(options);
  } catch (e) {
    console.error('AdMob show banner failed', e);
  }
};

export const hideNativeBanner = async () => {
  if (!isNative) return;
  try {
    await AdMob.hideBanner();
  } catch (e) {
    console.error('AdMob hide banner failed', e);
  }
};

export const showNativeInterstitial = async (onDismiss?: () => void): Promise<boolean> => {
  if (!isNative) return false;
  try {
    if (onDismiss) {
        // We only want this listener to trigger once per show
        const listener = await AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
            onDismiss();
            listener.remove();
        });
    }
    
    await AdMob.prepareInterstitial({ adId: AD_UNITS.interstitial, isTesting: true });
    await AdMob.showInterstitial();
    return true;
  } catch (e) {
    console.error('AdMob show interstitial failed', e);
    return false;
  }
};

export const showNativeRewarded = async (onReward: () => void, onClose: () => void): Promise<boolean> => {
  if (!isNative) return false;
  try {
    // Listen for reward
    const rewardListener = await AdMob.addListener(RewardAdPluginEvents.Rewarded, () => {
      onReward();
    });
    
    // Listen for dismissal
    const dismissListener = await AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
      onClose();
      rewardListener.remove();
      dismissListener.remove();
    });

    await AdMob.prepareRewardVideoAd({ adId: AD_UNITS.rewarded, isTesting: true });
    await AdMob.showRewardVideoAd();
    return true;
  } catch (e) {
    console.error('AdMob show rewarded failed', e);
    return false;
  }
};
