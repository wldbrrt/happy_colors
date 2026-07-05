function shuffleLetters(letters, sortingOrder) {
    if (isArray(sortingOrder) && sortingOrder.length > 0) {
        var res = [];
        for (var i = 0; i < letters.length; i++) {
            res[sortingOrder[i]] = letters[i];
        }
        return res;
    } else {
        return shuffle(letters);
    }
}

function getRandomItems(arr, count) {
    count = mmin(count, arr.length);
    var res = [], copy = arr.slice(), maxIndex = copy.length - 1;

    for (var i = 0; i < count; i++) {
        var randomIndex = randomInt(0, maxIndex--);
        res.push(copy[randomIndex]);
        copy[randomIndex] = copy[maxIndex];
    }

    return res;
}

function selectSomethingBy(arr, chanceSelection, mode) {
    var result;
    mode = mode || 0;
    switch (mode) {
        case 0: // returns last founded item by filter. usually for found min/max
            for (var i in arr) if (chanceSelection(arr[i], i)) result = arr[i]; break;

        case 1: // returns first founded item by filter
            for (var i in arr) if (chanceSelection(arr[i], i)) return arr[i]; break;

        case 2: // returns array of elements by filter
            result = [];
            for (var i in arr) if (chanceSelection(arr[i], i)) result.push(arr[i]); break;
            break;

        case 3: // returns count of elements by filter
            result = 0;
            for (var i in arr) if (chanceSelection(arr[i], i)) result = result + 1; break;
            break;

        case 4: // returns indexes by filter
            result = [];
            for (var i in arr) if (chanceSelection(arr[i], i)) result.push(i); break;
            break;
    }

    return result;
}

function selectMaxSomethingBy(arr, chanceSelection) {
    var maxItemChance = 0;
    return selectSomethingBy(arr, function (it, i) {
        var chance = chanceSelection(it, i);
        if (chance > maxItemChance) { maxItemChance = chance; return 1; }
    });
}

function selectMinSomethingBy(arr, chanceSelection) {
    var minItemChance = Infinity;
    return selectSomethingBy(arr, function (it, i) {
        var chance = chanceSelection(it, i);
        if (chance < minItemChance) { minItemChance = chance; return 1; }
    });
}

function getNodeByAlias(parent, node_name, node_alias) {
    var n;
    parent.__setAliasesData($map(node_alias, v => (nn) => n = nn));
    return n || parent.__alias(node_name);
}

function getNodeByTarget(t) {
    return getNodeByAlias.apply(this, concatArrays([AD.getMainNode()], t));
}

function setTimeoutOrCallNow(f, t) {
    return f ? t ? _setTimeout(f, t) : f() : 0
}

function world_to_local(node, event) {
    var wp = event.wp || event.w.wp;
    var local_point = new Vector2(wp.x, wp.y);
    local_point.y *= -1;
    local_point.__applyMatrix4(node.mw.im || node.mw.__getInverseMatrix());
    return local_point;
}

function getFrames(substring) {
    return $filter(globalConfigsData.__frames, f => f.__realFilename.includes(substring));
}

function moveNodeToTheNode(node, node2, childInd) {
    node.__updateMatrixWorld()
    var pos = node.__getUIWorldPosition();
    node2 = node2 || scene;
    var z = node.__totalZ;

    if (node2 == scene) {
        node.__prevSha = node.sha;
        node.__prevSva = node.sva;
        node.sva = node.sha = 1;
    } else {
        if (node.__prevSha) node.sha = node.__prevSha;
        if (node.__prevSva) node.sva = node.__prevSva;
    }

    // var pos2 = node.__worldPosition.clone();

    var node_scale = node.__getUIWorldScale(), node2_scale;

    if (node2 == scene) {
        //consoleLog('moveNodeToTheNode addToScene', node.name);
        addToScene(node);
    } // else if (node2 == scene2) {
    //consoleLog('moveNodeToTheNode addToScene2', node.name);
    //    addToScene2(node);
    // } 
    else {
        if(childInd != undefined) {
            node2.__insertChild(node, childInd)
        } else {
            node2.add(node);
        }
        node.update(1);
        node2_scale = node2.__getUIWorldScale();
        pos.sub(node2.__getUIWorldPosition()).__divide(node2_scale);

        var sc = node2.__scrollVector;
        if (sc) {
            pos.x -= sc.x;
            pos.y += sc.y;
        }

        node.____scale.set(node_scale.x / node2_scale.x, node_scale.y / node2_scale.y)
    }
    node.__ofs = new Vector3(pos.x, pos.y, node.__totalZ - z + node.__z);


    node.update(1);
    node.__updateMatrix();
    node.__updateMatrixWorld(1);

}


function create_temporary_node(opts) {
    var enode = new Node(opts);
    enode.__interval = _setInterval(a => {
        if (!enode.__visible || !enode.__parent) {
            enode.__interval = _clearInterval(enode.__interval);
            enode.__removeFromParent();
        }
    }, 1);
    AD.processNode(enode);
    return enode;
}

function flyNodeToTheNode(node, targetNode, params) {
    var targetSize = targetNode.__size
        , childInd = params.__childInd
        , size = node.__contentSize
        , scale = params.__targetScale 
                || mmin(targetSize.x / size.x, targetSize.y / size.y) * mmin(targetNode.__parent.__scaleF, targetNode.__scaleF)
        , middleScale = params.__middleScale
        , endPositon = params.__endPositon
        , wp = isArray(endPositon) ? new Vector2(endPositon[0], endPositon[1]) : endPositon || targetNode.__worldPosition
        , duration = params.__duration || 0.7
        , scaleDuration = params.__scaleDuration || duration / 2
        , delay = params.__delay
        , effect = params.__effect
        , anim_out = params.__anim_out_type || 0
        , callback = params.__callback
        , isVertical = params.__isVertical
        , autoremove = params.__autoremove
        , autoremoveDelay = params.__autoremoveDelay || duration / 2
        , dstNode = params.__parentNode;

        node.__z = params.__z || -30;

    moveNodeToTheNode(node, dstNode || scene, childInd);

    if (effect) node.__effect = effect;
    node
        .__anim({__x: a => wp.x}, duration, 0,  isVertical ? easeSineO : easeSineI, delay)
        .__anim([
            [{__y: a => wp.y}, duration, 0,  isVertical ? easeSineI : easeSineO, delay],
            a => {
                if (autoremove) {
                    if (node.__effect) {
                        Effects.__run(node, Effects.animOut, { __anim_type: ANIM_FADE, __duration: duration * 0.25 });
                    } else {
                        Effects.__run(node, anim_out == ANIM_SCALE ? Effects.animPulse : Effects.animOut, { __anim_type: anim_out });
                        node.__removeAfter(autoremoveDelay);
                    }
                }
                if (callback) {
                    callback();
                }
            }
        ]);
    if(middleScale) {
        node.__anim([
            [{__scaleF: middleScale }, scaleDuration / 2, 0, 0, delay],
            [{__scaleF: scale }, scaleDuration / 2],
        ])
    } else {
        node.__anim({__scaleF: scale }, scaleDuration, 0, 0, delay)
    }
        
};

function flyEventHandler(event, targetNode, tmout, effect) {
    var endPos = effect == 'money_fly' ? undefined : new Vector3(targetNode.__worldPosition.x, event.__worldPosition.y, -20)
    _setTimeout(a => {
        flyNodeToTheNode(event, targetNode, mergeObj({
            __effect: effect,
            __autoremove: 1,
            __endPositon: endPos
        }, event.__userData || {}));
    }, tmout * 0.3);
};

function addLetterEventNode(className, letterCfg, parentNode, animStartNode) {
    var img = new ENode().__init({ __class: className});
    
    if (animStartNode) {
            img = animStartNode.__addChildBox(img)
            img.__y = parentNode.__worldPosition.y
            flyNodeToTheNode(img, parentNode, mergeObj({
                __autoremove: 0,
                __parentNode: parentNode,
                __endPositon: new Vector2(0, 0)
            }));
    } else {
        img = parentNode.__addChildBox(img);
    }

    parentNode.__letter_event = img
    parentNode.__letter_event.__img = letterCfg.img;

};

function disableNodeWhenCounterExpires(node, counterName) {
    var ud = node.__userData || {}
        , counter = Counters.__get(counterName);

    if (counter) {
        node.__addCounterObservers(
            counterName, 
            a => {
                if (Counters.__get(counterName)){
                    // надо бы включать обратно?
                } else {
                    node.__onTapHighlight = 0;
                    node.__onTap = 0;

                    Effects.__run(node);
                    var counterNode = getNodeByTarget(ud.__target);
                    if (counterNode) counterNode.__classModificator = 'disabled';   
                }
            }
        )
    }
}

function getCharactersAtlas(charactersArray, textNode, cellSize, cellPadding) {
    charactersArray.push(' ')

    var characters = charactersArray.join('')
    , padding = isArray(cellPadding) ? cellPadding : [0, 0, 0, 0]

    options.__disableGlobalTextCache = 1;

    var fontSize = textNode ? textNode.__fontsize : 50
        , uvTopPadding = padding[0] / cellSize.y
        , uvBotPadding = padding[2] / cellSize.y
        , uvLeftPadding = (padding[3] / cellSize.x) / characters.length
        , uvRightPadding = (padding[1] / cellSize.x) / characters.length;

    var node = new Text().__init(
        {
            __text: characters,
            __fontsize: fontSize,
            __charw: (fontSize + (padding[1] + padding[3])),
            __symbol_align: ALIGN_CENTER
        }
    );

    node.__parent = scene;
    options.__disableGlobalTextCache = 0;

    node.update();

    function lettersUv(array) {
        var result = {}
        , len = array.length;
        $each(array, (letter, ind) => {
            result[letter] = [
                (ind - uvLeftPadding) / len,
                (ind + 1 + uvRightPadding) / len,
                1 + uvTopPadding,
                0 - uvBotPadding
                ]
        });
        return result
    }

    var atlas = {
        __lettersUv: lettersUv(charactersArray),
        __node: node,
        __text_atlas: node.map,
        __interval: _setInterval(a => {
            if (getCachedData(node.__fontface) == node.__fontface) {
                node.__needUpdate = 1;
                node.update();

                atlas.__text_atlas = node.map;
                atlas.__interval = _clearInterval(atlas.__interval);
            }
        }, 0.05)
    };

    AD.__letterAtlasInstance = atlas

    return atlas;
}

function getNodesAtlas(nodesArray, cellSize) {
    var nodesCount = nodesArray.length
        , columns = ceil(sqrt(nodesCount))
        , rows = ceil(nodesCount / columns)
        , lettersUv = {}
        , atlasSize = new Vector2(columns * cellSize.x, rows * cellSize.y)
        , container = new Node({
            __padding: 0,
            ha: 3,
            va: 3,
            __tableAlignRows: rows,
            __tableAlignColumns: columns,
            __tableAlignColumnWidth: cellSize.x,
            __tableAlignRowHeight: cellSize.y,
            __size: atlasSize
        })
        , frames = $map(nodesArray, cfg => container.__addChildBox(cfg))
        , bufferTexture = renderNodeToTexture(container, { __size: container.__size });

    container.update();

    $each(frames, node => {
        var size = node.__size
            , wp = node.__worldPosition.__clone()
            , w = size.x
            , h = size.y
            , x = wp.x + atlasSize.x / 2 - w / 2
            , y = (wp.y + atlasSize.y / 2 - h / 2)
            , frame = {
                tex: bufferTexture.__texture,
                r: [x, y, w, h]
            };

        setFrameUV(frame);
        frame.uv = getFrameUv(frame.v[0], frame.v[1], frame.v[2], frame.v[3], 0, 1);
        lettersUv[node.__frameName || node.__value] = frame.uv;
    });

    var atlas = {
        __lettersUv: lettersUv,
        __text_atlas: bufferTexture.__texture,
    };

    var fontfaces = {};
    container.__traverse(c => c.__isText && (fontfaces[c.__fontface] = c.__fontface));

    if ($find(fontfaces, (v, ff) => getCachedData(ff) != ff)) {
        atlas.__interval = _setInterval(a => {
            var needUpdate = 0;

            container.__traverse(c => {
                if (c.__isText && c.__fontface && getCachedData(c.__fontface) != c.__fontface) needUpdate = 1;
            });

            if (!needUpdate) {
                container.__needUpdate = 1;
                container.update();

                bufferTexture = renderNodeToTexture(container, { __size: container.__size });
                atlas.__text_atlas = bufferTexture.__texture;
                atlas.__interval = _clearInterval(atlas.__interval);
            }
        }, 0.05);
    }

    return atlas;
}

function generateQuadIndices(quad_count) {
    return generateIndecesBufferData([], 0, quad_count, 0, [0, 1, 2, 0, 2, 3])
}

function generateIndecesBufferData(indeces, begin, end, kmod, base) {
    kmod = kmod || default_i_mod;
    for (var i = begin; i < end; i++) {
        var k = kmod(i), indofs = i * 6;
        indeces[indofs + 0] = k + base[0];
        indeces[indofs + 1] = k + base[1];
        indeces[indofs + 2] = k + base[2];
        indeces[indofs + 3] = k + base[3];
        indeces[indofs + 4] = k + base[4];
        indeces[indofs + 5] = k + base[5];
    }
    return indeces;
}

function ad_updateIndecesBuffer(buffer, sz, base, kmod) {
    generateIndecesBufferData(buffer.__getArrayOfSize(sz * 6, 0, 1), 0, sz, kmod, base);
}


function hasLayout(layoutName) {
    return getLayoutByName(layoutName, 1, 1)
}

function override(f, f2) {
    return function () {
        if (f2) {
            f2.apply(this, arguments);
        }
        if (f) {
            return f.apply(this, arguments);
        }
    }

}


function dirtodir(dir) {
    switch (dir) {
        case 'bottom': return DIR_BOTTOM;
        case 'top': return DIR_TOP;
        case 'right': return DIR_RIGHT;
        case 'left': return DIR_LEFT;
    }
    return dir;
}

function dropSomethingBy(arr, chanceSelection) {
    var tmp = {};
    var sum = 0;
    for (var i in arr) {
        var c = chanceSelection(arr[i], i);
        if (c > 0) {
            tmp[i] = c;
            sum += c;
        }
    }
    var num = randomInt(0, sum);
    sum = 0;
    for (var i in tmp) {
        sum += tmp[i];
        if (sum >= num)
            return [arr[i], i];
    }

}

function disableInput(sec, cb) {
    if (!sec) {
        if (cb) cb();
    } else {
        if (!AD.inputDisabler) {
            AD.inputDisabler = new Node({ __size: [1, 1], __onTap() { }, __drag() { }, __z: -10000 });
            addToScene(AD.inputDisabler);
        }
        AD.inputDisabler.__visible = 1;
        _setTimeout(a => {
            AD.inputDisabler.__visible = 0;
            if (cb) cb();
        }, sec);
    }
}

function isInputEnabled() {
    return !(AD.inputDisabler && AD.inputDisabler.__visible);
}

function _looperOneFunc(a, d) {
    return b => {
        looperPostOne(a, d)
    }
}

function looperPostOne(f, delay) {
    if (f.__posted > 0) {
        f.__posted = _clearTimeout(f.__posted);
    }

    if (!f.__posted) {
        if (delay) {
            f.__posted = _setTimeout(() => {
                f.__posted = 0;
                f();
            }, delay);
        } else {
            f.__posted = -1;
            looperPost(() => {
                f.__posted = 0;
                f();
            });
        };
    }
}

function matchAll1(str, regex) {
    var result = [];
    str.replace(regex, (m, a1) => (result.push(a1), m));
    return result;
}

function matchAll2(str, regex) {
    var result = [];
    str.replace(regex, (m, a1, a2) => (result.push([a1,a2]), m));
    return result;
}

function addDefaultCounters(){
    if (Counters.__hasCounter('items_count')) {
        BUS.__addEventListeners(
            OBJECT_SOLVED, a => {
                Counters.__add('items_count');
            },

            LETTER_SOLVED, (m, w) => {
                var letter_has_event = w.word.getLetterConfig(w.letterIndex).img;
                if (letter_has_event) {
                    Counters.__add('items_count');
                }
            },
            WORD_SOLVED, (m, word) => {
                Counters.__add('items_count');
            },
            CELL_SOLVED, a => {
                Counters.__add('items_count');
            }
        );
    }

    // механика счетчика возраста мозга
    if (Counters.__hasCounter('brain_age')) {
        BUS.__addEventListeners(
            WORD_SOLVED, (m, word) => {
                var changeValue = AD.__hintUsed
                    ? Counters.__get('brain_age_success_hint')
                    : Counters.__get('brain_age_success')
                , current = Counters.__get('brain_age');

                Counters.__set('brain_age', clamp(current + changeValue, 15, 99));
            },

            WORD_BAD, a => {
                var changeValue = Counters.__get('brain_age_error')
                , current = Counters.__get('brain_age');

                Counters.__set('brain_age', clamp(current + changeValue, 15, 99));
            },

            HINT_USED, a => { AD.__hintUsed = 1; },
            LETTER_SELECTED, (m, w) => { AD.__hintUsed = 0; }
        );
    }

    if (Counters.__hasCounter('iq')) {
        BUS.__addEventListeners(
            WORD_SOLVED, (m, word) => {
                var changeValue = Counters.__get('iq_success')
                , current = Counters.__get('iq');

                Counters.__add('iq', changeValue);
            },

            WORD_BAD, a => {
                var changeValue = Counters.__get('iq_error');
                Counters.__add('iq', changeValue);
            },

            CELL_SOLVED, (m, p) => { 
                var changeValue = Counters.__get('iq_success');
                Counters.__add('iq', changeValue);
            }
        );
    }

    // механика счетчика монет
    if (Counters.__hasCounter('money_count')) {
        var moneyPerWord = Counters.__get('money_count_word_success')
            , moneyPerLetter = Counters.__get('money_count_letter_success')
            , moneyPerCellCoin = Counters.__get('money_count_cell_coin_success');

        if (moneyPerLetter || moneyPerCellCoin) {
            BUS.__addEventListener(
                LETTER_SOLVED, (m, w) => {
                    var word = w.word, letter = (word.crossword_letters || word.list_letters)[w.letterIndex];
                    
                    if (word.getLetterConfig(w.letterIndex).img) {
                        Counters.__add('money_count', moneyPerLetter);
                    }

                    if (letter.hasCellCoin) {
                        if (!letter.coinCounted) {
                            Counters.__add('money_count', moneyPerCellCoin);
                            letter.coinCounted = 1;
                        }
                    }

                }
            );
        };

        
        if (moneyPerWord) {
            BUS.__addEventListener(
                WORD_SOLVED, a => {
                    Counters.__add('money_count', moneyPerWord);
                }
            );
        };
    }

    // механика счетчика ошибок:
    if (Counters.__hasCounter('errors')) {
        // увеличиваем счетчик при ошибке. 
        // Если достигнут порог, то fail
        BUS.__addEventListeners(ON_ERROR, a => {
            var errors = Counters.__add('errors', Counters.__get('error_inc', 1));
            if (errors == Counters.__get('errors_total_count')){
                AD.__controller.LevelFailed();
            }
        });
    }

    // механика количества подсказок:
    // уменьшаем счетчик при использовании подсказки
    if (Counters.__hasCounter('hints')) {
        BUS.__addEventListeners(HINT_USED, a => {
            Counters.__add('hints', -1);
        });
    }


    // механика очков:
    if (Counters.__hasCounter('score')) {
        var __hintUsed = 0;
        BUS.__addEventListeners(
            CELL_SOLVED, (m, p) => { 
                if (__hintUsed) { // при подсказке - не начисляем
                    __hintUsed = 0; 
                } else {
                    Counters.__add('score', Counters.__get('score_success', 1));
                }
            },
            ON_ERROR, (m, p) => { 
                Counters.__add('score', Counters.__get('score_error', -1));
            },
            HINT_USED, a => { __hintUsed = 1 }
        );
    }

    // механика счетчика зон мозга:
    // начисляем очки на рандомную зону
    if (Counters.__hasCounter('brain_zones')) {
        BUS.__addEventListeners(
            CELL_SOLVED, (m, p) => {
                var currCounter = "brain_zone_" + randomInt(1, Counters.__get('brain_zones', 3))
                    , incValMin = Counters.__get('brain_zone_inc_min', 1)
                    , incValMax = Counters.__get('brain_zone_inc_max', 1);

                Counters.__add(currCounter, randomInt(incValMin, incValMax));
            }
        );
    }

    if (Counters.__hasCounter('time')) {
        var val = Counters.__get('time_change_val')
        _setInterval(() => {
            Counters.__add('time', val)
            BUS.__post('TIME_CHANGED');
        }, 1)
    }

}

var Counters = makeSingleton({
    listeners: {},
}, {
    __init(counters_list) {
        $each(counters_list, (v, k) => {
            if (isNumber(v)) {
                this.__defineCounter(k, v);
            } else if (isString(v)) {
                this.__defineCounter(k);
                this.__defineCounter(v);
            } else if (isArray(v)) {
                this.__defineCounter(k, v[1]);
                this.__defineCounter(v[0], v[1]);
            } else {
                consoleDebug('wrong counter config: ', k, v);
            }
            this.listeners[k] = [];
        });


        addDefaultCounters();

    },

    __defineCounter(counterName, startVal) {
        if (this.__hasCounter(counterName)) return;

        var propertyName = '__' + counterName;
        this[propertyName] = startVal || 0;
        this.listeners[counterName] = [];

        ObjectDefineProperty(this, counterName, {
            set(v) {
                var prevValue = this[propertyName];
                if (prevValue != v) {
                    this[propertyName] = v;
                    var params = { prevValue: prevValue, newValue: v, counter: counterName };
                    BUS.__post(COUNTER_CHANGED, params);
                    this.__notifyListeners(params);
                }
            },
            get() {
                return this[propertyName];
            }
        })
    },

    __add(counterName, value) {
        if (value == 0) return;
        return (this[counterName] += value || 1);
    },

    __set(counterName, value) {
        return this[counterName] = value;
    },

    __get(counterName, defaultValue) {
        return ifdef(this[counterName], defaultValue);
    },

    __hasCounter(counterName){
        return this[counterName] != undefined
    },

    __addListener(counterName, listener) {
        if (!listener) return;
        var counterListeners = this.listeners[counterName];

        if (counterListeners) {
            listener.isNew = counterListeners.inNotifyLoop;
            counterListeners.push(listener);
        } else {
            consoleDebug('unknown counter: ', counterName);
        }
        return listener;
    },

    __removeFunction() {
        return 1;
    },

    __removeListener(counterName, listener) {
        var counterListeners = this.listeners[counterName];
        if (counterListeners) {
            var indexOfListener = counterListeners.indexOf(listener);
            if (indexOfListener >= 0) {
                if (counterListeners.inNotifyLoop) {
                    counterListeners[indexOfListener] = this.__removeFunction;
                } else {
                    counterListeners.splice(indexOfListener, 1);
                }
            }
        }
    },

    __notifyListeners(params) {
        var counterListeners = this.listeners[params.counter];
        if (!counterListeners) return;
        counterListeners.inNotifyLoop = 1;

        counterListeners = $filter(counterListeners, v => {
            if (v.isNew) {
                v.isNew = 0;
                return 1;
            } else {
                return !v(params);
            }
        });

        counterListeners.inNotifyLoop = 0;
    }

});

mergeObj(NodePrototype, {

    __setTimeout(f, d, repeat) {
        var t = this;
        d = d || 0.001;
        if (!t.__timeoutsArray__) {
            t.__timeoutsArray__ = [];
            t.__addOnDestruct(a => {
                $each(t.__timeoutsArray__, _clearTimeout);
                t.__timeoutsArray__ = [];
            });
        }
        var cb = a => {
            f.call(t);
            removeFromArray(r, t.__timeoutsArray__);
        };
        var r = repeat ? _setInterval(cb, d) : _setTimeout(cb, d);
        t.__timeoutsArray__.push(r);
        return r;
    },

    __setInterval(f, t) {
        return this.__setTimeout(f, t, 1);
    },

    __clearTimeout(r) {
        if (!r || !this.__timeoutsArray__) return;
        removeFromArray(r, this.__timeoutsArray__);
        _clearTimeout(r);
    },

    __clearInterval(r) {
        this.__clearTimeout(r)
    }
})

var UPPERCASE = 0
    , LOWERCASE = 1
    , CAPITALIZE_FIRST = 2;

function formatText(text, format) {
    switch (format) {
        case UPPERCASE:
            return text.toUpperCase();
        case LOWERCASE:
            return text.toLowerCase();
        case CAPITALIZE_FIRST:
            return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
        default:
            return text;
    }
}