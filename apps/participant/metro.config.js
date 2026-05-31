const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const defaultConfig = getDefaultConfig(__dirname);

// Fix Firebase .cjs resolution issue in Metro
defaultConfig.resolver.sourceExts.push('cjs');
defaultConfig.resolver.unstable_enablePackageExports = false;

// Monorepo: watch the shared package
const monorepoRoot = path.resolve(__dirname, '../..');
defaultConfig.watchFolders = [monorepoRoot];

module.exports = defaultConfig;
