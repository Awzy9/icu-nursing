// Lets the app import the shared workspace folders (types and synthetic fixtures) that live outside mobile/.
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const root = path.resolve(__dirname, "..");
const config = getDefaultConfig(__dirname);
config.watchFolders = [path.join(root, "packages")];
config.resolver.extraNodeModules = {
  "@icu/schemas": path.join(root, "packages/schemas/src"),
  "@icu/fixtures": path.join(root, "packages/fixtures"),
};
// Shared files must resolve zod from this app's own node_modules, not from a parent folder.
config.resolver.nodeModulesPaths = [path.resolve(__dirname, "node_modules")];
module.exports = config;
