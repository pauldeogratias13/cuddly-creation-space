
// Generic Expo shim to satisfy web builds
export const registerRootComponent = () => {};
export const Constants = { expoConfig: {} };
export const Device = { isDevice: false };
export const Camera = {};
export const FileSystem = {
  documentDirectory: '/',
  cacheDirectory: '/',
  getInfoAsync: async () => ({ exists: false }),
};
export const Notifications = {
  requestPermissionsAsync: async () => ({ status: 'denied' }),
  getExpoPushTokenAsync: async () => ({ data: '' }),
};
export const SecureStore = {
  setItemAsync: async () => {},
  getItemAsync: async () => null,
  deleteItemAsync: async () => {},
};
export const Sharing = { isAvailableAsync: async () => false };
export const Linking = {
  createURL: () => '',
  parse: (url: string) => ({ hostname: '', path: [] }),
};

export default {
  registerRootComponent,
  Constants,
  Device,
  Camera,
  FileSystem,
  Notifications,
  SecureStore,
  Sharing,
  Linking,
};
