const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

if (!config.resolver.assetExts.includes('sql')) {
  config.resolver.assetExts.push('sql');
}

module.exports = withNativeWind(config, {
  input: './global.css',
});
