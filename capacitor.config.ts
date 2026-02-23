import { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: 'com.vibezone.app',
  appName: 'VibeZone',
  webDir: 'dist',
  server: {
    url: 'https://vibezon-frontend.onrender.com',
    cleartext: true
  },
  android: { allowMixedContent: true }
};
export default config;
