import React, { useState, useEffect, useRef, useCallback } from 'react';
import { isNative, showNativeInterstitial } from '../lib/admob';

// Publisher ID: ca-pub-3806916534802053
// Replace SLOT_ID with your Interstitial ad unit slot from Google AdSense console
const PUBLISHER_ID = 'ca-pub-3806916534802053';       // data-ad-client  ✅
const INTERSTITIAL_SLOT_ID = '9080326085';             // data-ad-slot  ✅ (numeric only — full unit: ca-app-pub-3806916534802053/9080326085)

const SKIP_AFTER_SECONDS = 5;

interface AdInterstitialProps {
  onClose: () => void;
  /** Called when the user dismisses/skips the ad — proceed with intended action */
  onSkip: () => void;
}

export default function AdInterstitial({ onClose, onSkip }: AdInterstitialProps) {
  const [countdown, setCountdown] = useState(SKIP_AFTER_SECONDS);
  const [canSkip, setCanSkip] = useState(false);
  const adRef = useRef<HTMLModElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (isNative) {
      showNativeInterstitial(() => {
        onSkip();
        onClose();
      });
      return;
    }

    // Push AdSense interstitial
    if (!initialized.current && adRef.current) {
      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        initialized.current = true;
      } catch (e) {
        // AdSense not loaded
      }
    }

    // Countdown timer
    if (countdown <= 0) {
      setCanSkip(true);
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSkip = useCallback(() => {
    onSkip();
    onClose();
  }, [onSkip, onClose]);

  // Auto-close after countdown hits 0
  useEffect(() => {
    if (isNative) return;
    if (countdown <= 0) setCanSkip(true);
  }, [countdown]);

  if (isNative) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Advertisement"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />

      {/* Ad Container */}
      <div className="relative w-full max-w-lg mx-4 rounded-3xl overflow-hidden shadow-2xl shadow-indigo-500/20 border border-white/10">

        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-black/60 border-b border-white/5">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Advertisement</span>
          <div className="flex items-center gap-2">
            {canSkip ? (
              <button
                onClick={handleSkip}
                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full transition-all hover:scale-105 active:scale-95"
                aria-label="Skip advertisement"
              >
                Skip Ad →
              </button>
            ) : (
              <div className="flex items-center gap-1.5 bg-gray-800/80 text-gray-400 text-xs font-bold px-3 py-1.5 rounded-full">
                <div
                  className="w-4 h-4 rounded-full border-2 border-gray-600 flex items-center justify-center text-[9px] font-black"
                  style={{
                    background: `conic-gradient(#6366f1 ${((SKIP_AFTER_SECONDS - countdown) / SKIP_AFTER_SECONDS) * 360}deg, transparent 0deg)`,
                  }}
                >
                </div>
                Skip in {countdown}s
              </div>
            )}
          </div>
        </div>

        {/* Real AdSense Ad */}
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: 'block', minHeight: '250px' }}
          data-ad-client={PUBLISHER_ID}
          data-ad-slot={INTERSTITIAL_SLOT_ID}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />

        {/* Fallback Placeholder */}
        <div
          className="relative bg-gradient-to-br from-slate-900 via-indigo-900/40 to-slate-900 min-h-[320px] flex flex-col items-center justify-center p-8 text-center"
          aria-hidden="true"
        >
          {/* Decorative glows */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-pink-500/10 rounded-full blur-2xl" />

          <div className="relative z-10">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-400 to-pink-500 rounded-2xl flex items-center justify-center text-3xl mb-5 mx-auto shadow-xl shadow-indigo-500/30">
              🚀
            </div>
            <h3 className="text-2xl font-black text-white mb-2">Supercharge Your App</h3>
            <p className="text-sm text-gray-400 max-w-xs mb-6 leading-relaxed">
              Discover tools that help you build, grow, and monetize your products faster than ever.
            </p>
            <div className="flex gap-2 justify-center">
              <div className="flex items-center gap-1.5 bg-green-500/20 text-green-400 text-xs font-bold px-3 py-1.5 rounded-full">
                ✓ Free Trial
              </div>
              <div className="flex items-center gap-1.5 bg-blue-500/20 text-blue-400 text-xs font-bold px-3 py-1.5 rounded-full">
                ✓ No Credit Card
              </div>
            </div>
          </div>

          {/* Progress bar at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-800">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 transition-all duration-1000"
              style={{ width: `${((SKIP_AFTER_SECONDS - countdown) / SKIP_AFTER_SECONDS) * 100}%` }}
            />
          </div>
        </div>

        {/* Bottom label */}
        <div className="bg-black/60 px-4 py-2 text-center">
          <p className="text-[10px] text-gray-600">
            Ads by Google · <span className="text-gray-500">AdSense</span>
          </p>
        </div>
      </div>
    </div>
  );
}
