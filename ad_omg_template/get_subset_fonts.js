const { execFileSync } = require('child_process');
const builder = require("../../eeditor/tools/builder.js");
const winston = require('../../eeditor/tools/winston')
const fs = require('fs');
const path = require('path');

const projectDir = __dirname;

const projectJsonPath = path.join(projectDir, 'project.json');
const projectJson = getJson(projectJsonPath);

const buildFlags = ifdef(get(projectJson, 'buildFlags'), {});
const SUBPROJECT = ifdef(get(buildFlags, 'SUBPROJECT'), "");

const playablePath = path.join(projectDir, SUBPROJECT);
const localesDirPath = path.join(projectDir, 'lang');

const configDirPath = path.join(playablePath, 'conf');

const levelConfigJson = getJson(path.join(configDirPath, 'level.json'));
const buildOpts = ifdef(get(levelConfigJson, 'buildOpts'), {});

const extraSymbols = [];
for (let code = 32; code <= 126; code++) {
  extraSymbols.push(String.fromCharCode(code));
}

$each(buildOpts.buildingLocales, localeName => {
  const fonts = buildOpts.fontsByLang[localeName] || buildOpts.fontsByLang['auto'];
  const fontsArr = isArray(fonts) ? fonts : fonts.split(",");

  let localeJson;
  const symbolsSet = new Set();
  extraSymbols.forEach(s => symbolsSet.add(s))

  if (localeName != 'auto') {
    localeJson = getJson(path.join(localesDirPath, `${localeName}.json`));

    for (i = 1; i < localeJson.length; i += 2) {
      var str = localeJson[i];
      for (var j = 0; j < str.length; j++) {
        symbolsSet.add(str.charAt(j));
      }
    }
  }

  const requiredSymbols = [...symbolsSet].sort().join('')
  winston.info(`Locale: ${localeName}`)
  winston.info(`Characters set: ${requiredSymbols}`)

  $each(fontsArr, font => {
    const fontName = font.trim();
    const fontPath = path.join(projectDir, `fonts/${fontName}.ttf`);
    const resDir = path.join(playablePath, 'build_res');
    const subsetFontPath = path.join(resDir, `${fontName}_${localeName}.ttf`);

    fs.mkdirSync(resDir, { recursive: true });

    if (localeName == 'auto') {
      fs.copyFileSync(fontPath, subsetFontPath);
    } else {
      // Для работы требуется установленный python3 и python3-fonttool
      // Команда для установки на Linux: apt-get install -y --no-install-recommends python3-fonttools
      // либо: python3 -m pip install fonttools
      execFileSync(
        'python3',
        [
          '-m', 'fontTools.subset',
          fontPath,
          `--text=${requiredSymbols}`,
          `--output-file=${subsetFontPath}`,
          '--layout-features=*',
          '--symbol-cmap',
          '--no-hinting'
        ],
        { stdio: 'inherit' }
      );
    }
  })
})