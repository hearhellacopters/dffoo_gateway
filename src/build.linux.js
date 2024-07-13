/**
 * @file for creating an executable file for Linux.
 */

const exe = require("@angablue/exe");
const package = require('../package.json');

const build = exe({
  entry: "./src/index.js",
  out: "./dffoo_gateway-linux-x64",
  pkg: ["-C", "GZip"], // Specify extra pkg arguments
  version: package.version,
  target: "node16-linux-x64",
  icon: "./src/app.ico", // Application icons must be in .ico format
  executionLevel: "highestAvailable"
});

build.then(() => console.log("Linux build completed!"));