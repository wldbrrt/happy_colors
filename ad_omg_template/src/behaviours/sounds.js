
options.__soundDisabled = 1;

function stopAllSounds() {
    var m = getSound('s_music');
    if (m) m.howl.stop();
}

function enableSounds() {
    BUS.__addEventListener(ON_POINTER_UP, m => {
        if (options.__soundDisabled) {
            options.__soundDisabled = 0;
            stopSound('how_old_brain_' + lang);
            playSound('how_old_brain_' + lang);

            stopSound('s_music');
            playSound('s_music', 1);
        }
        return 1;
    });
}

AD.addBehaviour('sounds', node => {

    var letter_min = 100, letter_max = -100, letter_t = 's_word_0', groups = {
        letter: {},
        word: {}
    };

    node.letterSound = function (num) {
        return letter_t + num
    }

    var soundsMap = set({},
        WORD_SOLVED, 's_word_succes',
        WORD_ALREADY_SOLVED, 's_word_repeat',
        WORD_BAD, ['s_word_wrong', 0, 0.01, 0.1],
        LEVEL_FAILED, 's_fail_lvl',
        LEVEL_COMPLETED, 's_complete_lvl',
        LEVEL_PRECOMPLETED, 's_precomplete_lvl',
        CONGRAT, 's_congrat',
        PRE_CONGRAT, 's_precongrat',
        WORD_NOT_GUESSED, 's_text_show',
        CTA_CLICK, 'b_click',
        IQ_CHANGED, 'counter',
        LETTERS_MIXED, 's_shuffle',
        HINT_USED, 's_hint',
        LETTER_SOLVED, w => {
            if(w.disableSound) return 0
            return w.word.solved ? 0 : node.letterSound(randomInt(letter_min, letter_max), w)
        },
        LETTER_SELECTED, a => { 
            if (a.isFake) return 0;
            return (a.isList && !a.useLetterSound) ? 'b_click' : node.letterSound(AD.selectedStack.length, a)
        },
        LETTER_UNSELECTED, a => { 
            return (a.isFake || a.isList) ? 0 : node.letterSound(AD.selectedStack.length, a)
        },

        CELL_SELECTED, "sfx_select_field",
        NUMBER_SELECTED, "sfx_number",
        CELL_SOLVED, "sfx_string_in",

        COLUMN_SOLVED, ['sfx_match_fx', 0, 0.01, 0.1],
        ROW_SOLVED, ['sfx_match_fx', 0, 0.01, 0.1],
        BLOCK_SOLVED, ['sfx_match_fx', 0, 0.01, 0.1],

        OBJECT_SOLVED, "sfx_string_in",

        ON_ERROR, "sfx_error",
        PROGRESS_BAR_CHANGED, "prog_bar",
        MONEY_COUNT_CHANGED, "prog_bar",
        ON_EVENT_FLY, [ "bubble", 0, 0, 0.1 ]

    );

    function _playSound(value) {
        if (value) {
            var valueIsArray = isArray(value)
                , sound_name = valueIsArray ? value[0] : value
                , sound_config = AD.config.sounds[sound_name]
                , arr_cfg = sound_config ? isArray(sound_config) ? sound_config : [ sound_config.loop, sound_config.delay, sound_config.smartUniqueTime, sound_config.fadeInTime ] : []
                , get_arg = (i, defval) => ifdef(arr_cfg[i], valueIsArray ? value[i+1] : defval)
                , loop = get_arg(0)
                , delay = get_arg(1)
                , smartUniqueTime = get_arg(2)
                , fadeInTime = get_arg(3);
            
            if (delay > 100){ // sound disabled
                return;
            }
            playSound(sound_name, loop, delay, smartUniqueTime, fadeInTime);            
        }
    }

    node.__busObservers = $map(soundsMap, value => {
        return ((message, data) => {
            _playSound(isFunction(value) ? value(data) : value)
        });
    });

    for (var i = 0; i < 9; ++i) {
        var sound = getSound(node.letterSound(i));
        if (sound) {
            sound.__group = groups.letter;
            if (i < letter_min) letter_min = i;
            if (i > letter_max) letter_max = i;
        }
    }

    function regGroup(a, g) {
        $each(a, s => { s = getSound(s); if (s) s.__group = g; });
    }

    regGroup(['s_hint'], groups.letter);
    regGroup(['s_text_show', 's_word_wrong'], groups.word);

    /*
    BUS.__addEventListener(__ON_VISIBILITY_CHANGED, (m, v) => { 
        if (!v && !options.__soundDisabled) {
            options.__soundDisabled = 1;
            stopAllSounds();
        } else if (v && options.__soundDisabled){
            enableSounds();
        }
    });
    */

    enableSounds();

    AD.sounds = node
});