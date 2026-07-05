
var lang // = 'ru'
    , DIR_TOP = 3
    , DIR_BOTTOM = 1
    , DIR_RIGHT = 0
    , DIR_LEFT = 2
    , DIR_TOP_RIGHT = 4
    , DIR_TOP_LEFT = 5
    , DIR_BOTTOM_RIGHT = 6
    , DIR_BOTTOM_LEFT = 7

    , ON_POINTER_UP = '__ON_POINTER_UP'
    , ON_POINTER_OUT = '__ON_POINTER_OUT'
    , ON_POINTER_DOWN = '__ON_POINTER_DOWN'

    , LETTER_SELECTED = '__LETTER_SELECTED'
    , LETTER_UNSELECTED = '__LETTER_UNSELECTED'
    , LETTER_SOLVED = '__LETTER_SOLVED'
    , LETTER_SOLVE = '__LETTER_SOLVE'
    , LETTERS_MIXED = '__LETTERS_MIXED'
    , WORD_SOLVED = '__WORD_SOLVED'
    , WORD_ALREADY_SOLVED = '__WORD_ALREADY_SOLVED'
    , WORD_BAD = '__WORD_BAD'
    , WORD_NOT_GUESSED = '__WORD_NOT_GUESSED'
    , WORD_SELECTED = '__WORD_SELECTED'
    , LEVEL_COMPLETED = '__LEVEL_COMPLETED'
    , LEVEL_PRECOMPLETED = '__LEVEL_PRECOMPLETED'
    , LEVEL_FAILED = '__LEVEL_FAILED'
    , LEVEL_NEXT = '__LEVEL_NEXT'
    , LEVEL_READY = '__LEVEL_READY'
    , LEVEL_STARTED = '__LEVEL_STARTED'
    , LEVEL_STEP_COMPLETED = '__LEVEL_STEP_COMPLETED'
    , LETTER_DRAG = '__LETTER_DRAG'
    , CONGRAT = '__CONGRAT'
    , CONGRAT_POSTED = '__CONGRAT_POSTED'
    , PRE_CONGRAT = '__PRE_CONGRAT'
    , CTA_CLICK = '__CTA_CLICK'
    , HINT_USED = '__HINT_USED'
    , IQ_CHANGED = '__IQ_CHANGED'
    , ON_ORIENTATION_CHANGED = '__ON_ORIENTATION_CHANGED'
    , ON_ERROR = "__ON_ERROR"
    , ON_REDIRECT = "__ON_REDIRECT"
    , CELL_SELECTED = "__CELL_SELECTED"
    , CELL_SOLVED = "__CELL_SOLVED"
    , COLUMN_SOLVED = "__COLUMN_SOLVED"
    , ROW_SOLVED = "__ROW_SOLVED"
    , BLOCK_SOLVED = "__BLOCK_SOLVED"
    , OBJECT_SOLVED = "__OBJECT_SOLVED"
    , COLOR_SELECTED = "__COLOR_SELECTED"
    , COLOR_CHANGED = "__COLOR_CHANGED"

    , NUMBER_SELECTED = "__NUMBER_SELECTED"
    , PROGRESS_BAR_CHANGED = "__PROGRESS_BAR_CHANGED"
    , MONEY_COUNT_CHANGED = "__MONEY_COUNT_CHANGED"
    , ITEMS_COUNT_CHANGED = "__ITEMS_COUNT_CHANGED"
    , COUNTER_CHANGED = "__COUNTER_CHANGED"
    , ON_EVENT_FLY = "__ON_EVENT_FLY"
    , MONEY_BOX_OPENED = "__MONEY_BOX_OPENED"
    , ON_WARNING_ON = "__ON_WARNING_ON"
    , ON_WARNING_OFF = "__ON_WARNING_OFF"
    , EXCELLENT = "__EXCELLENT"

    , ON_VIEW_RESET = "__ON_VIEW__RESET"
    , CAROUSEL_DATA_READY = "__CAROUSEL_DATA_READY"

    , ORIENTATION_PORTRAIT = 0
    , ORIENTATION_LANDSCAPE = 1;

var Word = makeClass(function (word, k) {
    var t = this;
    if (isObject(word) && isString(k)) {
        t.no_hint_at_begin = word.no_hint_at_begin;

        if (isArray(word.path)) {
            t.path = word.path.map(dir => {
                return dirtodir(dir)
            });
        } 
        t.dir = dirtodir(word.dir);
        t.pos = new Vector2(word.x, word.y);
        
        if (word.color) {
            t.color = new Color().__fromJson(word.color);
        }

        t.letter_cfg = word.letter_cfg;
        t.letters_sorting = word.letters_sorting;
        t.solved = word.solved;
        t.word_list_word = word.word_list_word
        word = k;
    }

    t.isVertical = t.dir == DIR_BOTTOM || t.dir == DIR_TOP;
    t.isHorisontal = !t.isVertical;
    t.lettersCount = {};
    t.text = word.toUpperCase();
    t.len = word.length;
    
    
    t.letters_list = t.text.split('');
    t.original_letters_list = t.text.split('');

    for (var i = 0; i < t.len; i++) {
        var letter = t.letters_list[i];
        t.lettersCount[letter] = (t.lettersCount[letter] || 0) + 1;
    }

}, {
    eachLetter(f) {
        for (var i = 0; i < this.len; i++) {
            f(this.letters_list[i], i);
        }
    },
    getLetterConfig(i){
        return (isArray(this.letter_cfg) ? this.letter_cfg[i] : this.letter_cfg) || {};
    },
    forceSolveLetter(letterIdx) {
        var t = this
            , letter = t.letters_list[letterIdx];

        if (letter && t.lettersCount[letter]) {
            t.letters_list[letterIdx] = 0;
            t.lettersCount[letter]--;
        }
    },
    formatText(format) {
        return formatText(this.text, format);
    }

});


var Config = makeClass(function (levelData, data) {

    var t = this;

    data = data || {};

    t.data = data;

    t.words_dict = {};
    
    var words = levelData.words || data.words;
    words = $find(words, d => d.lang == lang)
    if (!words) words = $find(words, d => d.lang == 'en')

    var cfgslist = {
        redirect_url: '',
        tapsToRedirect: 0,
        back: '',
        wordsToRedirect: -1,
        openFirstLetter: 0,
        ha: 1,
        sorted: 0,
        type: 0,
        wrong_words: 0,
        tutorWord: -1,
        excellentTimeout: 2,
        startTimeout: 2,
        failedTimeout: 0,
        completeTimeout: 0,
        redirectTimeout: 0,
        redirectCongratTimeout: 0,
        redirectOnTapCongrat: 0,
        redirectOnTap: 0,
        redirectOnTapPrecongrat: 0,
        screen_aspect_factor: 1,
        congratOnLevelCompleted: -1,
        congratOnLevelFailed: -1,
        precongratOnLevelCompleted: -1,
        precongratOnLevelFailed: -1,
        precongratTimeout: 0,
        redirectOnGameEnd: 1,
        completeDelay: 0,
        failedDelay: 0,
        field: 0,
        solved: 0,
        visible: 0,
        congratEffect: 'blur',
        gameEndOnFail: 0,
        gameEndOnComplete: 1,
        solve_cells_to_redirect: -1,
        solve_cells_to_complete: -1,
        solve_blocks_to_complete: -1,
        cells_amount_to_solve: 0,
        max_cells_to_select: 0,
        fail_on_full_mergebar: 1,
        finger_fly_gap: 20,
        finger_speed: 4,
        tutor_step_delay: 0.01,
        grid: 0,
        congratSlides: 0,
        fillwordData: 0,
        solved_words: 0,
        sounds: 0,
        start_money_count: 0,
        start_brain_percent_count: 0,
        tutor_cell: 0,
        shuffledLetters: 0,
        solved_words_to_complete: -1,
        sudoku_digits_count: 9,
        items_total_count: 0,
        letter_circle_uses_words_for_letters_list: 0,
        letter_list_uses_words_for_letters: 0,
        disablePortraitSafeArea: 0,
        disableLandscapeSafeArea: 0,
        need_scroll_puzzles_count_landscape: 6,
        need_scroll_puzzles_count_portrait: 6,
        counters: 0,
        sudoku_colors: 0,
        sudoku_digit_colors: 0,
        completeOnTap: 0,
        completeOnTapAfterSelection: 0,
        add_cells_coins_from_start: 1,
        mini_sudoku_size: -1,
        digitToSolve: 0,
        skipPrecongratOnTimeExpired: 0,
        sudoku_digits_map: 0,
        startNextLevelOnComplete: 1,
        multiStepLevelMode: 0,
        gridSpeed: 0,
        colors: []
    };

    $each(cfgslist, (v, k) => {
        if (words && k in words) {
            t[k] = words[k];
        } else if (k in levelData) {
            t[k] = levelData[k];
        } else if (k in data) {
            t[k] = data[k];
        } else {
            t[k] = v;
        }
    });

    if (words) {
        var grid = words.grid || data.grid;
        if (grid) {
            t.grid = new Vector2(grid.x, grid.y);
        }

        var letter_cfg = words.letter_cfg;

        var letters_pattern = words.letters_circle_pattern || words.letters_pattern || 0;

        words = words.words;

        t.words_list = [];
        for (var i = 0; i < words.length; i += 2) {
            t.words_list.push(new Word(words[i + 1], words[i]));
        };

        if (letter_cfg) {
            $each(t.words_list, w => w.letter_cfg = letter_cfg);
        }

        $each(t.words_list, (w, i) => {
            t.words_dict[w.text] = w;
            w.index = i;
        })

        t.lettersCount = {};
        t.letters_list = [];

        $each(t.words_list, word => {
            $each(word.lettersCount, (count, letter) => {
                if (count > (t.lettersCount[letter] || 0)) {
                    t.lettersCount[letter] = count;
                }
            });
        });

        if (letters_pattern) {
            t.letters_list = letters_pattern.split('');
        } else {
            $each(t.lettersCount, (c, l) => {
                for (var i = 0; i < c; i++) {
                    t.letters_list.push(l);
                }     
            });
        }

        if (!t.sorted) {
            t.words_list.sort((a, b) => a.len - b.len);
        }
    }

    if (t.solved_words_to_complete == -1 && t.words_list) {
        t.solved_words_to_complete = t.words_list.length;
    }

    $each(t.words_list, word => {
        if (word.solved) {
            t.solved_words++;
            word.eachLetter((l, i) => {
                word.forceSolveLetter(i);
            })
        }
    });
    
    t.sounds = plainArrayToObject(t.sounds) || {};

    Counters.__init(t.counters);

}, {

    getTutorWord() {
        if(isArray(this.tutorWord)) {
            return $findResult(this.tutorWord, id => {
                var currentWord = this.words_list[id];
                if (!currentWord.solved) {
                    return currentWord;
                }
            });
        }
        if (this.tutorWord >= 0) {
            return this.words_list[this.tutorWord];
        }
        var min = 100;
        $each(this.words_list, w => { if (w.len < min) min = w.len; });
        var minlist = $filter(this.words_list, w => w.len == min && !w.no_hint_at_begin);
        return minlist[randomInt(0, minlist.length - 1)];
    }

});



var AD = makeSingleton({

    orientation: -1,
    behaviuors: {},
    tapsCount: 0,
    selectedStack: []

}, {
    getMainNode() {
        return this.mainNode;
    }

    , getLevelNode() {
        return getNodeByAlias(this.mainNode, 'level', { level: 1});
    }

    , getLevelFieldNode() {
        return getNodeByAlias(this.mainNode, '__levelPanel', { __levelPanel: 1});
    }

    , nodeForSafeAreaPortrait(node) {
        return node.level || node;
    }

    , nodeForSafeAreaLandscape(node) {
        return node.level ? node.level.__mainPanel || node.level : node;
    }

    , updateSafeArea(node) {
        if (node && _bowser.mobile) {
            // there is no correct method to do it right
            // var padding = getSafeAreaPaddings();
            
            var orientation = AD.__orientation
                /// \todo: configure values by config
                , padTop = AD.config.disablePortraitSafeArea ? 0 : 60
                , padLeft = AD.config.disableLandscapeSafeArea ? 0 : 100
                , padding = orientation == ORIENTATION_PORTRAIT ? [padTop, 0, 0, 0] : [0, padLeft, 0, 0]
                , node_l = AD.nodeForSafeAreaLandscape(node)
                , node_p = AD.nodeForSafeAreaPortrait(node);

            if (orientation == ORIENTATION_PORTRAIT) {
                if (node_l) node_l.__padding = 0;
                if (node_p) node_p.__padding = padding;
            } else {
                if (node_l) node_l.__padding = padding;
                if (node_p) node_p.__padding = 0;
            }
        }
    }

    , addLevelView(levelIndex) {
        var levelConfig = getDataTableSources('level');
        if (isArray(levelConfig.levels)) {
            AD.config = new Config(levelConfig.levels[levelIndex], levelConfig);
        } else {
            AD.config = new Config(levelConfig);
        }

        onWindowResize(1); // force for presetup resolutions etc

        var layoutName = 'level_' + levelIndex;
        if (!hasLayout(layoutName)) {
            layoutName = 'main';
        }
        
        var node = new Node(layoutName);

        if (AD.mainNode) {
            node.__z = AD.mainNode.__z + 100;
        }

        addToScene(node);
        AD.processNode(node);
        AD.__failedByTimeout = 0;
        AD.__timeExpired = 0;

        if (AD.config.failedTimeout > 0) {
            AD.__failedTimeoutId =  _setTimeout(a => {
                AD.__timeExpired = 1
                AD.__controller.LevelFailed();
            }, AD.config.failedTimeout);
        }

        if (AD.config.completeTimeout > 0) {
            AD.__completeTimeoutId = _setTimeout(a => {
                AD.__timeExpired = 1
                AD.__controller.LevelCompleted();
            }, AD.config.completeTimeout);
        }

        if (AD.config.redirectTimeout > 0) {
            _setTimeout(a => { 
                if (AD.config.redirectOnTap) {
                    AD.mainNode.__addBusObservers(ON_POINTER_UP, a => AD.__redirect());
                } else {
                    AD.__redirect();
                }
            }, AD.config.redirectTimeout);
        }

        return node;
    }

    , startLevel(levelIndex, isNext) {

        var mainNode = AD.mainNode;

        if(!AD.__levelReadyListener) {
            AD.__levelReadyListener = BUS.__addEventListener(LEVEL_READY, () => _setTimeout(() => {
                    AD.__levelReadyListener = 0
                    BUS.__post(LEVEL_STARTED);
                }, 0.001)
            );
        }

        if (isNext) {
            disableInput(3);

            _setTimeout(a => {
                BUS.__post(LEVEL_NEXT);
            }, 1);

            _setTimeout(function () {

                AD.tapsCount = 0;

                Effects.__run(mainNode, Effects.animOut, { __anim_type: ANIM_FADE });
                
                AD.mainNode = AD.addLevelView(levelIndex);

                onWindowResize(1); // force for ON_ORIENTATION_CHANGED / updateSafeArea etc

            }, AD.config.startTimeout);


        } else {
            if (mainNode) {
                mainNode.__removeFromParent();
            }
            AD.mainNode = AD.addLevelView(levelIndex);

            onWindowResize(1); // force for ON_ORIENTATION_CHANGED / updateSafeArea etc
        }



    }

    , gameEnd() {
        // for mintegral now
        if (!AD.gameEndPosted) {
            AD.gameEndPosted = 1;
            BUS.__post(__ON_GAME_END);
        }
    }

    , __redirect(url) {
        AD.gameEnd()
        html.__openAppStore(url || AD.config.redirect_url);
    }

    , addBehaviour(name, func) {
        AD.behaviuors[name] = func;
    }
    , processNode(node) {
        var behaviuors = AD.behaviuors;
        node.__traverse(n => {
            if (n.__behaviour) {
                n.__behaviours = explodeString(n.__behaviour, ',', 1);
                $each(n.__behaviours, behaviuor => {
                    var f = behaviuors[behaviuor];
                    if (f) {
                        f(n);
                    }
                    else {
                        consoleDebug("undefined behaviour", behaviuor);
                    }
                });
            }
        });
        return node;
    }

}, {

});


setupWindowOptions = function (force, w, h, ratio) {

    var _aspect = w / h
        , _old = AD.__orientation
        , _new = _aspect > ((AD.config || 0).screen_aspect_factor || 1) ? ORIENTATION_LANDSCAPE : ORIENTATION_PORTRAIT;

    if ((_old != _new) || force) {
        AD.__orientation = _new;

        options.__upscaleResolution = _new == ORIENTATION_LANDSCAPE ? { x: 960, y: 540 } : { x: 540, y: 960 };

        BUS.__addEventListener(__ON_RESIZE, a => {
            AD.updateSafeArea(AD.getMainNode());
            BUS.__post(ON_ORIENTATION_CHANGED);
            return 1
        });
    }

}




AD.__controller = (function () {

    BUS.__addEventListener(WORD_SELECTED, (m, word) => {

        var wordInst = isString(word) ? AD.config.words_dict[word] : word;


        BUS.__post(wordInst ? wordInst.solved ? WORD_ALREADY_SOLVED : WORD_SOLVED : WORD_BAD, wordInst || word);

        if (wordInst) {

            if (!wordInst.solved) {
                wordInst.solved = 1;

                AD.__controller.lastLetterSolvedTime = TIME_NOW;
                AD.__controller.lastWordSolvedTime = TIME_NOW;

                wordInst.eachLetter((l, i) => {
                    if (l) {
                        wordInst.letters_list[i] = 0;
                        wordInst.lettersCount[l]--;
                        BUS.__post(LETTER_SOLVED, { word: wordInst, letterIndex: i });
                    }
                });

                AD.config.solved_words++;

                var solvedWords = AD.config.solved_words - (Counters.hintsUsed || 0)

                if (solvedWords >= AD.config.solved_words_to_complete
                    || Counters.hintsToComplete && Counters.hintsUsed >= Counters.hintsToComplete
                ) {
                    if (AD.config.completeOnTap) {
                        BUS.__addEventListener(ON_POINTER_DOWN, a => AD.__controller.LevelCompleted() || 1)
                    } else {
                        AD.__controller.LevelCompleted();
                    }
                }
            }
        }
    });


    BUS.__addEventListener(ON_POINTER_UP, () => {
        if (!AD.config) return; // not loaded yet
        AD.tapsCount++;
        if (AD.gameCompleted) {
            AD.__redirect();
        } else if (AD.config.tapsToRedirect == AD.tapsCount) {
            AD.__redirect();
        } else if (AD.config.wordsToRedirect == AD.config.solved_words) {
            AD.config.wordsToRedirect = -1;
            AD.__redirect();
        } else if (AD.config.solve_cells_to_redirect > 0 && AD.solved_cells >= AD.config.solve_cells_to_redirect) {
            AD.__redirect();
        }     
    });

    BUS.__addEventListener(LETTER_SOLVE, (m, w) => {
        var wordInst = w.word, letterIndex = w.letterIndex;
        if (wordInst) {
            var letter = wordInst.letters_list[letterIndex];
            if (letter && wordInst.lettersCount[letter]) {
                wordInst.letters_list[letterIndex] = 0;
                wordInst.lettersCount[letter]--;
                AD.__controller.lastLetterSolvedTime = TIME_NOW;
                BUS.__post(LETTER_SOLVED, { word: wordInst, letterIndex: letterIndex });
                if (wordInst.lettersCount[letter] == 0) {
                    if (!$find(wordInst.lettersCount, v => v)) {
                        if (!wordInst.solved) {
                            BUS.__post(WORD_SELECTED, wordInst);
                        }
                    }
                }
            }
        }

    });

    function game_end() {
        AD.gameCompleted = 1;

        if (AD.config.redirectOnGameEnd) {
            AD.__redirect();
        }
    }

    BUS.__addEventListener(LEVEL_COMPLETED, a => {
        AD.tapsCount = 0;

        if (AD.config.startNextLevelOnComplete) {
            var levels = AD.config.data.levels
                , controller = AD.__controller
                , nextLevelIndex = ifdef(controller.nextLevelIndex, controller.levelIndex + 1);

            if (isArray(levels) && levels[nextLevelIndex]) {
                controller.levelIndex = nextLevelIndex;
                controller.nextLevelIndex = undefined;
                AD.startLevel(controller.levelIndex, 1);
                return;
            }
        }

        AD.win = 1;
        if (AD.config.gameEndOnComplete) {
            game_end()
        }
    });


    BUS.__addEventListener(LEVEL_FAILED, a => {
        if (AD.config.gameEndOnFail) {
            game_end()
        }
    });

    var clearTimeouts = () => {
        _clearTimeout(AD.__failedTimeoutId);
        _clearTimeout(AD.__completeTimeoutId);
    }


    return makeSingleton({
        lastLetterSolvedTime: 0,
        lastWordSolvedTime: 0,
        levelIndex: 0,

        LevelFailed(delay) {
            if (delay == undefined) delay = AD.config.failedDelay;
            if (delay) disableInput(delay, a => AD.__controller.LevelFailed(0));
            else {
                clearTimeouts();
                BUS.__post(LEVEL_FAILED);
            };
        },

        LevelCompleted(delay) {
            if (delay == undefined) delay = AD.config.completeDelay;
            if (delay) disableInput(AD.config.completeDelay, a => AD.__controller.LevelCompleted(0));
            else {
                clearTimeouts();
                BUS.__post(LEVEL_COMPLETED);
            };
        },

        getUnsolvedLetters(word) {
            if (word) {
                return $filter((word.crossword_letters || word.list_letters), l => !l.solved);
            }
            return concatArrays.apply(this, $map(AD.config.words_list, word => {
                if (!word.solved) {
                    return $filter(word.crossword_letters || word.list_letters, (l, i) => {
                        return !l.solved;
                    });
                }
            })).filter(function (item, pos, self) {
                return self.indexOf(item) == pos;
            });
        },

        onLevelReady(cb) {
            AD.level && AD.level.__ready ? cb() :
                BUS.__addEventListener(LEVEL_READY, cb);
        }
    }, {

    });

})();


BUS.__addEventListener(
    __ON_GAME_START, a => {

        lang = lang || getUserLanguage();

        options.__atlasFramesPrefix = lang + "-";

        AD.startLevel(0);

        return 1;
    }
);

function default_i_mod(i) { return i * 4; }

mergeObj(gestures, {
    __onPointerUp() { BUS.__post(ON_POINTER_UP); },
    __onPointerOut() { BUS.__post(ON_POINTER_OUT); },
    __onPointerDown() { BUS.__post(ON_POINTER_DOWN); }
});