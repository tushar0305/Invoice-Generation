import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.invoice.app',
  appName: 'Invoice App',
  webDir: 'out',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#ffffffff",
      androidSplashResourceName: "splash",
      showSpinner: true,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#999999",
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
