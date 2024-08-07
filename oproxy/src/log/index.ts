import { program } from "commander";
import process from "node:process";
import path from "node:path";

import { APIMisuseCheck, main } from "./checker.js";

program
  .name("Obuhersys Log Parser")
  .option("-c, --checks <file>")
  .argument("<log file>")
  .action(async (logFile, options) => {
    const checks = ((await import(path.resolve(process.cwd(), options.checks))) as { default: APIMisuseCheck[] })
      .default;
    await main(logFile, checks);
  })
  .parse();
