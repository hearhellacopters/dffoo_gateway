/**
 * @file for creating an executable .exe file for windows.
 */

const exe = require("@angablue/exe");
const package = require('../package.json');

const build = exe({
  entry: "./index.js",
  out: "./dffoo_gateway.exe",
  pkg: ["-C", "GZip"], // Specify extra pkg arguments
  version: package.version,
  target: "node16-win-x64",
  icon: "./src/app.ico", // Application icons must be in .ico format
  executionLevel: "highestAvailable"
});

build.then(() => console.log("Windows build completed!"));