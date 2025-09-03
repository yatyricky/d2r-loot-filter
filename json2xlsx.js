let xlsx = require("xlsx")
let path = require("path")
let fs = require("fs")
let xu = xlsx.utils

let wb = xu.book_new()

const modDir = "lootfilter/lootfilter.mpq/Data/local/lng/strings"

for (const jsonFile of fs.readdirSync(modDir)) {
    let baseName = path.parse(jsonFile).name
    let buffer = fs.readFileSync(path.join(modDir, jsonFile))
    if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
        buffer = buffer.subarray(3)
    }
    let ws = xu.json_to_sheet(JSON.parse(buffer))
    xu.book_append_sheet(wb, ws, baseName)
}

const globalDir = "lootfilter/lootfilter.mpq/Data/global/excel";

for (const tsvFile of fs.readdirSync(globalDir)) {
    let baseName = path.parse(tsvFile).name
    let buffer = fs.readFileSync(path.join(globalDir, tsvFile))
    if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
        buffer = buffer.subarray(3)
    }
    const text = buffer.toString();
    xu.book_append_sheet(wb, xu.aoa_to_sheet(text.split("\r\n").map(line => line.split("\t"))), baseName);
}

xlsx.writeFile(wb, "original.xlsx")
