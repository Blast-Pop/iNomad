module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Reanimated 4 ships its worklets implementation in a separate package.
    // The plugin must be listed last per the upstream docs.
    plugins: ['react-native-worklets/plugin'],
  };
};
