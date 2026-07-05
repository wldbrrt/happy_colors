const builder = require("../../eeditor/tools/builder.js")

const fs = require('fs');
const path = require('path');

optimist.options('ad', { 'default': '', describe: 'set ad subproject name!' })


const projectDir = __dirname;
const projectJsonPath = path.join(projectDir, 'project.json');

let projectJson = getJson(projectJsonPath);

const buildFlags = ifdef(get(projectJson, 'buildFlags'), {});
const CONF_LEVEL = ifdef(get(buildFlags, "CONF_LEVEL"), "level.json");
const SUBPROJECT = ifdef(optimist.argv.ad, get(buildFlags, 'SUBPROJECT'));
const CHEATS = get(buildFlags, 'CHEATS')
const VERSION = ifdef(get(buildFlags, 'VERSION'), "0.0.0");


const playablePath = path.join(projectDir, SUBPROJECT);
const particlesDirPath = path.join(playablePath, 'particles');
const layoutsDirPath = path.join(playablePath, 'layouts');
const spineDirPath = path.join(playablePath, 'spine');
const soundsDirPath = path.join(playablePath, 'sounds');
const shadersDirPath = path.join(projectDir, 'shaders');
const srcDirPath = path.join(projectDir, 'src');

const configDirPath = path.join(playablePath, 'conf');
const levelConfigJson = getJson(path.join(configDirPath, 'level.json'));
const buildOpts = ifdef(get(levelConfigJson, 'buildOpts'), {});

function dirlist(mask, basedir) {
    return collectSources(mask, '', { cwd: basedir });
}

if (!buildOpts || !buildOpts.fontsByLang || !buildOpts.buildingLocales) {
    throw new Error(`[get_project_json.js] Missing or invalid buildOpts in ${SUBPROJECT}/conf/${CONF_LEVEL}. Please add valid buildOpts object to the config file.`);
}

if (!buildOpts.fontsByLang['auto']) {
    throw new Error(`[get_project_json.js] Missing buildOpts.fontsByLang['auto'] in ${SUBPROJECT}/conf/${CONF_LEVEL}. Please add fontsByLang.auto (array or comma-separated string) to buildOpts.`);
}

let fonts
try {
    fonts = isArray(buildOpts.fontsByLang['auto']) ? buildOpts.fontsByLang['auto'] : buildOpts.fontsByLang['auto'].split(",");
} catch {
    throw new Error(`[get_project_json.js] buildOpts.fontsByLang['auto'] must be an array or comma-separated string in ${SUBPROJECT}/conf/${CONF_LEVEL}. Current value: ${JSON.stringify(buildOpts.fontsByLang['auto'])}`);
}
 
const locales = buildOpts.buildingLocales;

if (!locales || !isArray(locales) || locales.length === 0) {
    throw new Error(`[get_project_json.js] Invalid or empty locales in getOptions() for ${SUBPROJECT}. Check buildOpts.buildingLocales configuration.`);
}

const layouts = dirlist('*.json', layoutsDirPath);
const particles = dirlist('*.effect.json', particlesDirPath);
const spine = dirlist('*', spineDirPath);
const sounds = dirlist('*.*', soundsDirPath);
const shaders = dirlist('*.{f,v}', shadersDirPath);


function getJsSources() {
// Массив allBehaviours для правильного порядка загрузки
    let allBehaviours = [
        "baseLevel.js",
        "background.js",
        "hearts.js",
        "list.js",
        "tutorial.js",
        "excellent.js",
        "excellent_inl.js",
        "sounds.js",
        "congrat.js",
        "hint.js",
        "scale_content.js",
        "crossword.js",
        "counter.js",
        "play_button.js",
        "line.js",
        "letters_circle.js",
        "selected_letters.js",
        "orientation_rotator.js",
        "orchange.js",
        "wbh.js",
        "sudoku.js",
        "puzzle.js",
        "fillword.js",
        "progress_bar.js",
        "shade.js",
        "vignette.js",
        "money_fly_anim.js",
        "cryptomix.js",
        "tilethree.js",
        "time.js",
        "item_marker.js",
        "item_fly_anim.js",
        "fly_anim.js",
        "money_box_anim.js",
        "item_change_anim.js",
        "brain_type.js",
        "millionaire.js",
        "phrase_change_anim.js",
        "cells_coins.js",
        "wrong_word.js",
        "score.js",
        "item_move_anim.js",
        "player_grade.js",
        "sudoku_animate_field.js",
        "letters_list.js",
        "word_list.js",
        "cells_merge_bar.js",
        "hidden_objects.js",
        "number_fly_anim.js",
        "apply_effect.js",
        "puzzle_match.js",
        "carousel.js",
        "tile_trip_grid.js",
        "rockets.js",
        "complete_on_tap.js",
        "happy_colour.js",
        'move_on_tap.js',
        "tap_to_color.js",
        "colors_panel.js"
    ];

    let requiredBehaviours = new Set();

    requiredBehaviours.add('congrat.js');

    $each(layouts, file => {
        const content = readFileSync(path.join(layoutsDirPath, file));
        // Ищем все вхождения __behaviour с помощью глобального regex
        const behaviourMatches = [...content.matchAll(/\"__behaviour\"\s*:\s*\"([^\"]*)\"/g)];

        for (const match of behaviourMatches) {
            if (match[1]) {
                const behaviours = match[1].split(',')
                    .map(b => b.trim())
                    .filter(b => b);
                behaviours.forEach(b => requiredBehaviours.add(b + '.js'));
            }
        }
    });



    const sources = {
        "../../eeditor/engine/": [
            "3rdparty/es6-shim.js",
            "3rdparty/bowser.js",
            "globals.js",
            "bus.js",
            "wfont.js",
            "basicTypes.js",
            "renderer.js",
            "object3d.js",
            "camera.js",
            "events.js",
            "node.js",
            "engine.js",
            "tweens.js",
            "html.js",
            "loadtasks.js",
            "localization.js",
            "text.js",
            "timer.js",
            "shadow.js",
            "windows.js"
        ],
        "src/": dirlist('*.js', srcDirPath),
        "src/behaviours/": allBehaviours.filter(file =>
            requiredBehaviours.has(file)
        )
    };

    var engineSources = sources["../../eeditor/engine/"];
    if (particles.length) {
        engineSources.push(
            "particles.js"
        );
    }

    if (sounds.length) {
        engineSources.push(
            "3rdparty/howler.core.js",
            "sound.js"
        );
    }

    if (spine.length) {
        // Добавляем spine файлы если нужны
        engineSources.push(
            "3rdparty/spine-webgl.js",
            "spineFactory.js"
        );
    }

    const srcFiles = sources["src/"];
    // Удаляем cheats.js если не нужен
    if (!CHEATS) {
        sources["src/"] = srcFiles.filter(file => file !== "cheats.js");
    } else {
        var cheatsIdx = srcFiles.indexOf("cheats.js");
        if (cheatsIdx != -1) {
            const cheatsFile = srcFiles.splice(cheatsIdx, 1)[0];
            srcFiles.push(cheatsFile);
        }
    }

    return sources;
}


function getResources() {

    var res = $filter([
        // basic
        [
            "locale"
        ],
        [
            "atlas",
            "build_res/atlas-$LANG-0.png",
            "build_res/atlas-$LANG-0.json"
        ],

        [
            "config",
            {
                path: CONF_LEVEL,
                alias: "level"
            }
        ],

        [
            "class",
            "classes.json"
        ],

        ["shaders"].concat(shaders),

        // project resources

        sounds.length ? ["sound", "build_res/sounds.json"] : 0,

        fonts.length ? ["font"].concat($map(fonts, (font, ind) => (`$AD_FONT_${ind + 1}.ttf`))) : 0,

        layouts.length ? ["layout"].concat(layouts.filter(a => a != 'classes.json')) : 0,

        particles.length ? ["effect"].concat(particles) : 0


    ], a => a && a.length);

    return res;
}


function getOptions(debug) {

    var options = {
        __disableCache: debug,
        __disableCacheByVer: debug,
        __storeChildsAsObject: debug,
        __disableXHRRequests: debug ? 0 : 1,
        __supportedLangs: $filter(locales, l => l != "auto"),
        __defaultTextProperties: {
            __fontface: "$AD_FONT_1"
        },
        __baseFontsFolder:  debug ? "../fonts/" : "build_res/",
        __localesDir:  debug ? '../lang/' : 'lang/',
        __disablePacking: 1,
        __projectServerPath: SUBPROJECT + "/"
    };


    if (debug) {
        options.__baseShadersFolder = "../shaders/";
    }

    return options;
}

function getPacking() {
    // Отставляем только локаль "auto"
    const autoLocale = "auto";
    const result = { "LANG": autoLocale};
    let fontByLocale = buildOpts.fontsByLang[autoLocale];
    fontByLocale = isArray(fontByLocale) ? fontByLocale : fontByLocale.split(',');
    $each(fonts, (font, ind) => {
        let fontVar = `AD_FONT_${ind + 1}`;
        buildFlags[fontVar] = font.trim();
        result[fontVar] = font.trim() + `_${autoLocale}`;
    });
    return [result];

    // return $map(locales, a => {
    //     const result = { "LANG": a};
    //     let fontByLocale = buildOpts.fontsByLang[a] || buildOpts.fontsByLang["auto"];
    //     fontByLocale = isArray(fontByLocale) ? fontByLocale : fontByLocale.split(',');
    //     $each(fonts, (font, ind) => {
    //         let fontByInd = fontByLocale[ind];
    //         if (fontByInd) {
    //             result[`AD_FONT_${ind + 1}`] = fontByInd.trim() + `_${a}`;
    //         }
    //     });
    //     return result;
    // })
}

projectJson.src = getJsSources();
projectJson.options = getOptions(1);
projectJson.options_prod = getOptions(0);
projectJson.res = getResources();
projectJson.packing = getPacking();


// ********** other

projectJson.redirect_url = get(getJson(`${SUBPROJECT}/conf/${CONF_LEVEL}`), 'redirect_url');

buildFlags.SUBPROJECT = SUBPROJECT
buildFlags.VERSION = VERSION
buildFlags.CHEATS = CHEATS

fs.writeFileSync(projectJsonPath
    , JSON.stringify(projectJson, 0, 4)
    , 'utf-8')