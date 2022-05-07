Original repo goes here https://github.com/AlexisEvo/d2r-loot-filter

> A fully customizable item naming mod using excel edits

# Installation

## Option 1: Command line

1. Install nodejs https://nodejs.org/en/
2. CD to root of this repo
3. Create a file named `your-d2r-full-path.txt` under the root, enter your full d2r installation path and save. e.g. C:/Users/yatyr/Games/Diablo II Resurrected
4. `node index`
5. enjoy

## Option 2: Copy and Paste

1. Download the latest release
2. Copy the files as instructed in the original repo https://github.com/AlexisEvo/d2r-loot-filter

# Customization

Open `base.xlsx`

## item-names

This sheet is basically a 1:1 spreadsheet representation of D2R `item-names.json` file.

## item-nameaffixes

This sheet is basically a 1:1 spreadsheet representation of D2R `item-nameaffixes.json` file.

## item-names-edit

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
4. If Color is present
    - blah blah
5. If Rename is present, ....
6. Normal, eXceptional, and Elite gears will be appended with `|N` `|X` `|E` respectively.

## color-codes

Color codes for your information.

# Commandline args

```
node index [enUS|zhTW|deDE|esES|frFR|itIT|koKR|plPL|esMX|jaJP|ptBR|ruRU|zhCN]
```

If no argument is provided, enUS will be used as default.

Examples

```
node index # mod English only
node index enUS # mod English only
node index zhCN # mod Simplified Chinese only
node index enUS koKR # mod English and Korean
```

# Roadmap

[] Simplify installation
