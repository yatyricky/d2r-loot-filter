let xlsx = require("xlsx")
let path = require("path")
let fs = require("fs")
let xu = xlsx.utils

const modDir = "lootfilter/lootfilter.mpq/Data/local/lng/strings"

let wb = xu.book_new()

for (const jsonFile of fs.readdirSync(modDir)) {
    let baseName = path.parse(jsonFile).name
    let buffer = fs.readFileSync(path.join(modDir, jsonFile))
    if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
        buffer = buffer.subarray(3)
    }
    let ws = xu.json_to_sheet(JSON.parse(buffer))
    xu.book_append_sheet(wb, ws, baseName)
}

xlsx.writeFile(wb, "original.xlsx")
