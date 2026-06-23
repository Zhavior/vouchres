import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.vouchedge.mlb",
  appName: "VouchEdge MLB",
  webDir: "dist",
  bundledWebRuntime: false,
  server: {
    // For development: uncomment to load from dev server
    // url: "http://192.168.1.100:5173",
    // cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: "#0A0E1A",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      iosSpinnerStyle: "small",
      spinnerColor: "#00D4FF",
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon",
      iconColor: "#00D4FF",
      sound: "beep.wav",
    },
  },
  ios: {
    contentInset: "always",
    backgroundColor: "#0A0E1A",
  },
  android: {
    backgroundColor: "#0A0E1A",
    allowMixedContent: false,
  },
};

export default config;
