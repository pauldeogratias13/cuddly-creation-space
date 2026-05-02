
// Cross-platform shim for Platform detection
const getPlatform = () => {
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    return 'web';
  }
  // Fallback to react-native Platform if available (native side)
  try {
    const { Platform } = require('react-native');
    return Platform.OS;
  } catch {
    return 'ios'; // Default fallback
  }
};

export const isWeb = getPlatform() === 'web';

export const Platform = {
  OS: getPlatform(),
  Version: 1,
  select: (objs: any) => {
    const os = getPlatform();
    return objs[os] || objs.default;
  },
};
