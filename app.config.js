const IS_DEV = process.env.APP_VARIANT === "development";
const IS_PREVIEW = process.env.APP_VARIANT === "preview";

const getUniqueIdentifier = () => {
  if (IS_DEV) {
    return "com.designedbyap.onextid.dev";
  }

  if (IS_PREVIEW) {
    return "com.designedbyap.onextid.preview";
  }

  return "com.designedbyap.onextid";
};

const getAppName = () => {
  if (IS_DEV) {
    return "OnexTID (Dev)";
  }

  if (IS_PREVIEW) {
    return "OnexTID (Preview)";
  }

  return "OnexTID";
};

export default ({ config }) => ({
  ...config,
  name: getAppName(),
  slug: "onextid",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "onextid",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: getUniqueIdentifier(),
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    edgeToEdgeEnabled: true,
    package: getUniqueIdentifier(),
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
      },
    ],
    ["expo-font"],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: "034eec28-46c6-45b7-bb9f-2ca5cbb304e8",
    },
  },
  owner: "dev-apamal",
});
