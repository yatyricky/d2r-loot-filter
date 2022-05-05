let xlsx = require("xlsx")
let fs = require("fs")
let xu = xlsx.utils

let wb = xu.book_new()
let buffer = fs.readFileSync("lootfilter/lootfilter.mpq/Data/local/lng/strings/item-nameaffixes.json")
if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
    buffer = buffer.slice(3)
}
let ws = xu.json_to_sheet(JSON.parse(buffer))
xu.book_append_sheet(wb, ws, "item-nameaffixes")

xlsx.writeFile(wb, "original.xlsx")
