/*
 * Read your-casc-work-full-path.txt as root of the latest exported original game data.
 *  - if your-casc-work-full-path.txt is missing, it will be created as empty file, and tell user to fill it with the path to the latest exported original game data.
 * Iterate through game_data/v31, fetch each file from your-casc-work-full-path.txt and replace the file in game_data/v31.
 * Both the source and destination paths are strictly mirrored, so if the source file is missing, it will be reported as error and terminated.
 */

import * as fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_FILE = "your-casc-work-full-path.txt";
const GAME_DATA_DIR = "game_data/v31";

const configPath = path.join(__dirname, CONFIG_FILE);

if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, "", "utf-8");
    console.error(`Created ${CONFIG_FILE}. Please fill it with the full path to the latest exported original game data, then run this script again.`);
    process.exit(1);
}

const cascRoot = fs.readFileSync(configPath, "utf-8").trim();
if (cascRoot.length === 0) {
    console.error(`${CONFIG_FILE} is empty. Please fill it with the full path to the latest exported original game data, then run this script again.`);
    process.exit(1);
}

if (!fs.existsSync(cascRoot)) {
    console.error(`The path specified in ${CONFIG_FILE} does not exist: ${cascRoot}`);
    process.exit(1);
}

function walkDir(dir) {
    const results = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...walkDir(fullPath));
        } else {
            results.push(fullPath);
        }
    }
    return results;
}

const gameDataDir = path.join(__dirname, GAME_DATA_DIR);
const files = walkDir(gameDataDir);

for (const destFile of files) {
    const relPath = path.relative(gameDataDir, destFile);
    const srcFile = path.join(cascRoot, relPath);

    if (!fs.existsSync(srcFile)) {
        console.error(`Source file not found: ${srcFile}`);
        process.exit(1);
    }

    fs.copyFileSync(srcFile, destFile);
    console.log(`Updated: ${relPath}`);
}

console.log(`Done. ${files.length} file(s) updated from ${cascRoot}`);

