import React, { useState, useEffect, useRef, useCallback } from 'react';
import { isNative, showNativeRewarded } from '../lib/admob';

// Publisher ID: ca-pub-3806916534802053
// Replace SLOT_ID with your Rewarded ad unit slot from Google AdSense / AdMob console
const PUBLISHER_ID = 'ca-pub-3806916534802053';       // data-ad-client  ✅
const REWARDED_SLOT_ID = '3715125826';                 // data-ad-slot  ✅ (numeric only — full unit: ca-app-pub-3806916534802053/3715125826)

const AD_DURATION_SECONDS = 15;
const SKIP_AFTER_SECONDS = 5;

interface AdRewardedProps {
  onClose: () => void;
  onReward: () => void;
  rewardLabel?: string;
}

type AdState = 'idle' | 'loading' | 'playing' | 'complete';

export default function AdRewarded({ onClose, onReward, rewardLabel = 'Bonus Power-Up' }: AdRewardedProps) {
  const [adState, setAdState] = useState<AdState>('loading');
  const [elapsed, setElapsed] = useState(0);
  const [canSkip, setCanSkip] = useState(false);
  const [rewarded, setRewarded] = useState(false);
  const adRef = useRef<HTMLModElement>(null);
  const initialized = useRef(false);

  // Simulate ad loading then playing
  useEffect(() => {
    if (isNative) {
      showNativeRewarded(
        () => { onReward(); },
        () => { onClose(); }
      );
      return;
    }
    const loadTimeout = setTimeout(() => setAdState('playing'), 1200);
    return () => clearTimeout(loadTimeout);
  }, []);

  // Push AdSense rewarded ad
  useEffect(() => {
    if (isNative) return;
    if (!initialized.current && adRef.current) {
      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        initialized.current = true;
      } catch (e) { /* AdSense not loaded */ }
    }
  }, []);

  // Timer during play
  useEffect(() => {
    if (isNative) return;
    if (adState !== 'playing') return;
    if (elapsed >= AD_DURATION_SECONDS) {
      setAdState('complete');
      setRewarded(true);
      onReward();
      return;
    }
    if (elapsed >= SKIP_AFTER_SECONDS) setCanSkip(true);
    const timer = setTimeout(() => setElapsed(e => e + 1), 1000);
    return () => clearTimeout(timer);
  }, [adState, elapsed, onReward]);

  const handleSkip = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleCollect = useCallback(() => {
    onClose();
  }, [onClose]);

  const progress = Math.min((elapsed / AD_DURATION_SECONDS) * 100, 100);
  const remaining = Math.max(AD_DURATION_SECONDS - elapsed, 0);

  if (isNative) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Rewarded Advertisement"
    >
      <div className="absolute inset-0 bg-black/95 backdrop-blur-lg" />

      <div className="relative w-full max-w-sm mx-4 rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-purple-500/20">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-black/70 border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-base">🎁</span>
            <span className="text-xs font-black text-indigo-300 uppercase tracking-widest">Rewarded Ad</span>
          </div>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Sponsored</span>
        </div>

        {/* Loading State */}
        {adState === 'loading' && (
          <div className="bg-gradient-to-br from-slate-900 to-indigo-900/30 min-h-[280px] flex flex-col items-center justify-center gap-4 p-8">
            <div className="w-12 h-12 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
            <p className="text-sm text-gray-400 font-medium">Loading your reward...</p>
          </div>
        )}

        {/* Playing State */}
        {adState === 'playing' && (
          <>
            {/* AdSense slot */}
            <ins
              ref={adRef}
              className="adsbygoogle"
              style={{ display: 'block', minHeight: '200px' }}
              data-ad-client={PUBLISHER_ID}
              data-ad-slot={REWARDED_SLOT_ID}
              data-ad-format="auto"
              data-full-width-responsive="true"
            />

            {/* Animated Placeholder Ad Creative */}
            <div className="relative bg-gradient-to-br from-purple-900/60 via-slate-900 to-indigo-900/60 min-h-[240px] flex flex-col items-center justify-center p-8 text-center overflow-hidden">
              {/* Pulsing BG orbs */}
              <div className="absolute top-4 left-4 w-24 h-24 bg-purple-500/20 rounded-full blur-2xl animate-pulse" />
              <div className="absolute bottom-4 right-4 w-20 h-20 bg-pink-500/20 rounded-full blur-xl animate-pulse [animation-delay:0.5s]" />

              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-2xl mb-4 mx-auto shadow-lg shadow-purple-500/40 animate-bounce [animation-duration:2s]">
                  💎
                </div>
                <h3 className="text-lg font-black text-white mb-1">Premium Offer</h3>
                <p className="text-xs text-gray-400 max-w-[200px] mb-3">
                  Watch till the end to claim your <span className="text-indigo-300 font-bold">{rewardLabel}</span>
                </p>
                <div className="flex items-center gap-2 justify-center">
                  <div className="h-1.5 flex-1 bg-gray-800 rounded-full overflow-hidden max-w-[140px]">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-400 min-w-[28px]">{remaining}s</span>
                </div>
              </div>
            </div>

            {/* Skip / Wait controls */}
            <div className="bg-black/70 px-4 py-3 flex items-center justify-between border-t border-white/5">
              <p className="text-[10px] text-gray-600">Ads by Google</p>
              {canSkip ? (
                <button
                  onClick={handleSkip}
                  className="text-xs text-gray-400 hover:text-white font-semibold transition-colors"
                  aria-label="Skip ad"
                >
                  Skip →
                </button>
              ) : (
                <span className="text-xs text-gray-600 font-medium">
                  Skip in {Math.max(SKIP_AFTER_SECONDS - elapsed, 0)}s
                </span>
              )}
            </div>
          </>
        )}

        {/* Complete / Reward State */}
        {adState === 'complete' && (
          <div className="bg-gradient-to-br from-slate-900 via-green-900/20 to-slate-900 p-8 text-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-3xl mx-auto mb-4 shadow-xl shadow-green-500/30 animate-bounce [animation-duration:1s] [animation-iteration-count:3]">
              🎉
            </div>
            <h3 className="text-xl font-black text-white mb-1">Reward Earned!</h3>
            <p className="text-sm text-gray-400 mb-6">
              You unlocked: <span className="text-green-400 font-bold">{rewardLabel}</span>
            </p>
            <button
              onClick={handleCollect}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-black rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-green-500/20"
            >
              🎁 Collect Reward
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
