Original repo goes here https://github.com/AlexisEvo/d2r-loot-filter

> A fully customizable item naming mod using excel edits.

# Environment

- Windows 10 21H2 and later
- Diablo II Resurrected 3.1.91735

# Installation

## Option 1: Copy and Paste (Recommended)

1. Download the latest release
2. Copy the files as instructed in the original repo https://github.com/AlexisEvo/d2r-loot-filter

## Option 2: Command line

1. Install nodejs https://nodejs.org/en/
2. CD to root of this repo
3. `npm i` to install dependencies
4. Create a file named `your-d2r-full-path.txt` under the root, enter your full d2r installation path and save. e.g. `C:/Users/yatyr/Games/Diablo II Resurrected`
5. `node index` to deploy
6. Add `-mod lootfilter -txt` to your launch options and enjoy

# Update Data (Optional)

I regularly update this repo to work with the latest D2R. However in case I'm not around and you really need this, here's how to update the data.

1. Launch CascViewer http://www.zezula.net/en/casc/main.html and open `Diablo II Resurrected` installation folder
2. Extract files as the `game_data` folder structure shown

# Customization (Optional)

1. Open `Diablo II.xlsx`
2. Edit `Mod-Config` and `Mod-ItemName`
