// Stub for @react-native/assets-registry/registry subpath — not needed on web.
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
