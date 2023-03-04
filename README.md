Original repo goes here https://github.com/AlexisEvo/d2r-loot-filter

> A fully customizable item naming mod using excel edits. Item renaming only, no more shit.

# Environment

- Windows 10 21H2
- Diablo II Resurrected 1.2.69754

# Installation

## Option 1: Command line (Recommended)

1. Install nodejs https://nodejs.org/en/
2. CD to root of this repo
3. Create a file named `your-d2r-full-path.txt` under the root, enter your full d2r installation path and save. e.g. C:/Users/yatyr/Games/Diablo II Resurrected
4. `node index`
5. enjoy

## Option 2: Copy and Paste

1. Download the latest release
2. Copy the files as instructed in the original repo https://github.com/AlexisEvo/d2r-loot-filter

# Customization

Open `Diablo II.xlsx`

## Sheet: item-names

This sheet is basically a 1:1 spreadsheet representation of D2R `item-names.json` file.

```
# for devs
use json2xlsx.js to update the sheet
use casc viewer to update to the latest game data
```

## Sheet: item-nameaffixes

This sheet is basically a 1:1 spreadsheet representation of D2R `item-nameaffixes.json` file.

## Sheet: settings

- Target Languages: The languages the mod will apply to. Options are enUS|zhTW|deDE|esES|frFR|itIT|koKR|plPL|esMX|jaJP|ptBR|ruRU|zhCN. Defaults to enUS
- Normal Item Suffix: Affects on column A, defaults to N
- Exceptional Item Suffix: Affects on column E, defaults to X
- Elite Item Suffix: Affects on column I, defaults to E
- Item Prefix: Affects items with color modified yet not renamed

## Sheet: edit

Your work goes here.

It's a simple structure consisting of 4 columns:

1. enUS name of the item. Key to search an item. Could yield multiple results.
2. key of the item. The primary key to search for an item. Yields single result.
3. The color of choice.
4. Rename the item.

Layout:

1. The first 12 columns are normal, exceptional, and elite items (gears) respectively.
2. The last 4 columns are misc items.

Rules:

1. Item name is mandatory.
2. If Key is present, all items (normally 1) with the same key will be modified.
3. If Key is missing, all items with the same name will be modified.
4. If Color is present, the item name color will be changed. Item prefix is not affected.
5. If Rename is present, item prefix will be ignored.
6. Normal, eXceptional, and Elite gears will be appended with setting values respectively.

## Sheet: color

Color codes for your information.

# Roadmap

[] Simplify installation
