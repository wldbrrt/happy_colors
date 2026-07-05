function hideTutorShade(node, duration) {
    if (node.__tutorShade) {
        if (duration == 0) {
            node.__tutorShade.__removeFromParent();
        } else {
            Effects.__run(node.__tutorShade, Effects.animOut, { __anim_type: ANIM_FADE, __duration: duration || 0.5 });
        }
        node.__tutorShade = 0;
    }
}

var Bubble = {
    __registered_bubbles: {},
    __show(b) {
        b = Bubble.__registered_bubbles[b];
        if (b) {
            b.__visible = 1;
            Bubble.__currentBubble = b;
        }
    },
    __hide() {
        if (Bubble.__currentBubble) {
            Bubble.__currentBubble.__visible = 0;
            Bubble.__currentBubble = 0;
        }
    }
}

AD.addBehaviour('bubble', node => {
    Bubble.__registered_bubbles[node.__propertyBinding || node.__numericInputStep] = node;
    node.__visible = 0;
});


var Finger = {
    z: -100,
    __speed: 4,
    __hideTime: 0,
    __show(opts) {

        Finger.__fly_gap = ifdef(AD.config.finger_fly_gap, 20);
        Finger.__speed = ifdef(AD.config.finger_speed, 4);

        if (!Finger.current) {
            var node = opts.__node
                , ud = node.__userData || {}
                , fingerNode = new Node({
                    __node: node,
                    __targetNode: opts.__targetNode,
                    __class: ud.__class || '__finger',
                    __z: Finger.z,
                    __onDestruct() {
                        updatable.__pop(this);
                    }
                })
                    .__anim({ __alphaDeep: [0, 1] }, ud.__fingerAnimInDuration);

            var baseOffset = fingerNode.__ofs.__clone();

            if (opts.__ofs) {
                baseOffset.add(opts.__ofs);
            }

            fingerNode.__baseOffset = baseOffset;

            switch (opts.__type) {
                case undefined:
                case 0:
                    fingerNode.__init({
                        __update(tm, dt) {
                            var t = this, node = t.__node;
                            var scale = opts.__scale || node.__getWorldScale().x;

                            t.__scaleF = scale;

                            /// \todo: calculate by sizes
                            var xgap = t.xgap || 0;
                            var ygap = t.ygap || (((node.__userData || {}).__yGap || 80) + Finger.__fly_gap * sin(TIME_NOW * Finger.__speed));
                            t.__ofs = [
                                node.__worldPosition.x + (baseOffset.x + xgap) * scale,
                                node.__worldPosition.y + (baseOffset.y + ygap) * scale
                            ];
                        },
                        __matcher: opts.__matcher,
                        __onHide: opts.__onHide
                    });

                    if (opts.__matcher) {
                        fingerNode.__addBusObservers(ON_POINTER_UP, Finger.__check);
                    } else {
                        fingerNode.__addBusObservers(ON_POINTER_UP, Finger.__hide);
                    }
                    break;

                case 1:

                    var fake_line = node.__addChildBox({ __class: '__line', isFake: fingerNode })
                        , tapAnimNode = getNodeByAlias(fingerNode, '__tapAnimNode', { __tapAnimNode: 1 })
                        , letters = opts.letters
                        , tutorWord = opts.word
                        , letters_list = tutorWord.original_letters_list.slice()
                        , tutorLetters = $map(
                            letters, l => {
                                var letterIndex = 100;
                                for (var i = 0; i < letters_list.length; i++) {
                                    if (letters_list[i] == l.letter) {
                                        letterIndex = i;
                                        letters_list[i] = 0;
                                        break;
                                    }
                                }
                                return {
                                    letter: l,
                                    letterIndex: letterIndex
                                }
                            }
                        );

                    AD.processNode(fake_line);
                    fingerNode.fake_line = fake_line;

                    tutorLetters = $filter(tutorLetters, a => a.letterIndex != 100).sort((a, b) => a.letterIndex - b.letterIndex);
                    tutorLetters = $map(tutorLetters, l => l.letter);
                    //debug
                    consoleLog("tutor word:", $map(tutorLetters, l => l.letter).join(''));
                    //undebug
                    var pp = 0, elapsed = -0.1;
                    baseOffset.y += 40;
                    fingerNode.__init({
                        __update(tm, dt) {
                            var t = this;
                            var le = elapsed;
                            elapsed += Finger.__speed * dt / 5000;
                            if (elapsed > 1.1) {
                                pp++;
                                if (!tutorLetters[pp + 1]) {
                                    if (elapsed > 2) {
                                        if (!t.__fingerAnim) $each(tutorLetters, l => l.__unselect(t));
                                        pp = 0;
                                        elapsed = -0.4;
                                        t.__alpha = 0;
                                        t.__anim({ __alpha: 1 }, 0.4);
                                    } else {
                                        if (t.fake_line && !tutorLetters[pp].__selected) {
                                            if (!t.__fingerAnim) tutorLetters[pp].__select(t);
                                            if (tapAnimNode) Effects.__run(tapAnimNode);
                                        }
                                        pp--;
                                    }
                                } else {
                                    elapsed = -0.1;
                                }
                            }

                            var part = easeSineIO(clamp(elapsed, 0, 1));
                            var scale = node.__getWorldScale().x;
                            t.__scaleF = scale;
                            /// \todo: calculate by sizes
                            var p1 = tutorLetters[pp];
                            var p2 = tutorLetters[pp + 1];

                            if (le <= 0 && elapsed > 0) {
                                if (t.fake_line) {
                                    if (!t.__fingerAnim) p1.__select(t);
                                    if (tapAnimNode) Effects.__run(tapAnimNode);
                                }
                            }

                            t.__mod_offset = baseOffset.__clone().__multiplyScalar(scale);

                            p1 = p1.__worldPosition.__clone().__add(t.__mod_offset);
                            p2 = p2.__worldPosition.__clone().__add(t.__mod_offset);

                            p1.lerp(p2, part);

                            if (elapsed < -0.1) {
                                p1.y += 200 * (-0.1 - elapsed);
                            }

                            t.__x = p1.x;
                            t.__y = p1.y;



                            if (t.fake_line) {
                                t.fake_line.update();
                            }
                        },
                        __onHide() {
                            if (this.fake_line) {
                                this.fake_line.__removeFromParent();
                                this.fake_line = 0;
                            }
                            $each(tutorLetters, l => l.__unselect(this));

                        }
                    })
                        .__addBusObservers(
                            ON_POINTER_DOWN, Finger.__hide,
                            ON_POINTER_UP, Finger.__hide
                        );
                    break;

                case 2:

                    var elapsed = -0.5, part;

                    fingerNode.__init({
                        __removeFakeNode() {
                            var t = this
                                , cellNode = t.__node.__rootCell ? t.__node.__rootCell.__cell : 0;

                            if (t.__fake_node) {
                                t.__fake_node.____animatronix = 0;
                                t.__fake_node.__anim({ __alphaDeep: 0 }, 0.2).__removeAfter(0.2);
                                t.__fake_node = 0;
                            }

                            if (cellNode) {
                                cellNode.__killAllAnimations();
                                cellNode.__alpha = 1;
                            }
                        },
                        __update(tm, dt) {
                            var t = this
                                , le = elapsed
                                , p1 = t.__node
                                , p2 = t.__targetNode
                                , scale = node.__getWorldScale().x
                                , startPos
                                , isRealDrag = opts.__realDrag;

                            elapsed += Finger.__speed * dt / 5000;

                            if (elapsed > 1.2) {
                                if (isRealDrag) {
                                    if (node.__dragStarted) {
                                        node.__dragStarted = 0;
                                        if (node.__dragEnd) node.__dragEnd(77);
                                        t.__anim({ __alpha: 0 }, 0.2);
                                    }
                                } else {
                                    t.__removeFakeNode();
                                    elapsed = -0.2;
                                }
                            }

                            if (isRealDrag && elapsed > 1.6) {
                                t.__anim({ __alpha: 1 }, 0.2);
                                elapsed = -0.2;
                            }

                            part = easeSineIO(clamp(elapsed, 0, 1));

                            t.__part = part;
                            t.__scaleF = scale;

                            t.__mod_offset = baseOffset.__clone().__multiplyScalar(scale);

                            p1 = p1.__worldPosition.__clone().__add(t.__mod_offset);
                            p2 = p2.__worldPosition.__clone().__add(t.__mod_offset);
                            startPos = p1.__clone();

                            if (sign(p1.x - p2.x) == 1) {
                                t.__rotate = 10 + 20 * part;
                            } else {
                                t.__rotate = 30 - 20 * part;
                            }

                            if (isRealDrag && elapsed > 0.8) {
                                part = 1 - part;
                            }

                            p1.lerp(p2, part);

                            if (isRealDrag) {
                                if (node.__dragStarted) {
                                    var dx = p1.x - startPos.x, dy = p1.y - startPos.y;
                                    if (node.__drag) node.__drag(p1.x, p1.y, dx, dy);
                                }
                            }

                            if (elapsed < -0.1) {
                                p1.y += 200 * (-0.1 - elapsed);
                            } else if (le < 0 && elapsed >= 0 && !t.__hided) {
                                if (isRealDrag) {
                                    if (node.__canDrag) {
                                        node.__dragStarted = 1;
                                        if (node.__dragStart) {
                                            node.__dragStart();
                                        }
                                    }
                                }
                                if (opts.__createFakeNode) {
                                    t.__removeFakeNode();
                                    var n = t.__fake_node = opts.__createFakeNode();

                                    if (n) {
                                        n.__z = Finger.z + 0.01;
                                        addToScene(n);
                                    }
                                }
                            }

                            if (!t.__hided) {
                                if (opts.__onAnimStart && !t.isAnimStarted && le < 0 && elapsed >= 0) {
                                    t.isAnimStarted = 1;
                                    opts.__onAnimStart();
                                } else if (opts.__onAnimEnd && part > 0.9 && t.isAnimStarted) {
                                    t.isAnimStarted = 0;
                                    opts.__onAnimEnd();
                                }
                            }

                            if (!isRealDrag || elapsed < 0.8) t.__offset.set(p1.x, p1.y, Finger.z);
                        },
                        __onHide() {
                            this.__hided = 1;
                            this.__removeFakeNode();

                            if (opts.__onAnimEnd && this.isAnimStarted) {
                                this.isAnimStarted = 0;
                                opts.__onAnimEnd(1);
                            }
                        }
                    })
                        .__addBusObservers(
                            ON_POINTER_DOWN, Finger.__hide,
                            ON_POINTER_UP, Finger.__hide
                        );
                    break;

                case 3:

                    var letters = opts.letters
                        , tutorWord = opts.word
                        , controller = opts.controller
                        , pp = 0
                        , startElapsed = -0.6
                        , elapsed = startElapsed
                        , selectLettersAmount = opts.selectLettersAmount
                        , isCanceled
                        , holdTime = opts.__holdTime || 0
                        , dipAmplitude = opts.__dipAmplitude || 0
                        , holdTimeMod = holdTime ? holdTime / 1000 : 0
                        , holdLiftPx = opts.__holdLiftPx || 0;

                    //todo: добавить рассчет высоты

                    baseOffset.y += 80;

                    var hold = 0;

                    fingerNode.__init({
                        __update(tm, dt) {
                            var t = this;
                            var le = elapsed;
                            elapsed += Finger.__speed * dt / 5000;

                            if (hold > 0) {
                                hold -= dt;
                                if (hold < 0) hold = 0;
                            }

                            if (elapsed > 1) {
                                pp++;
                                pp = Math.min(pp, letters.length - 1);
                                if (!letters[pp + 1]) {
                                    if (elapsed > 1.3 && le < 1.3) {
                                        t.__anim({ __alpha: 0 }, 3 / Finger.__speed);
                                    }
                                    if (elapsed > 2) {
                                        if (!isCanceled) {
                                            if (controller) controller.__unselectAllCells()
                                        }
                                        pp = 0;
                                        elapsed = startElapsed
                                        t.__anim({ __alpha: 1 }, 3 / Finger.__speed);

                                        t.__holdFirst = false;
                                        t.__holdLast = false;
                                    } else {
                                        if (isCanceled) return
                                        if (controller) controller.__selectCell(letters[pp], true, selectLettersAmount)

                                        if (!t.__holdLast) {
                                            t.__holdLast = true;
                                            hold = holdTime;
                                            elapsed -= holdTimeMod;
                                        }

                                        // pp--;
                                    }
                                } else {
                                    if (isCanceled) return
                                    if (controller) controller.__selectCell(letters[pp], true, selectLettersAmount)
                                    hold = holdTime;
                                    elapsed -= 1 + holdTimeMod
                                }
                            }

                            var part = clamp(elapsed, 0, 1)
                            var scale = node.__getWorldScale().x;
                            t.__scaleF = scale;

                            var p1 = letters[pp];
                            var p2 = letters[pp + 1] || p1;

                            if (le <= 0 && elapsed > 0) {
                                if (isCanceled) return
                                if (controller) controller.__selectCell(p1, true, selectLettersAmount)

                                if (!t.__holdFirst) {
                                    t.__holdFirst = true;
                                    hold = holdTime;
                                    elapsed -= (holdTimeMod);
                                }
                            }

                            t.__mod_offset = baseOffset.__clone().__multiplyScalar(scale);

                            var wp1 = p1.__worldPosition.__clone().__add(t.__mod_offset);
                            var wp2 = p2.__worldPosition.__clone().__add(t.__mod_offset);

                            var gap = wp1.__clone().__sub(wp2).__length();

                            if (hold > 0) part = 0;

                            wp1.lerp(wp2, part);

                            var gapThreshold = 1 * node.__getWorldScale().x * 10
                                , dip = sin(mmax(0, mmin(1, part)) * PI) * dipAmplitude * scale;

                            if (gap > gapThreshold && part > 0 && part < 1) {
                                wp1.y += dip;
                            }

                            if (elapsed < 0 && hold <= 0) {
                                wp1.y -= 20 * elapsed;
                            }

                            if (hold > 0) {
                                var effectiveHoldTime = holdTime;

                                var holdProgress = 1 - (hold / effectiveHoldTime);
                                holdProgress = clamp(holdProgress, 0, 1);
                                var lift = Math.sin(holdProgress * Math.PI) * holdLiftPx * scale;
                                var yDuringHold = wp1.y - lift;
                                t.__x = wp1.x;
                                t.__y = yDuringHold;
                            } else {
                                t.__x = wp1.x;
                                t.__y = wp1.y;
                            }
                        },
                        __onHide() {
                            if (controller) controller.__unselectAllCells()
                            isCanceled = true
                        }
                    })

                    if (opts.__matcher) {
                        fingerNode.__addBusObservers(ON_POINTER_UP, Finger.__check);
                        fingerNode.__addBusObservers(ON_POINTER_DOWN, Finger.__check);
                    } else {
                        fingerNode.__addBusObservers(ON_POINTER_UP, Finger.__hide);
                        fingerNode.__addBusObservers(ON_POINTER_DOWN, Finger.__hide);
                    }
                    break;

                case 4:
                    var elapsed = -0.6, part
                        , gap = () => Finger.__fly_gap / 2 * (1 - cos(2 * PI * ((__gameTime * Finger.__speed / ONE_SECOND / 3) % 1)))
                    fingerNode.__init({
                        __update(tm, dt) {
                            var t = this
                                , getPos1 = opts.__getPos1
                                , getPos2 = opts.__getPos2
                                , scale = opts.__scale()
                            elapsed += Finger.__speed * dt / 5000;
                            t.__mod_offset = baseOffset.__clone().__multiplyScalar(scale);
                            t.__scaleF = scale;

                            var p1 = getPos1().__clone().__add(t.__mod_offset)
                                , p2 = getPos2().__clone().__add(t.__mod_offset)
                                , le = (el) => clamp(el, 0, 1);

                            if (elapsed < 0) { // палец указывает на 1 позицию
                                t.ygap = t.xgap = gap() * scale;
                            }
                            else if (elapsed < 1) { // палец летит ко 2й позиции
                                part = le(elapsed);
                                t.ygap = t.xgap = lerp(t.xgap, 0, part);
                                p1.lerp(p2, part);
                            }
                            else if (elapsed < 1.6) { // палец указывает на 2 позицию
                                t.ygap = t.xgap = gap() * scale;
                                p1 = p2;
                            }
                            else if (elapsed < 2.6) { // палец летит ко 1й позиции
                                part = le(elapsed - 1.6);
                                t.ygap = t.xgap = lerp(t.xgap, 0, part);
                                p1 = p2.lerp(p1, part);
                            }
                            else {
                                elapsed = -0.6;
                                t.ygap = t.xgap = gap() * scale;
                            }

                            t.__offset.set(p1.x + t.xgap, p1.y + t.ygap, Finger.z);
                        },
                        __matcher: opts.__matcher
                    });

                    if (opts.__matcher) {
                        fingerNode.__addBusObservers(ON_POINTER_UP, Finger.__check);
                    } else {
                        fingerNode.__addBusObservers(ON_POINTER_UP, Finger.__hide);
                    }
                    break;

                case 5:

                    var tapAnimNode = getNodeByAlias(fingerNode, '__tapAnimNode', { __tapAnimNode: 1 })
                        , tutorLetter = opts.letter;

                    var elapsed = -0.1;
                    baseOffset.y += 40;
                    fingerNode.__init({
                        __update(tm, dt) {
                            var t = this, le = elapsed;

                            elapsed += Finger.__speed * dt / 5000;

                            if (elapsed > 1) {
                                if (!t.__fingerAnim) tutorLetter.__unselect(1);
                                elapsed = -0.4;
                            }

                            var scale = node.__getWorldScale().x;
                            t.__scaleF = scale;

                            if (le <= 0 && elapsed > 0) {
                                if (!t.__fingerAnim) tutorLetter.__select(t);
                                if (tapAnimNode) Effects.__run(tapAnimNode);
                            }

                            t.__mod_offset = baseOffset.__clone().__multiplyScalar(scale);

                            var pos = tutorLetter.__worldPosition.__clone().__add(t.__mod_offset);

                            if (elapsed > 0.2 && elapsed < 0.8) {
                                pos.y += 40 * easeSineIO((elapsed - 0.2) / 0.6);
                            } else if (elapsed >= 0.8) {
                                pos.y += 40;
                            }

                            if (elapsed < -0.1) {
                                pos.y += 200 * (-0.1 - elapsed);
                            }

                            t.__x = pos.x;
                            t.__y = pos.y;

                        },
                        __onHide() {
                            tutorLetter.__unselect(this);
                        }
                    })
                        .__addBusObservers(
                            ON_POINTER_DOWN, Finger.__hide
                        );

                    break;
            }

            Finger.current = fingerNode;
            addToScene(fingerNode);
            if (fingerNode.__update) {
                updatable.__push(fingerNode);
            }
        }
    },

    __check() {
        var fingerNode = Finger.current, matcher = (fingerNode || 0).__matcher;
        if (matcher) {
            if (matcher.__isGood()) {
                if (matcher.__onGood) matcher.__onGood();
            } else {
                if (matcher.__onBad) matcher.__onBad();
            }
        }
    },

    __hide() {
        var fingerNode = Finger.current;
        if (fingerNode) {

            fingerNode.__busObservers = 0;

            if (fingerNode.__onHide) {
                fingerNode.__onHide();
            }

            this.__fingerAnim = fingerNode.__anim({ __alphaDeep: 0 }).__removeAfter(0.5);

            Finger.__hideTime = TIME_NOW;
            Finger.current = 0;
        }
        return 1
    }
};

function get_cell(level, userData) {
    var cell = userData.cell || userData;
    return isObject(cell) ? level.cell(cell.x, cell.y) : isArray(cell) ? level.cell(cell[0], cell[1]) : 0;
};

function getLevel(userData) {
    return (isArray(AD.level) ? AD.level[userData.__cellsZ || 0] : AD.level);
}


function getTutorialCell(userData, matcher) {
    var cell = userData.cell || userData
        , level = getLevel(userData);

    if (matcher) {
        return level.__getNearestToCenterCell(matcher, userData.__cellsZ);
    }

    return isObject(cell) ? level.__cell(cell.x, cell.y, cell.z) : isArray(cell) ? level.__cell(cell[0], cell[1], cell[2]) : 0;

};

function each_sudoku_cell(userData, f) {

    var cell = getTutorialCell(userData)
        , matches = userData.matches
        , notmatches = userData.notmatches
        , matchCell = matches ? isObject(matches) ? c => !$find(matches, (v, k) => c[k] != v) : c => 1 : 0
        , notmatchCell = notmatches ? isObject(notmatches) ? c => !$find(notmatches, (v, k) => c[k] != v) : 0 : 0
        , cells = userData.cells ? $map(userData.cells, () => getTutorialCell(userData)) : matchCell || notmatchCell ? /* AD.level.all_cells */AD.level.__cells[0] : cell ? [cell] : 0
        , functor = matchCell ? notmatchCell ?
            c => matchCell(c) && !notmatchCell(c) && f(c)
            : c => matchCell(c) && f(c) :
            notmatchCell ? c => !notmatchCell(c) && f(c) : f;

    $each(cells, functor);
};


var Tutorials = set({
    __queue: [],
    __tutorsForCurrLevel: [],

    __onCompleted(tutor) {
        tutor.__completed = 1;

        tutor.__cur_interval = _clearInterval(tutor.__cur_interval);
        tutor.__cur_timeout = _clearTimeout(tutor.__cur_timeout);

        if (this.__currentTutor == tutor) {
            this.__currentTutor = 0;
            Tutorials.__queue.shift();
            this.__processQueue();
        }
    },

    __processQueueForce() {
        if (Tutorials.__queue.length) {
            Tutorials.__queue.sort((a, b) => a.__step - b.__step)
            var e = Tutorials.__queue[0]
                , tutor_type = e.__type
                //debug
                , type_style = 'color: blue; font-style: italic;'
                , name_style = 'color: green;'
                //undebug
                , userData = e.__userData || {};

            //debug
            console.log("start tutorial %c%s %c%s", name_style, "'" + e.__name + "'", type_style, "< " + tutor_type + " > ", userData);
            //undebug

            Tutorials.__currentTutor = e.__step ? {
                __start: e.__tutor.__start
            } : e.__tutor;


            if (userData.delay) {
                disableInput(userData.delay, a => {
                    Tutorials.__currentTutor.__start(e.__node, userData);
                });
            } else {
                Tutorials.__currentTutor.__start(e.__node, userData);
            }
        }
    },

    __processQueue(delay) {
        delay = delay == undefined ? AD.config.tutor_step_delay || 0 : delay;

        function processTutorials() {
            Tutorials.__startTutorPosted = 0;
            Tutorials.__processQueueForce();
        }

        if (Tutorials.__queue.length) {
            var e = Tutorials.__queue[0]
                , userData = e.__userData || {};

            if (delay) {
                if (!Tutorials.__startTutorPosted) {
                    Tutorials.__startTutorPosted = 1;
                    if (userData.__enableInput) {
                        _setTimeout(processTutorials, delay);
                    } else {
                        disableInput(delay, processTutorials);
                    }
                }
            } else {
                Tutorials.__processQueueForce()
            }
        }
    },

    __startTutor(tutor) {
        if (this.__currentTutor != tutor) {
            this.__currentTutor = tutor;
            Tutorials.__queue.unshift(tutor);
            tutor.__started = 1;
            this.__processQueue();
        }
    },

    __stopTutor(tutor) {
        if (tutor.__started) {
            if (Tutorials.__queue[0] == tutor) {
                Tutorials.__queue.shift();
            }
        }
    }
},


    'hint',
    {
        __start(node, userData = {}) {
            var failsToShowHint = userData.__failsToShowHint
                , showOnMismatchLetters = userData.__showOnMismatchLetters || 0
                , period = userData.__period == undefined ? 10 : userData.__period;

            function showHint() {
                Finger.__show({
                    __node: node
                });
                Bubble.__show(userData.__bubble);
            }

            if (failsToShowHint) {
                var failsAmount = 0

                node.__addBusObservers(
                    WORD_BAD, word => {
                        if (Counters.__get('hints') == 0) {
                            Tutorials.__onCompleted(this);
                            return 1;
                        }
                        failsAmount++
                        if (failsAmount >= failsToShowHint) {
                            showHint()
                            failsAmount = 0
                        }
                    },
                    WORD_SOLVED, word => {
                        failsAmount = 0
                        Finger.__hide();
                        Bubble.__hide();
                    },

                    HINT_USED, () => {
                        failsAmount = 0
                        Finger.__hide();
                        Bubble.__hide();
                    }
                )

                if (showOnMismatchLetters) {
                    node.__addBusObservers(
                        LETTER_SELECTED, (m, l) => {
                            if (AD.selectedStack.length && AD.selectedStack.length >= failsToShowHint) {
                                _setTimeout(a => { showHint(); }, 0.1);
                            }
                        }
                    )
                }
            }

            if (period) {
                var startInterval = () => {
                    return _setInterval(i => {
                        if (AD.__controller.lastLetterSolvedTime < TIME_NOW - period) {
                            if (Finger.__hideTime < TIME_NOW - period) {
                                if (node.__destructed || Counters.__get('hints') == 0) {
                                    interval = _clearInterval(interval);
                                } else {
                                    showHint()
                                }
                            }
                        }
                    }, period / 3);
                }

                var interval = startInterval()


            }

            function hideHint() {
                if (interval) {
                    interval = _clearInterval(interval);
                    Finger.__hide();
                    Bubble.__hide();
                }
            }

            node.__addBusObservers(
                ON_POINTER_DOWN, () => {
                    hideHint();
                },

                ON_POINTER_UP, () => {
                    if (period) interval = startInterval();
                }
            )

            BUS.__addEventListener(
                LEVEL_COMPLETED, a => {
                    hideHint();
                    return 1;
                }
            );

        }
    },

    'timer_hint',
    {
        __start(node, userData = {}) {
            var period = userData.__period != undefined ? userData.__period : 3, timeout;

            var stopTutorial = () => {
                if ((node.__userData || {}).__effects) {
                    Effects.__run(node);
                } else {
                    node.__removeFromParent();
                }
                Tutorials.__onCompleted(this);
                _clearTimeout(timeout);
            }

            if (period) {
                timeout = _setTimeout(() => {
                    stopTutorial();
                }, period)
            }

            node.__addBusObservers(
                ON_POINTER_DOWN, () => {
                    stopTutorial()
                },
                LEVEL_COMPLETED, a => {
                    stopTutorial()
                    return 1;
                }
            )
        }
    },

    'sudoku_hint',
    {
        __start(node, userData) {

            var period = userData.__period == undefined ? 3 : userData.__period
                , errorThreshold = userData.__errorThreshold || 2
                , startTutorInterval;

            function startAnim() {
                Finger.__show({
                    __node: node,
                    __matcher: {
                        __onGood: a => {
                            Finger.__hide();
                            Bubble.__hide();
                        },
                        __isGood: a => 1,
                    }
                });
                Bubble.__show(userData.__bubble);
            }

            if (period) {
                startTutorInterval = _setInterval(i => {
                    if (AD.__controller.lastCellSolvedTime < TIME_NOW - period) {
                        if (Finger.__hideTime < TIME_NOW - period) {
                            startAnim();
                        }
                    }
                }, period);
            }

            var clInt = a => _clearInterval(startTutorInterval) || 1;

            node.__addBusObservers(
                ON_ERROR, a => {
                    if (Counters.__get('hints') == 0) {
                        Tutorials.__onCompleted(this);
                        return clInt();
                    }
                    var errors = Counters.__get('errors')
                    if (errors && errors % errorThreshold == 0) {
                        _setTimeout(startAnim, 0.3);
                    }
                },
                LEVEL_FAILED, clInt,
                LEVEL_COMPLETED, clInt
            );
        }
    },

    'drag_letters',
    {
        __start(node, userData) {
            var delay = userData.__delay || 2
                , repeat = userData.__repeat
                , completeOnWordSolved = userData.__completeOnWordSolved
                , showTutorFailsAmount = userData.__showTutorFailsAmount
                , selectLettersAmount = userData.__selectLettersAmount
                , repeatOnError = userData.__repeatOnError
                , errorThreshold = userData.__errorThreshold || 2
                , repeatOnIdle = userData.__repeatOnIdle
                , repeatTmout = userData.__repeatTmout || delay
                , t = this
                , startTutorTimeout

            function startFinger() {
                var tutorWord = AD.config.getTutorWord();
                if (tutorWord) {
                    var letters = tutorWord.lettersNodes;
                    if (letters) {
                        Finger.__show({
                            __node: node,
                            __type: 1,
                            letters: letters,
                            word: tutorWord
                        });
                    } else if (tutorWord.wordCells) {
                        Finger.__show({
                            __node: node,
                            __type: 3,
                            letters: tutorWord.wordCells,
                            word: tutorWord,
                            controller: AD.fillwordController,
                            selectLettersAmount: selectLettersAmount
                        });
                    }
                }
            }

            function startTimeout(delay) {
                if (t.__completed) return;

                if (!startTutorTimeout) {
                    startTutorTimeout = _setTimeout(a => {
                        startFinger();
                    }, delay || repeatTmout);
                }
            }

            function cltm() {
                if (repeat == 0) return 1;
                startTutorTimeout = _clearTimeout(startTutorTimeout);
                hideTutorShade(node);
                if (!repeat) {
                    Tutorials.__onCompleted(t);
                }
            }

            BUS.__addEventListener(ON_POINTER_DOWN, cltm);

            if (repeat < 0) { // infinite repeat
                if (repeatOnError) {
                    t.__failsAmount = 0;
                    function onBadWord() {
                        if (!repeat) return 1;
                        t.__failsAmount++;
                        if (t.__failsAmount >= errorThreshold) startTimeout(0.1);
                    }
                    BUS.__addEventListener(WORD_BAD, onBadWord);
                    BUS.__addEventListener(WORD_ALREADY_SOLVED, onBadWord);
                    BUS.__addEventListener(WORD_SOLVED, a => {
                        if (!repeat) return 1;
                        t.__failsAmount = 0;
                    });
                }
                if ((repeatOnError && repeatOnIdle) || !repeatOnError) {
                    BUS.__addEventListener(ON_POINTER_UP, a => repeat ? startTimeout() : 1);
                    BUS.__addEventListener(ON_POINTER_OUT, a => repeat ? startTimeout() : 1);
                }
            } else if (repeat > 0) {
                BUS.__addEventListener(ON_POINTER_OUT, startTimeout);
                BUS.__addEventListener(ON_POINTER_UP, a => {
                    repeat = mmax(repeat - 1, 0);
                    if (repeat == 0) return 1;
                    startTimeout();
                });
            }

            var onEnd = () => {
                repeat = undefined;
                Finger.__hide();
                cltm();
                return 1;
            }
            BUS.__addEventListener(LEVEL_PRECOMPLETED, onEnd);
            BUS.__addEventListener(LEVEL_COMPLETED, onEnd);

            if (completeOnWordSolved) {
                BUS.__addEventListener(WORD_SOLVED, onEnd);
            }

            if (showTutorFailsAmount) {
                BUS.__addEventListener(WORD_BAD, () => {
                    if (AD.fillwordController.__failsAmount >= showTutorFailsAmount) {
                        startFinger();
                        AD.fillwordController.__resetFailsAmount();
                    }
                });
            }

            startTimeout(delay);

        }
    },

    'init_cell', {
    __start(node, userData) {
        var init = userData.__init;
        each_sudoku_cell(userData, cell => mergeObj(cell, init));
        Tutorials.__onCompleted(this);
    }
},

    'cell',
    {
        __start(node, userData) {
            var t = this, cell = getTutorialCell(userData), level = getLevel(userData);

            if (cell) {
                level.__tutorCell = cell;
                Finger.__show({
                    __node: node,
                    __ofs: cell.__offset || cell.__cellPosition,
                    __matcher: {
                        __onGood: a => {
                            Finger.__hide();
                            Bubble.__hide();
                            level.__tutorCell = 0;
                            Tutorials.__onCompleted(t);
                        },
                        __isGood: a => userData.__completeOnTap || cell.__state == STATE_SELECTED,
                        __onBad: a => Bubble.__show(userData.__bubble)
                    }
                });
            } else {
                consoleDebug('no cell for cell tutor');
            }
        }
    },

    'sudoku_select_block', {
    __start(node, userData) {
        var cell = getTutorialCell(userData)
            , period = userData.__period || 10
            , step = userData.__step
            , offset = AD.level.__blocks[cell.__block].__getCenter()
            , tutorFinished = false
            , fingerInterval
            , animParams = {
                __thickness: userData.animThickness || 6,
                __duration: userData.animDuration || 1,
                __isReversed: true,
                __startAngleOffset: Math.PI * 1.25,
                __color: userData.__color
            };

        function showFinger() {
            Finger.__show({
                __node: node,
                __ofs: cell.__offset,
                __matcher: {
                    __isGood: a => { }
                }
            });
        }

        function startTimeout() {
            if (!tutorFinished) {
                fingerInterval = _setTimeout(() => {
                    showFinger()
                }, period)
            }
        }

        function stopTimeout() {
            _clearTimeout(fingerInterval)
        }

        if (step) {
            startTimeout()
        } else {
            _setTimeout(showFinger, animParams.__duration)
        }


        if (!cell.__solved) {
            AD.level_view.__updateSelectionFrame(offset, true, cell.__blockRef, animParams);
        } else {
            Tutorials.__onCompleted(this);
        }

        node.__addBusObservers(
            CELL_SOLVED, (eventName, event) => {
                if (event.cell == cell) {
                    Finger.__hide();
                    stopTimeout()
                    tutorFinished = true
                    Tutorials.__onCompleted(this);
                }
            },
            ON_POINTER_DOWN, stopTimeout,
            ON_POINTER_UP, startTimeout
        )
    }
},

    'sudoku',
    {
        __start(node, userData) {
            var t = this
                , digitTutor = $find(Tutorials.__tutorsForCurrLevel, t => t.__type == 'digit')
                , digitTutorTimeout
                , hintNode = getNodeByAlias(AD.getMainNode(), '__hint', { __hint: 1 })
                , hintTutorTimeout
                , cellTutorTimeout
                , cell
                , level = getLevel(userData)
                , period = userData.__period || 0
                , showTutorFailsAmount = ifdef(userData.__showTutorFailsAmount, 1)
                , startCellTmout = ifdef(userData.__startCellTmout, 3)
                , startDigitsTmout = ifdef(userData.__startDigitsTmout, 3);

            function startFinger(hintNode) {
                cell = getTutorialCell(userData, c => (!c.__solved && c.__visible));

                if (cell) {
                    Finger.__show({
                        __node: hintNode || node,
                        __ofs: hintNode ? 0 : cell.__offset,
                        __matcher: {
                            __onGood: a => {
                                level.__tutorCell = 0;
                                Finger.__hide();
                                cltmHint();
                            },
                            __isGood: a => 1,
                        }
                    });
                } else {
                    onEnd();
                }
            }

            function startDigitTutor(tmout) {
                if (!digitTutorTimeout) {
                    digitTutorTimeout = _setTimeout(t => {
                        Tutorials.__startTutor(digitTutor);
                    }, tmout || startDigitsTmout);
                }
            }

            function cltmDigit() {
                level.__tutorCell = 0;
                Finger.__hide();
                Tutorials.__stopTutor(digitTutor);
                digitTutorTimeout = _clearTimeout(digitTutorTimeout);
            }


            function startCellTutor(tmout) {
                if (!cellTutorTimeout) {
                    cellTutorTimeout = _setTimeout(t => {
                        if (userData.__setCellSelected) {
                            cell = getTutorialCell(userData, c => (!c.__solved && c.__visible));
                            if (cell) AD.sudokuController.__selectCell(cell).__resetField();
                        } else {
                            startFinger();
                        }
                    }, tmout || startCellTmout);
                }
            }

            function cltmCell() {
                Finger.__hide();
                cellTutorTimeout = _clearTimeout(cellTutorTimeout);
            }

            function startHintTutor() {
                hintTutorTimeout = _setTimeout(t => {
                    startFinger(hintNode);
                }, 0.2);
            }

            function cltmHint() {
                hintTutorTimeout = _clearTimeout(hintTutorTimeout);
            }

            if (period) {
                var startTutorInterval = _setInterval(i => {
                    if (AD.__controller.lastCellSelectedTime < TIME_NOW - period) {
                        if (Finger.__hideTime < TIME_NOW - period) {
                            var selectedCell = AD.sudokuController.__selectedCell
                                , showCellTutor = (selectedCell && !selectedCell.__solved) ? 0 : 1;

                            if (showCellTutor) {
                                cltmCell();
                                startCellTutor(0.01);
                            } else {
                                if (!hintTutorTimeout) startDigitTutor();
                            }
                        }
                    }
                }, period / 3);
            } else {
                startCellTutor();
            }

            function onEnd() {
                Finger.__hide();
                cltmDigit();
                if (Tutorials.__currentTutor) Tutorials.__onCompleted(Tutorials.__currentTutor);
                return _clearInterval(startTutorInterval) || 1;
            }

            node.__addBusObservers(
                CELL_SELECTED, (m, c) => {
                    cltmDigit();
                    if (!c.__solved) {
                        cltmCell();
                        startDigitTutor();
                    }
                },
                CELL_SOLVED, a => {
                    cltmDigit();
                    t.__failsAmount = 0;
                    if (!period) startCellTutor();
                },
                ON_ERROR, a => {
                    cltmDigit();
                    if (hintNode && !(Counters.__get('hints') <= 0)) {
                        cltmHint();
                        startHintTutor();
                    } else {
                        t.__failsAmount = (t.__failsAmount || 0) + 1;
                        if (showTutorFailsAmount && t.__failsAmount >= showTutorFailsAmount) {
                            startDigitTutor(startDigitsTmout || 0.5);
                        }
                    }
                },
                LEVEL_NEXT, a => {
                    Tutorials.__tutorsForCurrLevel = [];
                    onEnd();
                },
                LEVEL_STEP_COMPLETED, onEnd,
                LEVEL_COMPLETED, onEnd,
                LEVEL_FAILED, onEnd
            )
        }
    },

    'sudoku_cell_digit',
    {
        __start(node, userData) {
            var t = this
                , matcher = !userData.cell ? (c) => (!c.__solved && c.__visible) : 0
                , digit = userData.digit
                , completeOnCellSolve = userData.__completeOnCellSolve || 0
                , completeOnTap = userData.__completeOnTap || 0
                , selectCellFromStart = ifdef(userData.__selectCellFromStart, 1)
                , period = userData.__period || 0
                , startTutorTimeout;

            function startFinger() {
                var selectedCell = AD.sudokuController.__selectedCell
                    , cell = (selectedCell && !selectedCell.__solved) ? selectedCell : getTutorialCell(userData, matcher)
                    , digit_cell = digit ? AD.sudoku_digits[digit - 1] : cell ? AD.sudoku_digits[cell.__value] : 0;

                if (!cell) return;

                AD.level.__tutorCell = cell;

                if (selectCellFromStart) {
                    AD.sudokuController.__selectCell(cell, 1).__resetField();
                    AD.sudokuController.__selectedCell = 0;
                }

                AD.tutorCellSelected = 0;

                Finger.__show({
                    __type: 4,
                    __getPos1: () => cell.__worldPosition,
                    __getPos2: () => digit_cell.__worldPosition,
                    __scale: () => node.__getWorldScale().x,
                    __matcher: {
                        __onGood: a => {
                            Finger.__hide();
                            AD.level.__tutorCell = 0;
                            if (!completeOnCellSolve && !period) Tutorials.__onCompleted(t);
                        },
                        __isGood: a => completeOnTap || AD.tutorCellSelected == 1,
                    }
                });
            }

            if (completeOnCellSolve) {
                node.__addBusObservers(
                    CELL_SOLVED, a => {
                        Tutorials.__onCompleted(t);
                        return 1;
                    });
            }

            function startTimeout() {
                startTutorTimeout = _setTimeout(() => { startFinger() }, period);
            }

            function cltm() {
                startTutorTimeout = _clearTimeout(startTutorTimeout);
            }

            function onEnd() {
                cltm();
                Tutorials.__onCompleted(t);
                return 1;
            }

            if (period) {
                node.__addBusObservers(
                    ON_POINTER_DOWN, cltm,
                    ON_POINTER_UP, a => period ? startTimeout() : 1,
                    LEVEL_COMPLETED, onEnd,
                    LEVEL_FAILED, onEnd,
                    LEVEL_NEXT, onEnd
                );
            }

            startFinger();
        }
    },


    'digit',
    {
        __start(node, userData) {
            var t = this
                , need_update_mix = userData.need_update_mix || 0
                , use_cell_value = userData.use_cell_value || 0
                , finger_rotation_land = ifdef(userData.finger_rotation_land, 20)
                , finger_rotation_port = ifdef(userData.finger_rotation_port, 40)
                , digit = ((need_update_mix || use_cell_value) && AD.selectedCell.__value) || userData.digit || 0
                , cur_digit = digit || 0
                , digits = userData.digits
                , cell = getTutorialCell(userData)
                , sudoku = getLevel(userData)
                , completeOnTap = userData.__completeOnTap;

            var startTime = __gameTime;

            if (cell) {

                sudoku.__tutorCell = cell;
                if (userData.block_field) {
                    sudoku.__tutorCell = [cell];
                }

                if (digits) {
                    if (cur_digit) {
                        cur_digit = mmax(0, digits.indexOf(cur_digit));
                    }
                    digit = digits[cur_digit];
                }

                var digit_cell = digit ? AD.sudoku_digits[isArray(AD.sudoku_digits) ? digit - 1 : digit] : 0;


                Finger.__show({
                    __node: node,
                    __matcher: {
                        __onGood: a => {
                            Finger.__hide();
                            Bubble.__hide();
                            sudoku.__tutorCell = 0;
                            Tutorials.__onCompleted(t);
                        },
                        __isGood: a => completeOnTap ? 1 : digit ? cell.__solved : cell.__text,
                        __onBad: a => Bubble.__show(userData.__bubble)
                    },
                    __onHide: a => {
                        if (node.__animNode) node.__animNode.__visible = 0;
                    }
                });

                if (getUIClass(['__digit_anim_node'])) {
                    if (digit_cell) {
                        node.__animNode = node.__addChildBox(
                            create_temporary_node({
                                __ofs: [digit_cell.__offset.x, digit_cell.__offset.y, -100],
                                __text: digit_cell.__value,
                                __class: '__digit_anim_node'
                            })
                        );
                        Effects.__run(node.__animNode);
                    }
                }

                var get_orientation = n => { return n.__orientation >= 0 ? n.__orientation : ORIENTATION_PORTRAIT }

                    , update_orientation = t => {
                        if (get_orientation(node)) {
                            t.__rotate = finger_rotation_land;
                        } else {
                            t.__rotate = finger_rotation_port;
                        }
                    }

                    , update_by_digit = t => {
                        if (digit_cell) {
                            t.__digit_offset = digit_cell.__offset;
                            if (digit_cell.__isObject3D) {
                                t.__node = digit_cell;
                            }
                        }

                        var o = t.__digit_offset || defaultZeroVector2;
                        t.ygap = o.y + (ifdef(userData.__yGap, 80) + Finger.__fly_gap * sin(__gameTime * Finger.__speed / ONE_SECOND));
                        if (get_orientation(node) == ORIENTATION_LANDSCAPE) {
                            t.xgap = o.x + ifdef(userData.__xGap, 25) + Finger.__fly_gap * sin(__gameTime * Finger.__speed / ONE_SECOND);
                        } else {
                            t.xgap = o.x;
                        }
                    }

                    , update_no_digit = t => {
                        if (get_orientation(node) == ORIENTATION_PORTRAIT) {
                            t.ygap = 90;
                            // t.xgap = node.__size.x * sin(TIME_NOW * Finger.__speed) / 2;
                            t.xgap = 0.9 * node.__size.x * (0.5 + (abs(((__gameTime * Finger.__speed / 5 / ONE_SECOND) % 2) - 1) - 1));
                        } else {
                            t.xgap = 20;
                            t.ygap = 0.9 * node.__size.y * (0.5 + (abs(((__gameTime * Finger.__speed / 5 / ONE_SECOND) % 2) - 1) - 1)) + 60;
                        }
                    }

                    , update_mix = t => {
                        if (t.__posChanged) {
                            update_by_digit(t);
                        } else {
                            update_no_digit(t);
                            if (__gameTime > startTime + 2 * ONE_SECOND) {
                                update_by_digit(t);
                                t.__posChanged = 1;
                            }
                        }
                    }

                    , update_pos = digit_cell ? need_update_mix ? update_mix : update_by_digit : update_no_digit

                if (digits) {
                    var sp_coeff = 4 / Finger.__speed;
                    var anim_duration = 0.3 * sp_coeff;
                    t.__cur_timeout = _setTimeout(a => {
                        t.__cur_interval = _setInterval(a => {
                            if (digit_cell) {
                                digit_cell.__anim([
                                    [{ __scaleF: [1, 1.1] }, anim_duration, -2],
                                    a => {
                                        cur_digit = (cur_digit + 1) % digits.length;
                                        digit = digits[cur_digit];
                                        digit_cell = AD.sudoku_digits[digit - 1];
                                        if (Finger.current) Finger.current.__anim({ __alpha: 1 }, anim_duration);
                                    }
                                ]);
                            }

                            if (Finger.current) Finger.current.__anim({ __alpha: 0 }, anim_duration, 0, easeSineIO, anim_duration);

                        }, PI * sp_coeff / 2);
                    }, 0.8 * sp_coeff);
                }

                Finger.current.__update = override(Finger.current.__update,
                    function () {
                        var t = this;
                        digits ? 0 : update_orientation(t);
                        update_pos(t);
                    }
                )

            } else {
                consoleDebug('no cell for cell tutor');
            }
        }

    },

    'reset_field',
    {
        __start(node, userData) {
            AD.sudokuController.__resetField();
            Tutorials.__onCompleted(this);
        }
    },

    "fill_digits",
    {
        __start(node, userData) {
            AD.mainNode.__setAliasesData({ digits(n) { fill_ditigs(n, userData); } });
            Tutorials.__onCompleted(this);
        }
    },

    'level_complete',
    {
        __start(node, userData) { AD.__controller.LevelCompleted(); Tutorials.__onCompleted(this); }
    },

    'level_fail',
    {
        __start(node, userData) { AD.__controller.LevelFailed(); Tutorials.__onCompleted(this); }
    },

    'init_node',
    {
        __start(node, userData) {
            AD.mainNode.__setAliasesData(userData);
            Tutorials.__onCompleted(this);
        }
    },

    'init_cell_selected',
    {
        __start(node, userData) {
            var t = this
                , cell = getTutorialCell(userData)
                , level = getLevel(userData)
                , forceSelection = ifdef(userData.__forceSelection, 1);

            if (cell) {
                if (forceSelection) level.__tutorCell = cell;
                if (AD.sudokuController) {
                    AD.sudokuController.__selectCell(cell, 1).__resetField();
                }
                if (AD.fillwordController) {
                    AD.fillwordController.__selectCell(cell, 1, 1);
                }
            }
            Tutorials.__onCompleted(this);
        }
    },

    'puzzle_drag', {
    __start(node, userData) {
        var delay = 1
            , t = this
            , tutorPuzzleCell
            , tutorPuzzleTarget
            , puzzleNode
            , isRealDragMode = userData.__isRealDragMode || 0;

        var startTutorTimeout = _setTimeout(a => {
            tutorPuzzleCell = getTutorialCell(userData);

            AD.level.__node.__setAliasesData({ __tutorPuzzle(n) { tutorPuzzleTarget = n } });

            puzzleNode = tutorPuzzleCell ? tutorPuzzleCell.cellNode : node.__childs[userData.tutorNodeIdx];

            if (puzzleNode && tutorPuzzleTarget) {
                tutorPuzzleTarget.__visible = 1;
                tutorPuzzleTarget.__anim([
                    [{ __alpha: [0, 1] }],
                    [{ __alpha: [1, 0.7] }, 0.5, -1]
                ]);

                var fakeNodeImg = puzzleNode.__img;

                Finger.__show({
                    __node: puzzleNode,
                    __realDrag: isRealDragMode ? 1 : 0,
                    __createFakeNode: isRealDragMode ? 0 : function () {
                        if (puzzleNode.__cell) {
                            var cell = puzzleNode.__cell;

                            puzzleNode.__img = 0;
                            cell.__killAllAnimations();
                            cell.__anim({ __alpha: 0 }, 0.1);
                            fakeNodeImg = cell.__img;
                        }

                        var fakeNode = new Node({
                            __img: fakeNodeImg,
                            __offset: puzzleNode.__worldPosition.__clone(),
                            __scale: puzzleNode.__getUIWorldScale(),
                            __initialScale: puzzleNode.__getUIWorldScale(),
                            ____animatronix() {
                                var t = Finger.current, wp = t.__worldPosition, n = this, part = t.__part;
                                // непонятные сдвиги какие-то. надо как-то конфижить/высчитывать
                                n.__x = wp.x - t.__mod_offset.x - (AD.__orientation == ORIENTATION_LANDSCAPE ? 12 + 2 * part : 3);
                                n.__y = wp.y - t.__mod_offset.y + (AD.__orientation == ORIENTATION_LANDSCAPE ? 4 * part : 0);
                                n.__scaleF = lerp(n.__scaleF, tutorPuzzleTarget.__getUIWorldScale().x, part);
                                n.__dirty = 1;
                            }
                        }).__anim({ __alpha: [0, 0.6] }, 0.1).__anim({ __rotate: -5 }, 0.7, -2);

                        AD.__pctx.setupPuzzleForCell(fakeNode, tutorPuzzleCell, 1);

                        return fakeNode;
                    },
                    __type: 2,
                    __targetNode: tutorPuzzleTarget
                });
            }
        }, delay);

        function cltm() {
            _clearTimeout(startTutorTimeout);
            if (puzzleNode) {
                if (puzzleNode.__dragStarted) {
                    puzzleNode.__dragStarted = 0;
                    if (puzzleNode.__dragEnd) puzzleNode.__dragEnd(77);
                }
                if (puzzleNode.__cell) puzzleNode.__cell.__alpha = 1;
            }
            if (tutorPuzzleTarget) { tutorPuzzleTarget.__anim({ __alpha: 0 }).__removeAfter(0.5) }
            Tutorials.__onCompleted(t);
            return 1;
        }

        node.__addBusObservers(ON_POINTER_DOWN, cltm);


    }
},

    'fillword_select', {
    __start(node, userData) {

        var delay = 2
            , t = this
            , cell = getTutorialCell(userData)
            , selectColor = cell.__selectColor
            , word = AD.config.getTutorWord()
            , wordNode = word.__textnode
            , start = cell.__defaultColor.__clone()
            , tutorInterval = 3;

        var firsLetter = node.__childs[0]
            , lastLetter = node.__childs[1];

        function animHandler(startColor, finishColor) {
            return (isTutorCanceled) => {

                if (wordNode) {
                    wordNode.__canim = killAnim(word.__canim);
                    cell.__canim = killAnim(cell.__canim);
                    cell.__setBgFrame(1, 0);

                    var canim = wordNode.__canim = tween.to(wordNode, {}, 0.5, 0);

                    canim.A = { c: { s: startColor, d: finishColor } };
                    canim.__lerp = function () {
                        var part = canim.__part, part1 = canim.__part1;
                        wordNode.__color.__setRGB(
                            canim.A.c.s.r * part1 + canim.A.c.d.r * part,
                            canim.A.c.s.g * part1 + canim.A.c.d.g * part,
                            canim.A.c.s.b * part1 + canim.A.c.d.b * part
                        );
                    };
                }

                cell.__defaultColor = startColor;
                cell.__setBgColor(finishColor, 0.5, 0);
                if (isTutorCanceled) cell.__defaultColor = finishColor;
            }
        }

        function startFinger() {
            Finger.__show({
                __node: firsLetter,
                __type: 2,
                __targetNode: lastLetter,
                __onAnimStart: animHandler(start, selectColor),
                __onAnimEnd: animHandler(selectColor, start)
            });
        }


        var startTutorTimeout = _setTimeout(a => {
            startFinger()

        }, delay);


        var startTutorInterval = _setInterval(i => {

            if (!mouseButtons[0]) {
                if (AD.fillwordController.__failsAmount >= 3) {
                    AD.fillwordController.__resetFailsAmount()
                    startFinger()
                } else
                    if (AD.fillwordController.lastTapTime < TIME_NOW - tutorInterval) {
                        if (Finger.__hideTime < TIME_NOW - tutorInterval) {
                            startFinger()
                        }
                    }
            }
        }, 1);

        function cltm() {
            _clearTimeout(startTutorTimeout);

            if (wordNode) wordNode.__canim = killAnim(word.__canim);

            cell.__canim = killAnim(cell.__canim);
            if (!AD.config.solved_words) {
                if (wordNode) wordNode.__color = start;

                cell.__defaultColor = start;
                cell.__setBgColor(start);
            }
        }

        node.__addBusObservers(
            ON_POINTER_DOWN, cltm,
            ON_POINTER_UP, cltm,
            WORD_SOLVED, () => {
                _clearInterval(startTutorInterval)
            });
    }
},

    'cryptomix_cell', {
    __start(node, userData) {

        var t = this
            , cell = getTutorialCell(userData)

        AD.level.__tutorCell = cell;

        Bubble.__show(userData.__bubble)

        Finger.__show({
            __node: AD.cryptomixController.view,
            __ofs: cell.__cellPosition,
            __matcher: {
                __onGood: a => {
                    Finger.__hide();
                    Bubble.__hide();
                    AD.level.__tutorCell = 0;
                    AD.config.tutorStep++;
                    Tutorials.__onCompleted(t);
                },
                __isGood: a => cell.__selected == true
            }
        });
    }
},

    'cryptomix_button', {
    __start(node, userData) {
        var t = this;

        AD.level.__tutorCell = {};

        Bubble.__show(userData.__bubble);

        Finger.__show({
            __node: AD.cryptomixController.mixButton,
            __matcher: { __isGood: () => { } }
        });
        node.__addBusObservers(
            LETTERS_MIXED, () => {
                Finger.__hide();
                Bubble.__hide();
                AD.level.__tutorCell = 0;
                Tutorials.__onCompleted(t);
                return 1;
            }
        );

    }
},

    'cryptomix', {
    __start(node, userData) {

        var t = this,
            cellField = AD.cryptomixController.view,
            shuffledCells = AD.cryptomixController.shuffledCells,
            timeoutId = null,
            tutorDelay = 5;

        function showFinger() {
            var curCell;
            if (AD.selectedStack.length >= 2) {

                Finger.__show({ __node: AD.cryptomixController.mixButton });

            } else if (AD.selectedStack.length) {

                var letter = AD.selectedStack[0].__value;
                curCell = $find(shuffledCells, cell => cell.__text == letter);

            } else {

                curCell = shuffledCells[0];

            }

            if (curCell) {
                Finger.__show({
                    __node: cellField,
                    __ofs: curCell.__cellPosition,
                });
            }
        }

        function scheduleFinger() {
            if (AD.gameCompleted) return;
            clearScheduledFinger();
            timeoutId = _setTimeout(showFinger, tutorDelay);
        };

        function clearScheduledFinger() {
            timeoutId = _clearTimeout(timeoutId);
        };

        scheduleFinger();
        //todo: обсерверы могут вызывать конфликты с обсерверами node, переделать как в vignette.js
        node.__addBusObservers(
            ON_POINTER_DOWN, clearScheduledFinger,
            ON_POINTER_UP, scheduleFinger,
            LEVEL_PRECOMPLETED, () => {
                clearScheduledFinger();
                Tutorials.__onCompleted(t);
                return 1
            }
        );
    }
},

    'tilethree_cell', {
    __start(node, userData) {
        var t = this
            , cell

        var fingerInit = () => {
            if (AD.config.tutorCompleted) return

            var tutorCell = AD.level.__tutorCell

            var matcher = tutorCell
                ? c => c.__value == tutorCell.__value && !c.__selected
                : c => !c.__selected;

            cell = getTutorialCell(userData, matcher)

            AD.level.__tutorCell = cell;

            Finger.__show({
                __node: AD.tileThreeController.__view,
                __ofs: cell.__cellPosition,
                __matcher: {
                    __onGood: a => {
                        Finger.__hide();
                        if (!AD.config.tutorStep) {
                            AD.config.tutorStep = 0;
                        }
                        AD.config.tutorStep++;
                        Tutorials.__onCompleted(t);
                    },
                    __isGood: a => cell.__selected == true
                }
            });
        }
        fingerInit()

        node.__addBusObservers(
            WORD_SOLVED, () => {
                Finger.__hide();
                AD.level.__tutorCell = 0;
                AD.config.tutorCompleted = 1
                return 1
            },
            ON_VIEW_RESET, () => {
                Finger.__hide();
                fingerInit()
            }
        );
    }
},

    'tap_letter', {
    __start(node, userData) {
        var t = this
            , letterIdx = userData.__letterIdx || 0
            , tutorLetterNode = node.letters.__childs[letterIdx];

        if (tutorLetterNode) {
            Finger.__show({
                __node: node,
                __ofs: tutorLetterNode.__offset,
                __matcher: {
                    __onGood: a => {
                        Finger.__hide();
                        Tutorials.__onCompleted(t);
                    },
                    __isGood: a => 1,
                }
            });
        }
    }
},

    'tap_letters', {
    __start(node, userData) {
        var t = this
            , delay = ifdef(userData.__delay, 4)
            , showTutorFailsAmount = userData.__showTutorFailsAmount
            , startTutorTimeout;

        function getTutorLetterNode(tutorWord) {
            for (var i = 0; i < tutorWord.letters_list.length; i++) {
                var letterNode = $find(tutorWord.lettersNodes, l => l.letter == tutorWord.letters_list[i]);
                if (letterNode && !letterNode.__selected) return letterNode;
            }
        }

        function startFinger() {
            var tutorWord = AD.selectedWord && !AD.selectedWord.solved
                ? AD.selectedWord
                : AD.config.getTutorWord();

            if (!tutorWord) onEnd();
            var tutorLetterNode = getTutorLetterNode(tutorWord);
            if (tutorLetterNode) {
                Finger.__show({
                    __node: node,
                    __type: 5,
                    letter: tutorLetterNode,
                });
            }
        }

        function startTimeout(delay) {
            if (t.__completed) return;
            if (!startTutorTimeout) {
                startTutorTimeout = node.__setTimeout(a => {
                    startFinger();
                }, delay);
            }
        }

        function cltm() {
            if (startTutorTimeout) startTutorTimeout = node.__clearTimeout(startTutorTimeout);
        }

        function onEnd() {
            cltm();
            Tutorials.__onCompleted(t);
            return 1;
        }

        BUS.__addEventListener(ON_POINTER_DOWN, cltm);
        BUS.__addEventListener(ON_POINTER_UP, () => startTimeout(delay));
        BUS.__addEventListener(LEVEL_COMPLETED, onEnd);
        BUS.__addEventListener(LEVEL_FAILED, onEnd);

        if (showTutorFailsAmount) {
            t.__failsAmount = 0;
            BUS.__addEventListener(WORD_BAD, () => {
                t.__failsAmount++;
                if (t.__failsAmount >= showTutorFailsAmount) {
                    startTimeout(0.5);
                    t.__failsAmount = 0;
                }
            });
            BUS.__addEventListener(WORD_SOLVED, () => {
                t.__failsAmount = 0;
            });
        }

        startTimeout(delay);

    }
},

    'point_node',
    {
        __start(node, userData) {
            let nodes = [];
            let step = 0;

            const startTutor = (nodes, step) => {
                const tutorNode = nodes[step]
                if (tutorNode) {
                    Finger.__show({
                        __node: tutorNode,
                        __ofs: new Vector3(0, 0,-20),
                        __scale: 1,
                        __matcher: {
                            __onGood: a => {
                                step++;
                            },
                            __isGood: a => tutorNode.__selected,
                            __onBad: a => {}
                        }
                    });
                }
            };

            const stopTutor = (eData) => {
                if(eData.eventNode !== nodes[step]) return
                step++
                if(step === nodes.length) BUS.__post(LEVEL_COMPLETED);
                Finger.__hide();
                startTutor(nodes, step);
            }
       
            BUS.__addEventListener(LEVEL_READY, (eName, eData) => {
                if (!eData.isMandala) return;
                nodes = userData.__nodeNames.map(name => {
                    return getNodeByAlias(AD.getMainNode(), [name], { [name]: 1 }) || eData.node
                });
                startTutor(nodes, step);
            })

            BUS.__addEventListener(COLOR_SELECTED, (eName, eData) => {
                stopTutor(eData)
            });
            BUS.__addEventListener(COLOR_CHANGED, (eName, eData) => {
                stopTutor(eData)
            })
        }
    },
        "happy_color_tutor", {
    __start(node, userData) {

        var cells = node.__childs
            , step = 0
            , cell = cells[step]
            , ud = userData || {}
            , needShadeCells = ud.__needShadeCells
            , stopTutorTimeout = ud.__stopTutorTimeout
            , stopTimeoutId
            , tutorStarted
            , tutorStopped = 0
            , fingerTimeoutId;

        var t = this;

        if (stopTutorTimeout) {
            stopTimeoutId = _setTimeout(stopTutor, stopTutorTimeout)
        }

        function stopTutor() {
            Finger.__hide();
            AD.config.tutorCompleted = 1;
            _clearTimeout(fingerTimeoutId);
            _clearTimeout(stopTimeoutId);
            Tutorials.__onCompleted(t);
        }

        function showFinger() {
            if (AD.config.tutorCompleted) return

            fingerTimeoutId = _setTimeout(() => {
                tutorStarted = 1;
                if (!cells.length || AD.config.tutorCompleted) return
                if (cells.length == 1) {
                    Finger.__show({
                        __node: node,
                        __type: 0,
                        __ofs: cells[0].__ofs,
                        __onHide: a => {
                            Tutorials.__onCompleted(t);
                        }
                    });
                } else {
                    Finger.__show({
                        __node: node,
                        __type: 3,
                        letters: cells.slice(),
                        __holdTime: 250,
                        __dipAmplitude: 40,
                        __holdLiftPx: 5,
                        __onHide: a => {
                            Tutorials.__onCompleted(t);
                        },
                        __matcher: {
                            __onGood: a => {
                                Finger.__hide();
                            },
                            __isGood: a => cell.__selected == true
                        }
                    });
                }
            }, 1)
        }

        showFinger()

        node.__addBusObservers(
            ON_POINTER_DOWN, () => {
                    stopTutor()
                    return 1
            }
        );
    }
},
    "tilethree_select", {
    __start(node, userData) {
        var cellsData = userData.__cells
            , cells = $map(cellsData, cell => getTutorialCell(cell))
            , step = 0
            , cell = cells[step]
            , ud = userData || {}
            , needShadeCells = ud.__needShadeCells
            , stopOnClick = ud.__stopOnClick
            , needStopGreed = ud.__needStopGreed
            , stopTutorTimeout = ud.__stopTutorTimeout
            , stopTimeoutId
            , tutorStarted
            , shadeNode = getNodeByAlias(AD.getMainNode(), '__shade', { __shade: 1 })
            , fingerTimeoutId;

        AD.level.__tutorCell = cell

        if (needStopGreed) {
            _setTimeout(() => {
                AD.tileTripController.__stopMoving()
                if (needShadeCells) {
                    AD.tileTripController.__shadeCells(cells)
                }
            }, 1)
        }

        if (stopTutorTimeout) {
            stopTimeoutId = _setTimeout(stopTutor, stopTutorTimeout)
        }

        function stopTutor() {
            if (shadeNode) shadeNode.__visible = 0;
            Finger.__hide();
            AD.level.__tutorCell = 0;
            AD.config.tutorCompleted = 1;
            AD.tileTripController.__startMoving();
            AD.tileTripController.__unshadeCells();
            _clearTimeout(fingerTimeoutId);
            _clearTimeout(stopTimeoutId);
        }

        function showFinger() {
            fingerTimeoutId = _setTimeout(() => {
                tutorStarted = 1;
                if (!cells.length || AD.config.tutorCompleted) return
                if (shadeNode) shadeNode.__visible = 1;
                if (cells.length == 1) {
                    Finger.__show({
                        __node: node,
                        __type: 0,
                        __ofs: cells[0].__cellPosition
                    });
                } else {
                    Finger.__show({
                        __node: node,
                        __type: 3,
                        letters: cells.slice(),
                        __holdTime: 250,
                        __dipAmplitude: 40,
                        __holdLiftPx: 5,
                        __matcher: {
                            __onGood: a => {
                                Finger.__hide();
                            },
                            __isGood: a => cell.__selected == true
                        }
                    });
                }
            }, 1)
        }

        showFinger()

        node.__addBusObservers(
            CELL_SOLVED, () => {
                Finger.__hide();
                AD.level.__tutorCell = 0;

                if (!cells.length) {
                    AD.config.tutorCompleted = 1
                    return 1
                }
            },
            CELL_SELECTED, () => {
                if (AD.config.tutorCompleted) {
                    return 1
                }
                Finger.__hide()
                cells.shift()
                AD.level.__tutorCell = cells[0];
                if (cells.length) {
                    showFinger()
                }

            },
            ON_POINTER_DOWN, () => {
                if (stopOnClick && tutorStarted) {
                    stopTutor()
                    return 1
                }
            }
        );
    }
},
    'tap_object', {
    __start(node, userData) {
        var onEnd = () => {
            if (node.__killAllAnimationsRecursive) {
                node.__killAllAnimationsRecursive();
            }
            Finger.__hide();
            Tutorials.__onCompleted(this);
            return 1;
        }

        Finger.__show({
            __node: node,
            __matcher: {
                __onGood: onEnd,
                __isGood: a => node.__selected == 1,
            }
        });

        BUS.__addEventListener(OBJECT_SOLVED, onEnd);
    }
},
    'tap_node', {
    __start(node, userData) {

        Finger.__show({
            __node: node,
            __onHide: a => {
                Tutorials.__onCompleted(this);
            }
        });
    }
}
);


AD.addBehaviour('tutorial', node => {

    var tutor_type = node.__propertyBinding
        , tutor = Tutorials[tutor_type];

    if (tutor) {
        var p = node.__parent;
        if (tutor.__completed) {
            hideTutorShade(p, 0);
        } else {

            var e = {
                __name: node.__textString || node.__name,
                __type: tutor_type,
                __tutor: tutor,
                __step: node.__numericInputStep || 0,
                __node: p,
                __userData: node.__userData
            };

            consoleLog("queue tutorial ", e);

            Tutorials.__queue.push(e);
            Tutorials.__tutorsForCurrLevel.push(e);
        }

        node.__removeFromParent();
    } else {
        consoleDebug("No tutorial with type", tutor_type);
    }

    Tutorials.__processQueue(0.01);

});
