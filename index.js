let xlsx = require("xlsx")
let fs = require("fs")
const path = require("path")
const fse = require("fs-extra")
let xu = xlsx.utils

// util funcs

function stringNull(str) {
    return str === undefined || str === null || str.length === 0
}

function stringDefault(str, defaultValue) {
    if (stringNull(str)) {
        return defaultValue
    } else {
        return str
    }
}

function stringFormat(template, ...args) {
    return template.replace(/{(\d+)}/g, function (match, number) {
        return typeof args[number] !== "undefined" ? args[number] : match
    })
}

const fp_base_xlsx = "Diablo II.xlsx"
const fp_item_names = "lootfilter/lootfilter.mpq/Data/local/lng/strings/item-names.json"
const fp_item_name_affixes = "lootfilter/lootfilter.mpq/Data/local/lng/strings/item-nameaffixes.json"

const sheetNameItemNames = "item-names"
const sheetNameItemNameAffixes = "item-nameaffixes"
const sheetSettings = "settings"

let wb = xlsx.readFile(fp_base_xlsx)

// parse settings

let settingsRaw = xu.sheet_to_json(wb.Sheets[sheetSettings])
let settings = {}
for (const setting of settingsRaw) {
    settings[setting.Property] = setting.Value
}
let targetLanguages = stringDefault(settings["Target Languages"], "enUS")
let normalItemSuffix = stringDefault(settings["Normal Item Suffix"], "N")
let exceptionalItemSuffix = stringDefault(settings["Exceptional Item Suffix"], "X")
let eliteItemSuffix = stringDefault(settings["Elite Item Suffix"], "E")

// target lang

let allowedCodes = ["enUS", "zhTW", "deDE", "esES", "frFR", "itIT", "koKR", "plPL", "esMX", "jaJP", "ptBR", "ruRU", "zhCN"]

let targetLangs = []

for (const lang of targetLanguages.split(",")) {
    if (allowedCodes.includes(lang)) {
        targetLangs.push(lang)
    } else {
        console.log(`[ERR] Unknown lang ${lang}. Expected ${allowedCodes.join("|")}`)
        process.exit(1)
    }
}

// combine all json values into one array

let itemNames = xu.sheet_to_json(wb.Sheets[sheetNameItemNames])
let itemNameAffixes = xu.sheet_to_json(wb.Sheets[sheetNameItemNameAffixes])

let arr = []

for (const e of itemNames) {
    arr.push({ ...e, sheet: sheetNameItemNames })
}

for (const e of itemNameAffixes) {
    arr.push({ ...e, sheet: sheetNameItemNameAffixes })
}

for (const e of arr) {
    for (const key in e) {
        if (Object.hasOwnProperty.call(e, key)) {
            const val = e[key];
            if (typeof (val) === "string") {
                if (val.includes("\r\n")) {
                    e[key] = val.replace(/\r\n/g, "\n")
                }
            }
        }
    }
}

// find entry by key
function findByKey(key) {
    let res = arr.filter(e => e.Key == key)
    if (res.length === 0) {
        console.log(`[ERR] Unable to find key ${key}`)
        process.exit(1)
    } else if (res.length > 1) {
        console.log(`[WARN] Multiple items has the same key: ${key} >> ${res.map(e => `${e.id}@${e.sheet}`).join(",")}`)
    }
    return res
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
    let entries = findByKey(key)

    level = level ?? ""
    for (const entry of entries) {
        for (const lang of targetLangs) {
            let name = entry[lang]

            if (!stringNull(rename)) {
                name = stringFormat(rename, name)
            }

            entry[lang] = name + level
        }
    }
}

let editWs = xu.sheet_to_json(wb.Sheets["edit"])
for (const row of editWs) {
    editClone(row.Key1, row.Rename1, normalItemSuffix)
    editClone(row.Key2, row.Rename2, exceptionalItemSuffix)
    editClone(row.Key3, row.Rename3, eliteItemSuffix)
    editClone(row.Key4, row.Rename4)
}

// write json files

let bom = Buffer.alloc(3)
bom[0] = 0xEF
bom[1] = 0xBB
bom[2] = 0xBF

function stripSheetProp(e) {
    delete e.sheet
    return e
}

itemNames = arr.filter(e => e.sheet === sheetNameItemNames).map(e => stripSheetProp(e))
itemNameAffixes = arr.filter(e => e.sheet === sheetNameItemNameAffixes).map(e => stripSheetProp(e))

let bufferItemNames = Buffer.from(JSON.stringify(itemNames, null, 2) + "\n")
fs.writeFileSync(fp_item_names, Buffer.concat([bom, bufferItemNames]))

let bufferItemNameAffixes = Buffer.from(JSON.stringify(itemNameAffixes, null, 2) + "\n")
fs.writeFileSync(fp_item_name_affixes, Buffer.concat([bom, bufferItemNameAffixes]))

console.log(`[OK] Write json success. Changes langs: ${targetLangs.join(",")}.`)

// begin: show item level

// find all items that needs to show item level
const needsToShow = new Set();

function addToNeedsToShow(key, showIlvl) {
    if (stringNull(key)) {
        return;
    }
    if (showIlvl === "yes") {
        needsToShow.add(key);
    }
}

for (const row of editWs) {
    addToNeedsToShow(row.Key1, row.ShowIlvl1)
    addToNeedsToShow(row.Key2, row.ShowIlvl2)
    addToNeedsToShow(row.Key3, row.ShowIlvl3)
    addToNeedsToShow(row.Key4, row.ShowIlvl4)
}

const globalDir = "lootfilter/lootfilter.mpq/Data/global/excel";

function processItemsTsv(sheetName) {
    const ws = wb.Sheets[sheetName];
    const range = xu.decode_range(ws["!ref"]);
    const header = [];
    for (let c = 0; c <= range.e.c; c++) {
        const element = ws[xu.encode_cell({ r: 0, c })];
        if (element == null) {
            break;
        }
        header.push(element.v);
    }

    const rows = xu.sheet_to_json(ws);
    for (const e of rows) {
        if (stringNull(e.ShowLevel)) {
            continue;
        }
        e.ShowLevel = needsToShow.has(e.code) ? "1" : "0";
    }

    let out = header.join("\t") + "\r\n";
    for (const e of rows) {
        if (stringNull(e.name)) {
            continue;
        }
        out += header.map(h => e[h] ?? "").join("\t") + "\r\n";
    }

    fs.writeFileSync(path.join(globalDir, `${sheetName}.txt`), out, { encoding: "utf-8" });
    console.log(`[OK] Write ${sheetName}.txt success.`);

}

processItemsTsv("weapons");
processItemsTsv("armor");
processItemsTsv("misc");

// end: show item level

// begin: new rune words

function getSeq(entry) {
    return `${entry.Rune1}${entry.Rune2}${entry.Rune3}${entry.Rune4}${entry.Rune5}${entry.Rune6}`;
}

const rune2Name = {
    r01: "El",
    r02: "Eld",
    r03: "Tir",
    r04: "Nef",
    r05: "Eth",
    r06: "Ith",
    r07: "Tal",
    r08: "Ral",
    r09: "Ort",
    r10: "Thul",
    r11: "Amn",
    r12: "Sol",
    r13: "Shael",
    r14: "Dol",
    r15: "Hel",
    r16: "Io",
    r17: "Lum",
    r18: "Ko",
    r19: "Fal",
    r20: "Lem",
    r21: "Pul",
    r22: "Um",
    r23: "Mal",
    r24: "Ist",
    r25: "Gul",
    r26: "Vex",
    r27: "Ohm",
    r28: "Lo",
    r29: "Sur",
    r30: "Ber",
    r31: "Jah",
    r32: "Cham",
    r33: "Zod",
}

function convertRunes2Names(r1, r2, r3, r4, r5, r6) {
    const runes = [r1, r2, r3, r4, r5, r6];
    let arr = [];
    for (const r of runes) {
        if (stringNull(r) || stringNull(rune2Name[r])) {
            break;
        }
        arr.push(rune2Name[r]);
    }
    return arr.join("");
}

const baseRws = xu.sheet_to_json(wb.Sheets["runes"]).filter(e => !stringNull(e.Name));
const newRws = xu.sheet_to_json(wb.Sheets["new rws"]).filter(e => !stringNull(e.Name) && String(e.complete) === "1");
// check conflict
for (const e of newRws) {
    const seq = getSeq(e);
    if (baseRws.find(b => getSeq(b) === seq)) {
        console.log(`[ERR] New rune word ${e.Name} has conflict with base rune words. Sequence: ${seq}`);
        process.exit(1);
    }
    const newObj = {
        ["Name"]: e.Name,
        ["*Rune Name"]: e["*Rune Name"],
        ["complete"]: "1",
        ["firstLadderSeason"]: "",
        ["lastLadderSeason"]: "",
        ["*Patch Release"]: "111",
        ["itype1"]: e.itype1,
        ["itype2"]: e.itype2,
        ["itype3"]: e.itype3,
        ["itype4"]: e.itype4,
        ["itype5"]: e.itype5,
        ["itype6"]: e.itype6,
        ["etype1"]: e.etype1,
        ["etype2"]: e.etype2,
        ["etype3"]: e.etype3,
        ["*RunesUsed"]: convertRunes2Names(e.Rune1, e.Rune2, e.Rune3, e.Rune4, e.Rune5, e.Rune6),
        ["Rune1"]: e.Rune1,
        ["Rune2"]: e.Rune2,
        ["Rune3"]: e.Rune3,
        ["Rune4"]: e.Rune4,
        ["Rune5"]: e.Rune5,
        ["Rune6"]: e.Rune6,
        ["T1Code1"]: e.T1Code1,
        ["T1Param1"]: e.T1Param1,
        ["T1Min1"]: e.T1Min1,
        ["T1Max1"]: e.T1Max1,
        ["T1Code2"]: e.T1Code2,
        ["T1Param2"]: e.T1Param2,
        ["T1Min2"]: e.T1Min2,
        ["T1Max2"]: e.T1Max2,
        ["T1Code3"]: e.T1Code3,
        ["T1Param3"]: e.T1Param3,
        ["T1Min3"]: e.T1Min3,
        ["T1Max3"]: e.T1Max3,
        ["T1Code4"]: e.T1Code4,
        ["T1Param4"]: e.T1Param4,
        ["T1Min4"]: e.T1Min4,
        ["T1Max4"]: e.T1Max4,
        ["T1Code5"]: e.T1Code5,
        ["T1Param5"]: e.T1Param5,
        ["T1Min5"]: e.T1Min5,
        ["T1Max5"]: e.T1Max5,
        ["T1Code6"]: e.T1Code6,
        ["T1Param6"]: e.T1Param6,
        ["T1Min6"]: e.T1Min6,
        ["T1Max6"]: e.T1Max6,
        ["T1Code7"]: e.T1Code7,
        ["T1Param7"]: e.T1Param7,
        ["T1Min7"]: e.T1Min7,
        ["T1Max7"]: e.T1Max7,
        ["*eol"]: "0"
    }
    const index = baseRws.findIndex(b => b.Name === e.Name);
    if (index >= 0) {
        baseRws[index] = newObj;
    } else {
        baseRws.push(newObj);
    }
}

const headers = [
    "Name",
    "*Rune Name",
    "complete",
    "firstLadderSeason",
    "lastLadderSeason",
    "*Patch Release",
    "itype1",
    "itype2",
    "itype3",
    "itype4",
    "itype5",
    "itype6",
    "etype1",
    "etype2",
    "etype3",
    "*RunesUsed",
    "Rune1",
    "Rune2",
    "Rune3",
    "Rune4",
    "Rune5",
    "Rune6",
    "T1Code1",
    "T1Param1",
    "T1Min1",
    "T1Max1",
    "T1Code2",
    "T1Param2",
    "T1Min2",
    "T1Max2",
    "T1Code3",
    "T1Param3",
    "T1Min3",
    "T1Max3",
    "T1Code4",
    "T1Param4",
    "T1Min4",
    "T1Max4",
    "T1Code5",
    "T1Param5",
    "T1Min5",
    "T1Max5",
    "T1Code6",
    "T1Param6",
    "T1Min6",
    "T1Max6",
    "T1Code7",
    "T1Param7",
    "T1Min7",
    "T1Max7",
    "*eol",
];

let runesContents = headers.join("\t") + "\r\n";
for (const e of baseRws) {
    if (stringNull(e.Name)) {
        continue;
    }
    runesContents += headers.map((field) => e[field] ?? "").join("\t") + "\r\n";
}

fs.writeFileSync(path.join(globalDir, `runes.txt`), runesContents, { encoding: "utf-8" });
console.log(`[OK] Write runes.txt success.`);

// end: new rune words

// deploy json files to your d2r path

const pathD2RPath = path.join(__dirname, "your-d2r-full-path.txt")
let d2rPath
if (fs.existsSync(pathD2RPath)) {
    if (fs.statSync(pathD2RPath).isFile()) {
        d2rPath = fs.readFileSync(pathD2RPath).toString().trim()
    }
}

if (stringNull(d2rPath)) {
    console.log("[ERR] Please enter your d2r path here: " + pathD2RPath)
    process.exit(1)
}

if (!fs.existsSync(d2rPath) || !fs.statSync(d2rPath).isDirectory()) {
    console.log(`[ERR] Directory not valid ${d2rPath}`)
    process.exit(1)
}

const modsDir = path.join(d2rPath, "mods")
if (fs.existsSync(modsDir)) {
    if (fs.statSync(modsDir).isFile()) {
        console.log(`[ERR] Path is not directory ${modsDir}`)
        process.exit(1)
    }
} else {
    fs.mkdirSync(modsDir)
}

const modPath = path.join(modsDir, "lootfilter")
if (fs.existsSync(modPath)) {
    if (fs.statSync(modPath).isDirectory()) {
        fs.rmSync(modPath, {
            recursive: true
        })
        fs.mkdirSync(modPath)
    } else {
        console.log(`[ERR] Path is not directory ${modPath}`)
        process.exit(1)
    }
}

fse.copy(path.join(__dirname, "lootfilter"), modPath)

console.log("[OK] Deploy mod success. Now add '-mod lootfilter -txt' to your launch options and enjoy.")
