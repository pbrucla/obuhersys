import { program } from "commander";
import fs from "node:fs/promises";

import { main } from "./checker.js";
import { checks } from "../tests/checks.js";

program
    .name("DAMN Log Parser")
    .option("-c, --checks <file>")
    .argument("<log file>")
    .action(async (logFile, options) => {
        // const checks = JSON.parse(await fs.readFile(options.checks, { encoding: "utf-8" }));
        // await main(logFile, checks);
        await main(logFile);
    })
    .parse();
