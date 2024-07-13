/**
 * @file for creating an executable file for Mac Arm64.
 */

const exe = require("@angablue/exe");
const package = require('../package.json');

const build = exe({
  entry: "./src/index.js",
  out: "./dffoo_gateway-macos-x64",
  pkg: ["-C", "GZip"], // Specify extra pkg arguments
  version: package.version,
  target: "node18-macos-x64",
  icon: "./src/app.ico", // Application icons must be in .ico format
  executionLevel: "highestAvailable"
});

build.then(() => console.log("Mac x64 build completed!"));