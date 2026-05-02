// Full react-native web shim — covers all APIs imported by expo and its deps.
// This runs in the browser; none of the native implementations are needed.

// ─── EventEmitter ────────────────────────────────────────────────────────────
export class NativeEventEmitter {
  addListener(_event: string, _handler: (...args: any[]) => void) {
    return { remove: () => {} };
  }
  removeAllListeners(_event: string) {}
  emit(_event: string, ..._args: any[]) {}
}

// ─── Platform ────────────────────────────────────────────────────────────────
export const Platform = {
  OS: 'web' as const,
  select: (objs: Record<string, any>) => objs.web ?? objs.default,
  Version: 1,
  isPad: false,
  isTV: false,
  isTesting: false,
  constants: { reactNativeVersion: { major: 0, minor: 76, patch: 0 } },
};

// ─── StyleSheet ──────────────────────────────────────────────────────────────
export const StyleSheet = {
  create: (s: any) => s,
  flatten: (s: any) => s,
  hairlineWidth: 1,
  absoluteFill: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  absoluteFillObject: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
};

// ─── AppRegistry ─────────────────────────────────────────────────────────────
export const AppRegistry = {
  registerComponent: (_key: string, _getComponent: () => any) => {},
  registerRunnable: (_key: string, _run: () => void) => {},
  runApplication: (_key: string, _appParameters: any) => {},
  unmountApplicationComponentAtRootTag: (_tag: number) => {},
};

// ─── LogBox ──────────────────────────────────────────────────────────────────
export const LogBox = {
  ignoreLogs: (_patterns: (string | RegExp)[]) => {},
  ignoreAllLogs: (_value?: boolean) => {},
  install: () => {},
  uninstall: () => {},
};

// ─── Dimensions ──────────────────────────────────────────────────────────────
export const Dimensions = {
  get: (_dim: 'window' | 'screen') => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 375,
    height: typeof window !== 'undefined' ? window.innerHeight : 812,
    scale: 1,
    fontScale: 1,
  }),
  addEventListener: (_event: string, _handler: any) => ({ remove: () => {} }),
  removeEventListener: (_event: string, _handler: any) => {},
};

// ─── PixelRatio ───────────────────────────────────────────────────────────────
export const PixelRatio = {
  get: () => (typeof window !== 'undefined' ? window.devicePixelRatio : 1),
  getFontScale: () => 1,
  getPixelSizeForLayoutSize: (size: number) => size,
  roundToNearestPixel: (size: number) => size,
};

// ─── Appearance ──────────────────────────────────────────────────────────────
export const Appearance = {
  getColorScheme: () => 'light' as 'light' | 'dark' | null,
  addChangeListener: (_listener: any) => ({ remove: () => {} }),
};

// ─── UI components ───────────────────────────────────────────────────────────
export const View = 'div';
export const Text = 'span';
export const Image = 'img';
export const ScrollView = 'div';
export const FlatList = 'div';
export const SectionList = 'div';
export const TouchableOpacity = 'button';
export const TouchableHighlight = 'button';
export const TouchableWithoutFeedback = 'div';
export const Pressable = 'button';
export const TextInput = 'input';
export const Modal = 'div';
export const ActivityIndicator = 'div';
export const SafeAreaView = 'div';
export const KeyboardAvoidingView = 'div';
export const StatusBar = 'div';
export const Switch = 'input';
export const Slider = 'input';
export const RefreshControl = 'div';
export const VirtualizedList = 'div';

// ─── APIs ─────────────────────────────────────────────────────────────────────
export const Alert = {
  alert: (_title: string, _message?: string, _buttons?: any[]) => {
    if (typeof window !== 'undefined') window.alert(_title);
  },
  prompt: () => {},
};

export const Linking = {
  openURL: async (url: string) => { window.open(url, '_blank'); },
  canOpenURL: async (_url: string) => true,
  getInitialURL: async () => null,
  addEventListener: (_event: string, _handler: any) => ({ remove: () => {} }),
  removeEventListener: () => {},
};

export const NativeModules = {};

export const Keyboard = {
  dismiss: () => {},
  addListener: (_event: string, _handler: any) => ({ remove: () => {} }),
  removeAllListeners: (_event: string) => {},
};

export const Animated = {
  Value: class {
    _value: number;
    constructor(v: number) { this._value = v; }
    setValue(v: number) { this._value = v; }
    interpolate() { return this; }
    addListener() { return { remove: () => {} }; }
    removeAllListeners() {}
  },
  ValueXY: class {
    x: any; y: any;
    constructor() {
      this.x = new (Animated.Value as any)(0);
      this.y = new (Animated.Value as any)(0);
    }
  },
  timing: (_value: any, _config: any) => ({ start: (cb?: any) => cb?.(), stop: () => {}, reset: () => {} }),
  spring: (_value: any, _config: any) => ({ start: (cb?: any) => cb?.(), stop: () => {}, reset: () => {} }),
  decay: (_value: any, _config: any) => ({ start: (cb?: any) => cb?.(), stop: () => {}, reset: () => {} }),
  sequence: (_anims: any[]) => ({ start: (cb?: any) => cb?.(), stop: () => {}, reset: () => {} }),
  parallel: (_anims: any[]) => ({ start: (cb?: any) => cb?.(), stop: () => {}, reset: () => {} }),
  stagger: (_delay: number, _anims: any[]) => ({ start: (cb?: any) => cb?.(), stop: () => {}, reset: () => {} }),
  loop: (_anim: any) => ({ start: (cb?: any) => cb?.(), stop: () => {}, reset: () => {} }),
  event: (_mapping: any[]) => () => {},
  createAnimatedComponent: (Component: any) => Component,
  View: 'div',
  Text: 'span',
  Image: 'img',
  ScrollView: 'div',
  FlatList: 'div',
};

export const PanResponder = {
  create: (_config: any) => ({ panHandlers: {} }),
};

export const Easing = {
  linear: (t: number) => t,
  ease: (t: number) => t,
  quad: (t: number) => t * t,
  cubic: (t: number) => t * t * t,
  in: (easing: any) => easing,
  out: (easing: any) => easing,
  inOut: (easing: any) => easing,
  bezier: () => (t: number) => t,
  circle: (t: number) => t,
  sin: (t: number) => t,
  exp: (t: number) => t,
  elastic: () => (t: number) => t,
  bounce: (t: number) => t,
  back: () => (t: number) => t,
  step0: (t: number) => t,
  step1: (t: number) => t,
};

export const I18nManager = {
  isRTL: false,
  allowRTL: () => {},
  forceRTL: () => {},
};

export const AccessibilityInfo = {
  isScreenReaderEnabled: async () => false,
  addEventListener: (_event: string, _handler: any) => ({ remove: () => {} }),
  announceForAccessibility: (_message: string) => {},
};

export const InteractionManager = {
  runAfterInteractions: (callback: () => void) => {
    setTimeout(callback, 0);
    return { cancel: () => {}, then: () => {}, done: () => {}, catch: () => {} };
  },
  createInteractionHandle: () => 0,
  clearInteractionHandle: () => {},
};

export const BackHandler = {
  addEventListener: (_event: string, _handler: any) => ({ remove: () => {} }),
  removeEventListener: () => {},
  exitApp: () => {},
};

export const Share = {
  share: async (_content: any, _options?: any) => ({ action: 'sharedAction' }),
};

export const Vibration = {
  vibrate: (_pattern?: any) => {},
  cancel: () => {},
};

export const Clipboard = {
  getString: async () => '',
  setString: (_content: string) => {},
};

// ─── Hooks ───────────────────────────────────────────────────────────────────
export function useColorScheme() { return 'light' as const; }
export function useWindowDimensions() {
  return {
    width: typeof window !== 'undefined' ? window.innerWidth : 375,
    height: typeof window !== 'undefined' ? window.innerHeight : 812,
    scale: 1,
    fontScale: 1,
  };
}

// ─── Default export ───────────────────────────────────────────────────────────
export default {
  Platform, StyleSheet, AppRegistry, LogBox, Dimensions, PixelRatio,
  Appearance, Alert, Linking, NativeModules, NativeEventEmitter, Keyboard,
  Animated, PanResponder, Easing, I18nManager, AccessibilityInfo,
  InteractionManager, BackHandler, Share, Vibration, Clipboard,
  View, Text, Image, ScrollView, FlatList, SectionList, TouchableOpacity,
  TouchableHighlight, TouchableWithoutFeedback, Pressable, TextInput,
  Modal, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, StatusBar,
  Switch, Slider, RefreshControl, VirtualizedList,
  useColorScheme, useWindowDimensions,
};
