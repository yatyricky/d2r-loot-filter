let xlsx = require("xlsx")
let fs = require("fs")
let xu = xlsx.utils

const fp_base_xlsx = "base.xlsx"
const fp_item_names = "lootfilter/lootfilter.mpq/Data/local/lng/strings/item-names.json"

// xlsx.set_fs(fs)

// let wb = xu.book_new()
// // let ws = xu.aoa_to_sheet([])
// let buffer = fs.readFileSync("lootfilter/lootfilter.mpq/Data/local/lng/strings/item-names.json")
// if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
//     buffer = buffer.slice(3)
// }
// let ws = xu.json_to_sheet(JSON.parse(buffer))
// xu.book_append_sheet(wb, ws, "item-names")

// xlsx.writeFile(wb, "base.xlsx")

let wb = xlsx.readFile(fp_base_xlsx)
let ws = wb.Sheets["item-names"]

let arr = xu.sheet_to_json(ws)

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

let bom = Buffer.alloc(3)
bom[0] = 0xEF
bom[1] = 0xBB
bom[2] = 0xBF
let buffer = Buffer.from(JSON.stringify(arr, null, 2) + "\n")

fs.writeFileSync(fp_item_names, Buffer.concat([bom, buffer]))
