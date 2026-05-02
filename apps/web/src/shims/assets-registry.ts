// Stub for @react-native/assets-registry — not needed on web.
// Aliased in vite.config.ts to prevent esbuild from trying to parse
// the Flow-typed source in node_modules.

export type AssetDestPathResolver = 'android' | 'generic';

export interface PackagerAsset {
  __packager_asset: boolean;
  fileSystemLocation: string;
  httpServerLocation: string;
  width?: number;
  height?: number;
  scales: number[];
  hash: string;
  name: string;
  type: string;
}

const assets: PackagerAsset[] = [];

export function registerAsset(asset: PackagerAsset): number {
  assets.push(asset);
  return assets.length;
}

export function getAssetByID(id: number): PackagerAsset {
  return assets[id - 1];
}
