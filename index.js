let xlsx = require("xlsx")
let fs = require("fs")
const path = require("path")
const fse = require("fs-extra")
let xu = xlsx.utils

const fp_base_xlsx = "base.xlsx"
const fp_item_names = "lootfilter/lootfilter.mpq/Data/local/lng/strings/item-names.json"
const fp_item_name_affixes = "lootfilter/lootfilter.mpq/Data/local/lng/strings/item-nameaffixes.json"

const sheetNameItemNames = "item-names"
const sheetNameItemNameAffixes = "item-nameaffixes"

let wb = xlsx.readFile(fp_base_xlsx)
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
        throw new Error(`unable to find enUS ${enUS}`)
    } else if (res.length > 1) {
        console.log(`Warning: multiple items has the same enUS name: ${enUS} >> ${res.map(e => `${e.Key}@${e.sheet}`).join(",")}`)
    }
    return res
}

function findByKey(key) {
    let res = arr.filter(e => e.Key == key)
    if (res.length === 0) {
        throw new Error(`unable to find key ${key}`)
    } else if (res.length > 1) {
        console.log(`Warning: multiple items has the same key: ${key} >> ${res.map(e => `${e.id}@${e.sheet}`).join(",")}`)
    }
    return res
}

function stringNull(str) {
    return str === undefined || str === null || str.length === 0
}

function editClone(nameEnUS, key, color, rename) {
    if (stringNull(nameEnUS)) {
        return
    }
    let entries
    if (!stringNull(key)) {
        entries = findByKey(key)
    } else {
        entries = findByEnUS(nameEnUS)
    }

    for (const entry of entries) {
        let name = entry.enUS
        if (!stringNull(rename)) {
            name = rename
        }
        if (!stringNull(color)) {
            name = color + name
        }
        entry.enUS = name
    }
}

let editWs = xu.sheet_to_json(wb.Sheets["item-names-edit"])
for (const row of editWs) {
    editClone(row.Normal, row.Key1, row.Color1, row.Rename1)
    editClone(row.Exceptional, row.Key2, row.Color2, row.Rename2)
    editClone(row.Elite, row.Key3, row.Color3, row.Rename3)
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

// deploy

const pathD2RPath = path.join(__dirname, "your-d2r-full-path.txt")
let d2rPath
if (fs.existsSync(pathD2RPath)) {
    if (fs.statSync(pathD2RPath).isFile()) {
        d2rPath = fs.readFileSync(pathD2RPath).toString().trim()
    }
}

if (stringNull(d2rPath)) {
    console.log("Please enter your d2r path here: " + pathD2RPath)
    process.exit(1)
}

if (!fs.existsSync(d2rPath) || !fs.statSync(d2rPath).isDirectory()) {
    console.log(`Directory not valid ${d2rPath}`)
    process.exit(1)
}

const modsDir = path.join(d2rPath, "mods")
if (fs.existsSync(modsDir)) {
    if (fs.statSync(modsDir).isFile()) {
        throw new Error(`Path is not directory ${modsDir}`)
    }
} else {
    fs.mkdirSync(modsDir)
}

const modPath = path.join(modsDir, "lootfilter")
if (fs.existsSync(modPath)) {
    if (fs.statSync(modPath).isDirectory()) {
        fs.rmdirSync(modPath, {
            recursive: true
        })
    } else {
        throw new Error(`Path is not directory ${modPath}`)
    }
}

fse.copy(path.join(__dirname, "lootfilter"), modsDir)
