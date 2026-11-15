const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
const config = getDefaultConfig(__dirname);
const schemas = path.resolve(__dirname, "../packages/schemas");
config.watchFolders = [schemas];
config.resolver.extraNodeModules = { "@icu/schemas": path.join(schemas, "src") };
config.resolver.nodeModulesPaths = [path.resolve(__dirname, "node_modules")];
module.exports = config;
