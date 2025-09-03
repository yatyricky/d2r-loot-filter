Original repo goes here https://github.com/AlexisEvo/d2r-loot-filter

> A fully customizable item naming mod using excel edits. Item renaming only, no more shit.

# Environment

- Windows 10 21H2 and later
- Diablo II Resurrected 1.6.84219

# Installation

## Option 1: Command line (Recommended)

1. Install nodejs https://nodejs.org/en/
2. CD to root of this repo
3. `npm i` to install dependencies
4. Create a file named `your-d2r-full-path.txt` under the root, enter your full d2r installation path and save. e.g. `C:/Users/yatyr/Games/Diablo II Resurrected`
5. `node index` to deploy
6. Add `-mod lootfilter -txt` to your launch options and enjoy

## Option 2: Copy and Paste

1. Download the latest release
2. Copy the files as instructed in the original repo https://github.com/AlexisEvo/d2r-loot-filter

# Update Data (Optional)

I regularly update this repo to work with the latest D2R. However in case I'm not around and you really need this, here's how to update the data.

1. Launch CascViewer http://www.zezula.net/en/casc/main.html and open `Diablo II Resurrected` installation folder
2. Navigate to `data/data/local/lng/strings`
3. Extract `item-names.json` and `item-nameaffixes.json` to `d2r-loot-filter/lootfilter/lootfilter.mpq/Data/local/lng/strings`
4. Run `node json2xlsx.js`
5. Open `d2r-loot-filter/original.xlsx`, copy all sheets to `d2r-loot-filter/Diablo II.xlsx`, overwrite existing sheets with the same name
6. Save `Diablo II.xlsx` and you are good to go to the next step

# Customization (Optional)

Open `Diablo II.xlsx`

## Sheet: item-names

This sheet is basically a 1:1 spreadsheet representation of D2R `item-names.json` file.

## Sheet: item-nameaffixes

This sheet is basically a 1:1 spreadsheet representation of D2R `item-nameaffixes.json` file.

## Sheet: settings

- Target Languages: The languages the mod will apply to. Options are enUS|zhTW|deDE|esES|frFR|itIT|koKR|plPL|esMX|jaJP|ptBR|ruRU|zhCN. Defaults to enUS
- Normal Item Suffix: Affects on column A of `Sheet: edit`, defaults to N
- Exceptional Item Suffix: Affects on column E of `Sheet: edit`, defaults to X
- Elite Item Suffix: Affects on column I of `Sheet: edit`, defaults to E

## Sheet: edit

Your work goes here.

It's a simple structure consisting of 3 columns:

1. enUS name of the item. Key to search an item. Could yield multiple results.
2. key of the item. The primary key to search for an item. Yields single result.
3. Rename the item with specified pattern where `{0}` represents the original name.

Layout:

1. The first 9 columns are normal, exceptional, and elite items (gears) respectively.
2. The last 3 columns are misc items.

Rules:

1. Item name is mandatory.
2. If Key is present, all items (normally 1) with the same key will be modified.
3. If Key is absent, all items with the same name will be modified.
4. Normal, eXceptional, and Elite gears will be appended with setting values respectively.

## Sheet: color

Color codes for your information.
