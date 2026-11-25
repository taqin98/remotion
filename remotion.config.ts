/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(90);
Config.setConcurrency(2);
Config.setOverwriteOutput(true);
Config.setDefaultPremountInSeconds(2);
Config.setBrowserExecutable(
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
);
Config.setChromiumOpenGlRenderer("angle");
Config.setChromeMode("chrome-for-testing");
