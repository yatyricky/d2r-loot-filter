import xlsx from "xlsx";
import * as fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

xlsx.set_fs(fs);
const xu = xlsx.utils;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// util funcs

function stringNull(str) {
    if (str == null) {
        return true;
    }
    if (typeof str !== "string") {
        throw new Error(`Expected string but got ${typeof str}`);
    }
    return str.length === 0;
}

function stringDefault(str, defaultValue) {
    if (stringNull(str)) {
        return defaultValue;
    } else {
        return str;
    }
}

function stringFormat(template, ...args) {
    return template.replace(/{(\d+)}/g, function (match, number) {
        return typeof args[number] !== "undefined" ? args[number] : match;
    });
}

const FP_BASE_XLSX = "Diablo II.xlsx";
const FP_SRC = "game_data/v31/data/data";
const FP_DEST = "lootfilter/lootfilter.mpq/data";
const RFP_ITEM_NAMES = "local/lng/strings/item-names.json";
const RFP_ITEM_NAME_AFFIXES = "local/lng/strings/item-nameaffixes.json";
const RFP_ARMOR = "global/excel/armor.txt";
const RFP_LEVELS = "global/excel/levels.txt";
const RFP_MISC = "global/excel/misc.txt";
const RFP_WEAPONS = "global/excel/weapons.txt";

const wb = xlsx.readFile(path.join(__dirname, FP_BASE_XLSX));

function parseConfig() {
    const configRaw = xu.sheet_to_json(wb.Sheets["Mod-Config"])
    const config = {}
    for (const setting of configRaw) {
        config[setting.Property] = setting.Value
    }

    const allowedCodes = ["enUS", "zhTW", "deDE", "esES", "frFR", "itIT", "koKR", "plPL", "esMX", "jaJP", "ptBR", "ruRU", "zhCN"];
    return {
        enableItemNameMod: stringDefault(config["Enable Item Name Mod"], "no") === "yes",
        targetLanguages: stringDefault(config["Target Languages"], "enUS").split(",").map(s => {
            const trimmed = s.trim();
            if (!allowedCodes.includes(trimmed)) {
                throw new Error(`Unknown language code ${trimmed}. Allowed codes are: ${allowedCodes.join(",")}`);
            }
            return trimmed;
        }),
        normalItemSuffix: stringDefault(config["Normal Item Suffix"], "N"),
        exceptionalItemSuffix: stringDefault(config["Exceptional Item Suffix"], "X"),
        eliteItemSuffix: stringDefault(config["Elite Item Suffix"], "E"),
        enableExtraRuneWords: stringDefault(config["Enable Extra Rune Words"], "no") === "yes",
        showItemLevel: stringDefault(config["Show Item Level"], "no") === "yes",
        monsterDensityMultiplier: Number(config["Monster Density Multiplier"] ?? 1),
        uniqueMonsterMultiplier: Number(config["Unique Monster Multiplier"] ?? 1),
    };
}

function parseJson(fp) {
    let buffer = fs.readFileSync(fp);
    if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
        buffer = buffer.subarray(3);
    }
    return JSON.parse(buffer);
}

function writeJson(fp, data) {
    const bom = Buffer.alloc(3);
    bom[0] = 0xEF;
    bom[1] = 0xBB;
    bom[2] = 0xBF;

    const buffer = Buffer.from(JSON.stringify(data, null, 2) + "\n");
    fs.mkdirSync(path.dirname(fp), { recursive: true });
    fs.writeFileSync(fp, Buffer.concat([bom, buffer]));
}

function parseTsv(fp) {
    let buffer = fs.readFileSync(fp);
    if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
        buffer = buffer.subarray(3);
    }
    const text = buffer.toString();
    const aoa = text.split("\r\n").map(line => line.split("\t"));
    const header = aoa[0];
    const table = [];
    for (let i = 1; i < aoa.length; i++) {
        const line = aoa[i];
        if (line.length === 0 || stringNull(line[0])) {
            continue;
        }
        const obj = {};
        for (let j = 0; j < header.length; j++) {
            obj[header[j]] = line[j] ?? "";
        }
        table.push(obj);
    }
    return { header, table };
}

function writeTsv(fp, data, withBom) {
    const { header, table } = data;
    const lines = [header.join("\t")];
    for (const row of table) {
        const line = header.map(h => row[h] ?? "").join("\t");
        lines.push(line);
    }
    const text = lines.join("\r\n") + "\r\n";
    const bom = Buffer.from([0xEF, 0xBB, 0xBF]);
    const buffer = Buffer.from(text, "utf8");
    fs.mkdirSync(path.dirname(fp), { recursive: true });
    if (withBom) {
        fs.writeFileSync(fp, Buffer.concat([bom, buffer]));
    } else {
        fs.writeFileSync(fp, buffer);
    }
}

const config = parseConfig();
const dataItemNames = parseJson(path.join(__dirname, FP_SRC, RFP_ITEM_NAMES));
const dataItemNameAffixes = parseJson(path.join(__dirname, FP_SRC, RFP_ITEM_NAME_AFFIXES));
const dataArmor = parseTsv(path.join(__dirname, FP_SRC, RFP_ARMOR));
const dataWeapons = parseTsv(path.join(__dirname, FP_SRC, RFP_WEAPONS));
const dataMisc = parseTsv(path.join(__dirname, FP_SRC, RFP_MISC));
const dataLevels = parseTsv(path.join(__dirname, FP_SRC, RFP_LEVELS));

const edits = {
    [RFP_ITEM_NAMES]: {
        table: dataItemNames,
        keyName: "Key",
        mods: {},
    },
    [RFP_ITEM_NAME_AFFIXES]: {
        table: dataItemNameAffixes,
        keyName: "Key",
        mods: {},
    },
    [RFP_ARMOR]: {
        table: dataArmor.table,
        header: dataArmor.header,
        keyName: "code",
        mods: {},
    },
    [RFP_WEAPONS]: {
        table: dataWeapons.table,
        header: dataWeapons.header,
        keyName: "code",
        mods: {},
    },
    [RFP_MISC]: {
        table: dataMisc.table,
        header: dataMisc.header,
        keyName: "code",
        mods: {},
    },
    [RFP_LEVELS]: {
        table: dataLevels.table,
        header: dataLevels.header,
        keyName: "Name",
        mods: {},
    }
};

// find entry by key
function findByKey(rfp, key) {
    const tab = edits[rfp];
    if (tab == null) {
        throw new Error(`Unknown table path ${rfp}`);
    }
    const res = tab.table.filter(e => e[tab.keyName] == key)
    if (res.length === 0) {
        throw new Error(`Unable to find ${tab.keyName} ${key}`);
    } else if (res.length > 1) {
        throw new Error(`Multiple items has the same ${tab.keyName} ${key}`);
    }
    return res[0];
}

function recordEdit(tablePath, key, field, value) {
    if (edits[tablePath] == null) {
        throw new Error(`Unknown table path ${tablePath}`);
    }
    const mods = edits[tablePath].mods;
    if (mods[key] == null) {
        mods[key] = {};
    }
    if (mods[key][field] != null) {
        throw new Error(`Duplicate edit for ${tablePath} ${key} ${field}`);
    }
    mods[key][field] = value;
}

function processItemNameMod() {
    if (!config.enableItemNameMod) {
        return;
    }

    /**
     * edit entry
     * @param {string} key key
     * @param {string} rename the new name
     * @param {string} level suffix for normal/exceptional/elite items
     * @returns void
     */
    function editClone(key, rename, level) {
        if (stringNull(key)) {
            return;
        }

        function tryTable(rfp) {
            const entry = findByKey(rfp, key);

            for (const lang of config.targetLanguages) {
                let name = entry[lang];

                if (!stringNull(rename)) {
                    name = stringFormat(rename, name);
                }

                if (!stringNull(level)) {
                    name += level;
                }

                recordEdit(rfp, key, lang, name);
            }
        }

        try {
            tryTable(RFP_ITEM_NAMES);
        } catch (error) {
            tryTable(RFP_ITEM_NAME_AFFIXES);
        }
    }

    const editWs = xu.sheet_to_json(wb.Sheets["Mod-ItemName"]);
    for (const row of editWs) {
        editClone(row.Key1, row.Rename1, config.normalItemSuffix);
        editClone(row.Key2, row.Rename2, config.exceptionalItemSuffix);
        editClone(row.Key3, row.Rename3, config.eliteItemSuffix);
        editClone(row.Key4, row.Rename4);
    }

    console.log("[OK] Process item name mod success.");
}

function processNewRuneWordsMod() {
    if (!config.enableExtraRuneWords) {
        return;
    }

    console.log("[WARN] Not implemented yet: Enable Extra Rune Words");
}

function processShowItemLevelMod() {
    if (!config.showItemLevel) {
        return;
    }

    function showItemLevel(key) {
        if (stringNull(key)) {
            return;
        }

        function tryTable(rfp) {
            findByKey(rfp, key);
            recordEdit(rfp, key, "ShowLevel", "1");
        }

        try {
            tryTable(RFP_ARMOR);
        } catch (error) {
            try {
                tryTable(RFP_WEAPONS);
            } catch (error) {
                tryTable(RFP_MISC);
            }
        }
    }

    const editWs = xu.sheet_to_json(wb.Sheets["Mod-ItemName"]);
    for (const row of editWs) {
        showItemLevel(row.Key1);
        showItemLevel(row.Key2);
        showItemLevel(row.Key3);
    }

    const extraShow = [
        "cm1",
        "cm2",
        "cm3",
        "rin",
        "amu",
    ];
    for (const key of extraShow) {
        showItemLevel(key);
    }

    console.log("[OK] Process show item level mod success.");
}

function processMonsterDensity() {
    if (config.monsterDensityMultiplier === 1 && config.uniqueMonsterMultiplier === 1) {
        return;
    }

    function modValue(entry, field, multiplier) {
        if (stringNull(entry[field])) {
            return;
        }

        const value = String(Math.round(Number(entry[field]) * multiplier));
        recordEdit(RFP_LEVELS, entry.Name, field, value);
    }

    for (const entry of dataLevels.table) {
        modValue(entry, "MonDen", config.monsterDensityMultiplier);
        modValue(entry, "MonDen(N)", config.monsterDensityMultiplier);
        modValue(entry, "MonDen(H)", config.monsterDensityMultiplier);

        modValue(entry, "MonUMin", config.uniqueMonsterMultiplier);
        modValue(entry, "MonUMax", config.uniqueMonsterMultiplier);
        modValue(entry, "MonUMin(N)", config.uniqueMonsterMultiplier);
        modValue(entry, "MonUMax(N)", config.uniqueMonsterMultiplier);
        modValue(entry, "MonUMin(H)", config.uniqueMonsterMultiplier);
        modValue(entry, "MonUMax(H)", config.uniqueMonsterMultiplier);
    }

    console.log("[OK] Process monster density mod success.");
}

function writeMod() {
    fs.rmSync(path.join(__dirname, FP_DEST), { recursive: true, force: true });
    fs.rmSync(path.join(__dirname, FP_DEST), { recursive: true, force: true });

    for (const [rfp, tab] of Object.entries(edits)) {
        for (const [key, obj] of Object.entries(tab.mods)) {
            const entry = findByKey(rfp, key);
            for (const [k, v] of Object.entries(obj)) {
                entry[k] = v;
            }
        }
        if (tab.header == null) {
            writeJson(path.join(__dirname, FP_DEST, rfp), tab.table);
        } else {
            writeTsv(path.join(__dirname, FP_DEST, rfp), tab);
        }
    }
}

function deployMod() {
    const pathD2RPath = path.join(__dirname, "your-d2r-full-path.txt");
    if (!fs.existsSync(pathD2RPath)) {
        throw new Error(`Please enter your D2R path in ${pathD2RPath}`);
    }
    const d2rPath = fs.readFileSync(pathD2RPath, "utf-8").trim();
    if (stringNull(d2rPath) || !fs.existsSync(d2rPath) || !fs.statSync(d2rPath).isDirectory()) {
        throw new Error(`D2R directory not valid: "${d2rPath}"`);
    }

    const src = path.join(__dirname, "lootfilter");
    const dest = path.join(d2rPath, "mods", "lootfilter");

    fs.rmSync(dest, { recursive: true, force: true });
    fs.cpSync(src, dest, { recursive: true });

    console.log("[OK] Deploy mod success. Now add '-mod lootfilter -txt' to your launch options and enjoy.");
}

processItemNameMod();
processNewRuneWordsMod();
processShowItemLevelMod();
processMonsterDensity();

writeMod();
deployMod();
