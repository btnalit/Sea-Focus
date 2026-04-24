import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.seafocus.app',
  appName: 'Sea Focus',
  webDir: 'dist',
  plugins: {
    LocalNotifications: {
      iconColor: '#7C8363',
    },
  },
};

export default config;
