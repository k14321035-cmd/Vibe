import React, { useEffect, useRef } from 'react';
import { isNative, showNativeBanner, hideNativeBanner } from '../lib/admob';

interface AdBannerProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

// Publisher ID: ca-pub-3806916534802053
// Replace SLOT_ID below with your actual ad unit slot from Google AdSense console
const PUBLISHER_ID = 'ca-pub-3806916534802053';       // data-ad-client  ✅
const BANNER_SLOT_ID = '4349550649';                   // data-ad-slot  ✅ (numeric only — full unit: ca-app-pub-3806916534802053/4349550649)

export default function AdBanner({ size = 'medium', className = '' }: AdBannerProps) {
  const adRef = useRef<HTMLModElement>(null);
  const initialized = useRef(false);

  const heightMap: Record<string, string> = {
    small: 'h-[60px]',
    medium: 'h-[90px]',
    large: 'h-[120px]',
  };

  useEffect(() => {
    if (isNative) {
      showNativeBanner();
      // On unmount, hide
      return () => {
        hideNativeBanner();
      };
    }

    if (!initialized.current && adRef.current) {
      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        initialized.current = true;
      } catch (e) {
        // AdSense not yet loaded
      }
    }
  }, []);

  if (isNative) {
    // Return empty spacer so it doesn't break layout if it was inline
    return <div className={`${heightMap[size]} flex-shrink-0 w-full ${className}`} />;
  }

  return (
    <div
      className={`relative overflow-hidden rounded-xl ${className}`}
      role="complementary"
      aria-label="Advertisement"
    >
      {/* Label */}
      <div className="absolute top-1 left-2 z-10">
        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest bg-black/40 px-1 py-0.5 rounded">
          Ad
        </span>
      </div>

      {/* Real AdSense ins tag */}
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block', minHeight: size === 'small' ? '60px' : size === 'large' ? '120px' : '90px' }}
        data-ad-client={PUBLISHER_ID}
        data-ad-slot={BANNER_SLOT_ID}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />

      {/* Fallback placeholder — shown while AdSense loads / in development */}
      <div
        className={`
          flex items-center justify-center gap-3
          bg-gradient-to-r from-gray-900/80 to-gray-800/80
          border border-white/5 rounded-xl
          ${heightMap[size]} w-full
          [.adsbygoogle[data-ad-status="filled"]~&]:hidden
        `}
        aria-hidden="true"
      >
        <div className="flex items-center gap-3 text-center">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/30 to-pink-500/30 flex items-center justify-center text-lg">
            📢
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-gray-300">Your Ad Here</p>
            <p className="text-[10px] text-gray-500">Powered by Google AdSense</p>
          </div>
        </div>
      </div>
    </div>
  );
}
