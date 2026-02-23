import React, { useEffect, useRef } from 'react';

// Publisher ID: ca-pub-3806916534802053
// Replace SLOT_ID below with your actual native/in-feed ad unit slot ID from Google AdSense
const PUBLISHER_ID = 'ca-pub-3806916534802053';       // data-ad-client  ✅
const NATIVE_SLOT_ID = '6592570608';                   // data-ad-slot  ✅ (numeric only — full unit: ca-app-pub-3806916534802053/6592570608)

interface AdNativeProps {
  className?: string;
  [key: string]: unknown;
}

export default function AdNative({ className = '' }: AdNativeProps) {
  const adRef = useRef<HTMLModElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
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

  return (
    <div
      className={`group bg-gradient-to-br from-indigo-900/20 to-pink-900/20 border border-indigo-500/20 hover:border-indigo-500/40 rounded-2xl overflow-hidden transition-all ${className}`}
      role="complementary"
      aria-label="Sponsored content"
    >
      {/* Real AdSense in-feed unit */}
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-format="fluid"
        data-ad-layout-key="-6t+ed+2i-1n-4w"
        data-ad-client={PUBLISHER_ID}
        data-ad-slot={NATIVE_SLOT_ID}
      />

      {/* Fallback placeholder styled like a room card */}
      <div className="p-5" aria-hidden="true">
        <div className="flex justify-between items-start mb-3">
          <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300">
            🌟 Sponsored
          </span>
          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest bg-black/30 px-1.5 py-0.5 rounded">
            Ad
          </span>
        </div>
        <h3 className="text-base font-bold mb-2 text-gray-200 group-hover:text-indigo-300 transition-colors">
          Discover Something Amazing
        </h3>
        <p className="text-xs text-gray-400 mb-4 leading-relaxed">
          Upgrade your experience with premium features. Join millions of users worldwide.
        </p>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">ads.google.com</span>
          <button
            className="bg-gradient-to-r from-indigo-500/80 to-pink-500/80 hover:from-indigo-500 hover:to-pink-500 text-white px-4 py-1.5 rounded-lg font-semibold text-xs transition-all"
            onClick={() => { /* Ad click handled by AdSense */ }}
          >
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
}
