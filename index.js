let xlsx = require("xlsx")
let fs = require("fs")
const path = require("path")
const fse = require("fs-extra")
let xu = xlsx.utils

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

const fp_base_xlsx = "base.xlsx"
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
let itemPrefix = stringDefault(settings["Item Prefix"], "")

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

function findByEnUS(enUS) {
    let res = arr.filter(e => e.enUS == enUS)
    if (res.length === 0) {
        console.log(`[ERR] Unable to find enUS ${enUS}`)
        process.exit(1)
    } else if (res.length > 1) {
        console.log(`[WARN] Multiple items has the same enUS name: ${enUS} >> ${res.map(e => `${e.Key}@${e.sheet}`).join(",")}`)
    }
    return res
}

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

function editClone(nameEnUS, key, color, rename, level) {
    if (stringNull(nameEnUS)) {
        return
    }
    let entries
    if (!stringNull(key)) {
        entries = findByKey(key)
    } else {
        entries = findByEnUS(nameEnUS)
    }

    color = color || ""
    rename = rename || ""
    level = level || ""
    let prefix = itemPrefix
    for (const entry of entries) {
        for (const lang of targetLangs) {
            let name = entry[lang]

            if (!stringNull(rename)) {
                name = rename
                prefix = ""
            }

            if (stringNull(color)) {
                prefix = ""
            }

            name = prefix + color + name + level
            entry[lang] = name
        }
    }
}

let editWs = xu.sheet_to_json(wb.Sheets["item-names-edit"])
for (const row of editWs) {
    editClone(row.Normal, row.Key1, row.Color1, row.Rename1, normalItemSuffix)
    editClone(row.Exceptional, row.Key2, row.Color2, row.Rename2, exceptionalItemSuffix)
    editClone(row.Elite, row.Key3, row.Color3, row.Rename3, eliteItemSuffix)
    editClone(row.Special, row.Key4, row.Color4, row.Rename4)
}

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

// deploy

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
