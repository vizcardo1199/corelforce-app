const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
module.exports = (async () => {
    const config = await getDefaultConfig(__dirname);
    const { transformer, resolver } = config;

    config.transformer = {
        ...transformer,
        babelTransformerPath: require.resolve("react-native-svg-transformer"),
    };
    config.resolver = {
        ...resolver,
        assetExts: [
            ...resolver.assetExts.filter((ext) => ext !== "svg"),
            "ttf",
            "otf",
        ],
        sourceExts: [...resolver.sourceExts, "svg"],
    };

    return config;
})();

