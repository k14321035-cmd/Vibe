import { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: 'com.vibezone.app',
  appName: 'VibeZone',
  webDir: 'dist',
  android: { allowMixedContent: true },
  plugins: {
    AdMob: { appId: 'ca-app-pub-3806916534802053~6014490684' }
  }
};
export default config;
