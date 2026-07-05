var ANIM_SCALE_FADE = 1
    , ANIM_FADE = 2
    , ANIM_SCALE_SHIFTY = 3
    , ANIM_SCALE = 4
    , ANIM_SHIFTX = 5
    , ANIM_ROTATE_SCALE = 6
    , ANIM_OPACITY = 7
    , ANIM_SCALEX = 8;

function makeRenderTarget(w, h) {
    var rt = new WebGLRenderTarget(w, h, { __dynamic: 1 });
    rt.__isRT = 1;
    return rt;
}

function getFrame(frameName) {
    return get(globalConfigsData.__frames, frameName);
}

function animateColor(context, colorsBuffer, color, cc, duration, repeat, easing, delay, cb) {
    var t = context
    var start = color.__cloneRGBA()
        , canim = tween.to(t, {}, duration, repeat, easing, delay);
    canim.A = { c: { s: start, d: cc.__cloneRGBA() } };
    canim.__lerp = function () {
        var part = this.__part, part1 = this.__part1;
        color.__setRGBA(
            canim.A.c.s.r * part1 + canim.A.c.d.r * part,
            canim.A.c.s.g * part1 + canim.A.c.d.g * part,
            canim.A.c.s.b * part1 + canim.A.c.d.b * part,
            canim.A.c.s.a * part1 + canim.A.c.d.a * part
        );
        t.__updateColor(colorsBuffer, color)
    };
    if (cb) {
        canim.__setOnComplete(cb);
    }
    return canim

}

function applyFlowGlowEffect(node, effectTarget, params) {
    var need_redirect = params.__need_redirect
        , newNode = params.__newNode
        , scale = params.__scale || 0.95

    AD.mainNode.__setAliasesData({
        __levelBoard(n) {
            n.__anim([[{ __alphaDeep: 0 }], a => {
                n.__removeFromParent();
            }]);
        }
    });

    if (need_redirect) {
        node.__onTap = function () { AD.__redirect(); }
    }

    node.__z = params.__z || -1000;
    moveNodeToTheNode(node);

    var size = node.__size;

    if (AD.config.data.levels && AD.config.data.levels.length == 1) {
        node.__anim({ __x: 0, __y: 0, __scaleF: a => mmin(__screenSize.x / size.x, __screenSize.y / size.y) * scale }, 1);
    }

    if (effectTarget) Effects.__run(effectTarget, Effects.flow_glow, { __newNode: newNode });

    if (node.__shade) node.__shade.__alpha = 0.2;
}

var Effects = makeSingleton({

    animChildsOut(node, params) {
        /// \todo: anim types ?
        // switch(params.__anim_childs_type_out){
        // default:
        $each(params.nodes || node.__childs, (child, i) => {
            child.__anim({ __scaleF: 0.2 }, 0.1 + i * 0.02, 0, easeSineI, i * 0.05).__removeAfter(0.1 + i * 0.07);
        });
    },

    animOut(node, params) {
        var duration = params.__duration,
            repeat = params.__repeat || 0,
            easing = params.__easing,
            delay = params.__delay || 0,
            opacity = params.__opacity || 0;

        switch (params.__anim_type_out || params.__anim_type) {
            case ANIM_SCALE_FADE: node.__anim({ __scaleF: params.__scale || 0, __alphaDeep: opacity }, duration || 0.4, repeat, easing || easeSineI, delay); break;
            case ANIM_FADE: node.__anim({ __alphaDeep: opacity }, duration || 1, repeat, easing || easeSineI, delay).__removeAfter((duration || 1) + delay); break;
            case ANIM_SCALE_SHIFTY: node.__anim({ __y: node.__y + (params.__shiftY || 300), __alphaDeep: opacity }, duration || 0.5, repeat, easing || easeSineI, 1); break;
            case ANIM_SCALEX: node.__anim({ __scalex: params.__endScaleX || 0 }, duration || 0.3, repeat, easing || easeSineIO, delay); break;
        }
    },

    animIn(node, params) {
        var duration = params.__duration,
            repeat = params.__repeat || 0,
            easing = params.__easing,
            delay = params.__delay,
            opacity = params.__opacity;

        switch (params.__anim_type_in || params.__anim_type) {
            case ANIM_SCALE_FADE: node.__anim({ __scaleF: [params.__scale || 0.2, node.__scaleF], __alphaDeep: [0, 1] }, duration || 0.4, repeat, easing || easeSineI, delay); break;
            case ANIM_FADE: node.__anim({ __alphaDeep: [node.__alphaDeep, ifdef(opacity, 1)] }, duration || 1, repeat, easing || easeSineIO, delay); break;
            case ANIM_SCALE_SHIFTY: node.__anim({ __y: [node.__y + (params.__shiftY || -200), node.__y], __alphaDeep: [0, 1] }, duration || 0.7, repeat, easing || easeBackO, delay); break;
            case ANIM_SCALE: node.__anim({ __scaleF: [1, params.__scale || (node.__scaleF * 1.2)] }, duration || 0.2, repeat, easing || easeSineIO, delay); break;
            case ANIM_SHIFTX: node.__anim({ __x: [params.__startX || 0, node.__x + params.__shiftX || 90] }, duration || 0.3, repeat, easing || easeBackO, delay); break;
            case ANIM_ROTATE_SCALE: node.__anim({ __rotate: [-30, 0], __scaleF: [params.__scale || 0.2, 1], __alphaDeep: [0, 1] }, 0.3, repeat, easing || easeBackO, delay); break;
            case ANIM_OPACITY: node.__anim({ __alpha: [node.__alpha, ifdef(opacity, 1)] }, duration || 1, repeat, easing || easeSineIO, delay); break;
            case ANIM_SCALEX: node.__anim({ __scalex: [params.__startScaleX || 0, params.__endScaleX || 1] }, duration || 0.3, repeat, easing || easeSineIO, delay); break;
        }
    },

    animPulse(node, params) {
        params.__repeat = params.__repeat || -2;
        return Effects.animIn(node, params)
    },

    animText(node, params) {
        node.__animText.apply(node, params.__animTextParams);
    },

    animShake(node, params) {

        var duration = params.__duration || 0.3,
            repeat = params.__repeat || -4,
            easing = params.__easing || easeSineIO,
            delay = params.__delay;

        node.__anim([
            [{ __y: -5, __scaleF: 1.1 }, duration / 3, 0, easing, delay],
            [{ __rotate: [-3, 3] }, abs(duration / 3 / repeat * 2), repeat, easing],
            [{ __y: 0, __scaleF: 1, __rotate: 0 }, duration / 3, 0, easing]
        ]);
    },

    flipX(node, params) {

        var duration = params.__duration || 0.15
            , delay = params.__delay || 0
            , cb = params.__cb || 0;

        node.__anim([
            [{ __scalex: 0}, duration, 0, easeSineO, delay],
            a => { if (cb) cb(); }, 
            [{ __scalex: 1}, duration, 0, easeSineI]
        ]);
    },

    cornerScale(node, params) {
        var duration = params.__duration || 0.2
            , delay = params.__delay || 0
            , dir = params.__dir || 0;

        var dirSigns = [
            [ -1, -1 ], // top-left 0
            [ 1, -1], // top-right 1
            [ 1, 1 ], // bottom-right 2
            [ -1, 1 ] // // bottom-left 3
        ]

        var offsetX = dirSigns[dir][0] * (node.__width / 2)
            , offsetY = dirSigns[dir][1] * (node.__height / 2);
            
        node.__anim({
            __x: [node.__x + offsetX, node.__x],
            __y: [ node.__y + offsetY, node.__y],
            __scaleF: [0, 1],
            __alphaDeep: [0, 1]
        }, duration, 0, easeSineIO, delay);
    },

    blur(node, params) {
        /// \todo: use params
        Effects.has_blur_effect = 1;
        var effect = {
            __stop() {
                Effects.removeRenderOverTexture(node);
                Effects.has_blur_effect = 0;
            },
            __onRender() {
                var pen = node.__post_effect_node;

                if (pen.__renderTarget2) {
                    pen.__alpha = 0.99;
                    pen.map = pen.__renderTarget2.__texture;
                    NodePrototype.__render.apply(pen);
                    pen.__alpha = 0.9;
                }
            },
            size_delimeter: 2,
            swaprt: 1
        };

        Effects.prepareRenderOverTexture(node, effect);

        node.__post_effect_node.__init({
            __shader: 'effect_blur4',
            __uniforms: set({},
                "v1", a => new Vector2(3 / __screenSize.x, 0).__rotateAroundZ0(randomFloatSpread(0.4)),
                "v2", a => new Vector2(0, 3 / __screenSize.y).__rotateAroundZ0(randomFloatSpread(0.4))
            )
        });

        return effect;
    },

    flyAndGlow(node, params) {
        var targetNode = getNodeByAlias(AD.getMainNode(), '__flyTargetNode', { __flyTargetNode: 1 }) || params.__targetNode
            , moveAnim = params.__moveAnim || {}
            , isVideoMode = params.__isVideoMode;

        flyNodeToTheNode(node, targetNode, mergeObjExclude(moveAnim, {
            __parentNode: targetNode,
            __targetScale: 1.2,
            __duration: 0.7,
            __scaleDuration: 0.7,
            __delay: 0.5,
            __z: -10,
            __callback: () => {
                Effects.__run(node, Effects.flow_glow, {
                    __newNode: isVideoMode
                });
            }
        }));
    },

    flow_glow(node, params) {

        if (params.__newNode) {
            var n2 = node.__addChildBox({
                __size: [200, 5000],
                __img: 'puzzle_glow',
                __z: -1,
                __needScissor: 1,
                __getScissor() {
                    node.__needScissor = 1;
                    var sc = node.__getScissor();
                    node.__needScissor = 0;
                    return sc;
                },
                __blending: 2,
                __alpha: 0,
                __rotate: 210
            }).__anim([[{ __x: [node.__size.x, -node.__size.x] }, 1.5, 0, 0, 0.5], a => {
                n2.__removeFromParent();
                if (node.__childsForRender) {
                    removeFromArray(n2, node.__childsForRender);
                }
            }])
                .__anim({ __alpha: 1 }, 0.75, -2, 0, 0.5);
            if (node.__childsForRender) {
                node.__childsForRender.push(n2);
            }


        } else {

            node.__shader = 'flow_glow';
            /// \todo: use params!
            var glow = getFrame('puzzle_glow'),
                glow_frame_data = glow.v;

            node.__uniforms = set({},
                'glow_frame_data', new Vector4(glow_frame_data[0], glow_frame_data[1], glow_frame_data[2], glow_frame_data[3]),
                'u_shift', 2,
                'u_angle', -0.7,
                'u_scale', 2,
                'u_power', 0.06,
                'u_roughness', 10,
                'u_texture2', glow.tex
            );

            node.__anim(set({}, 'u_shift', [-1.5, 1.5]), 3);
        }

    },

    vignette(node, params) {

        var vignette_size = params.vignette_size || 50;
        var vignette = node.__addChildBox({
            __selfImgSize: 1,
            __size: [1, 1],
            __corner: [vignette_size, vignette_size],
            __shader: params.__shader != undefined ? params.__shader : 'radial',
            __color: params.__color || '#000',
            __alpha: params.__alpha || 1,
            __uniforms: set({}, 'f1', params.f1 || 0, 'f2', params.f2 || 1),
            __z: params.z || -10000
        });

        if (params.__duration) {
            vignette
                .__anim({ __alpha: [0, params.__alpha] }, params.__duration / 2, -2)
                .__removeAfter(params.__duration);
        }

        return {
            __stop() {
                vignette.__removeFromParent();
            }
        }

    },

    floatBubbles(node, params) {

        var effect = getEffectByName('__wordSolved01');
        if (!effect) return;

        var effectNode = node.__addChildBox({ __effect: effect, __z: -10, }).__removeAfter(params.__duration || 5)
            , stack = params.__stack || AD.selectedStack.slice()
            , color = stack[0].__selectColor
            , vfx = effectNode.__effect
            , emitter = vfx ? vfx.__emitters[0] : 0;

        if (!emitter) return;

        emitter.__colorEmitterComponent.color = {
            r: [color.r * 255 + 10, 10],
            g: [color.g * 255 + 10, 10],
            b: [color.b * 255 + 10, 10],
            a: [255, 10]
        };

        emitter.g.origin = function (part) {
            part = part / 100;
            var l = stack.length
                , start = floor(part * l - 2)
                , end = floor(part * l)
                , index = clamp(randomInt(start, end), 0, l - 1);

            var randomCell = stack[index]
                , pos = randomCell.__cellPosition
                , w = randomCell.__size.x / 2.5
                , h = randomCell.__size.y / 2.5;

            return new Vector2(
                randomFloat(pos.x - w, pos.x + w),
                -randomFloat(pos.y - h, pos.y + h)
            );
        };
    },

    floatBubbles2(node, params) {
        var effect = getEffectByName('float_bubbles');
        if (!effect) return;

        var effectNode = node.__addChildBox({ __effect: effect, __z: -10, }).__removeAfter(params.__duration || 3)
            , color = new Color().__fromJson(params.__selectColor)
            , vfx = effectNode.__effect
            , emitter = vfx ? vfx.__emitters[0] : 0;

        if (!emitter) return;

        emitter.__colorEmitterComponent.color = {
            r: [color.r * 255, 10],
            g: [color.g * 255, 10],
            b: [color.b * 255, 10],
            a: [255, 10]
        };

    },

    copyCellsAndRunEffect(node, params) {
        var stack = AD.selectedStack;

        var fakeNodes = $map(stack, cell => {
            var cellNode = node.__addChildBox(cell.__clone());
            cellNode.__text = ifdef(params.__showText, 1) ? cell.letter : undefined;
            cellNode.__scale = node.__getWorldScale();
            return cellNode;
        });

        Effects.__run(fakeNodes, undefined, params);
    },


    selectionFrame(node, params) {
        var frameSize = params.__size
            , isReversed = params.__isReversed
            , shader = 'sector_border_crop'
            , thickness = params.__thickness
            , angle = params.__angle || 7
            , startAngle = isReversed ? 0 : angle
            , endAngle = isReversed ? -angle : 0
            , startAngleOffset = params.__startAngleOffset || Math.PI * 0.75

        // Examples for startAngleOffset:
        //   TOP_RIGHT_CORNER     = Math.PI * 0.75
        //   BOTTOM_RIGHT_CORNER  = Math.PI * 0.25
        //   BOTTOM_LEFT_CORNER   = Math.PI * 1.75 
        //   TOP_LEFT_CORNER      = Math.PI * 1.25

        var selectionFrame = new Node({
            __size: frameSize,
            __offset: params.__offset,
            __shader: shader,
            __color: params.__color || '#f00',
            __alpha: params.__alpha || 1,
            __uniforms: set({},
                'u_angle', startAngle,
                'u_thickness', thickness ? (0.5 - thickness / mmin(frameSize[0], frameSize[1])) : 0.4,
                'u_angleOffset', startAngleOffset
            ),
            __z: params.z || -10000
        });

        if (node.__selectionFrame) node.__selectionFrame.__removeFromParent();
        node.__selectionFrame = node.__addChildBox(selectionFrame);

        selectionFrame.__anim(set({}, 'u_angle', [startAngle, endAngle]), params.__duration || 0.4);
    },

    runCards(node, params) {
        var level = node.__level || AD.level
            , startAnimPos
            , duration = ifdef(params.__duration, 0.3)
            , easing = ifdef(params.__easing, easeSineO)
            , delay = params.__delay || 0
            , delay_per_cell = ifdef(params.__delay_per_cell, 0.1)
            , rotateOnlySolved = params.__rotateOnlySolved || 0
            , shouldRotate = 1;

        level.$each(cell => {
            cell.__z = level.__cells[0].length - 1 - cell.__index;
        });

        level.__view.__needUpdateCellsZ = 1;

        if (params.start_grid_x == undefined || params.start_grid_y == undefined) {
            var wp = node.__worldPosition.__clone()
                , lwp = level.__view.__worldPosition.__clone().__multiplyScalar(-1);

            startAnimPos = lwp.__add(wp).__divide(node.__getWorldScale());
        } else {
            startAnimPos = level.__getCellPosition(params.start_grid_x, params.start_grid_y);
        }


        level.$each(cell => {
            var endAnimPos = level.__getCellPosition(cell.x, cell.y);

            if (params.__useCellOriginalPosition) {
                startAnimPos = level.__getCellPosition(cell.__value % cell.__grid.x, floor(cell.__value / cell.__grid.x));
            }

            cell.__setPosition(startAnimPos)
                .__setPosition(endAnimPos, duration, 0, easing, delay + delay_per_cell * cell.__index);

            if (rotateOnlySolved) shouldRotate = cell.__solved;

            if (shouldRotate) {
                cell.__anim([
                    [{ __scalex: 0}, 0.3, 0, easeSineO, params.__tmout || (duration * cell.__index / 3)], 
                    [{ __scalex: 1}, 0.1, 0, easeSineI]
                ]);
            }
        });
    },

    flyNodeToTheNode(node, params) {

        var flyNode = params.__flyNode
            , targetNode
            , sourceNode;

        if (flyNode) {
            if (!flyNode.isNode) {
                flyNode = create_temporary_node(flyNode);
            }
        } else {
            flyNode = node;
        }

        if (!flyNode) {
            consoleDebug('Wrong effect parameters, no flyNode')
            return;
        }

        if (params.__targetNode) {
            targetNode = params.__targetNode
        } else if (params.__target) {
            targetNode = getNodeByTarget(params.__target);
        } else {
            targetNode = node;
        }

        if (!targetNode) {
            consoleDebug('Wrong effect parameters, no target node')
            return;
        }

        if (params.__srcNode) {
            sourceNode = getNodeByTarget(params.__srcNode);
        } else if (params.__targetNode) {
            sourceNode = params.__targetNode;
        }

        if (!sourceNode) {
            consoleDebug('Wrong effect parameters, no source node')
            return;
        }

        if (!flyNode.__parent && flyNode != sourceNode) {
            sourceNode.__addChildBox(flyNode);
        }

        flyNodeToTheNode(flyNode, targetNode, mergeObjExclude(params, {
            __parentNode: targetNode
        }));
    }

}, {

    removeRenderOverTexture(node) {
        if (node.__post_effect_node) {
            node.__post_effect_node.__removeFromParent()
            node.__post_effect_node = 0;
        }
        if (node.__begin_post_effect_node) {
            node.__begin_post_effect_node.__removeFromParent()
            node.__begin_post_effect_node = 0;
        }
    },

    swaprt(node) {
        if (node.__renderTarget) {
            if (node.__renderTarget2) {
                var tmp = node.__renderTarget;
                node.__renderTarget = node.__renderTarget2;
                node.__renderTarget2 = tmp;
            } else {
                var sz = node.__getRTSize();
                node.__renderTarget2 = node.__renderTarget;
                node.__renderTarget = makeRenderTarget(sz.x, sz.y);
            }
        }
    },

    prepareRenderOverTexture(node, effect) {
        var size_delimeter = effect.size_delimeter || 1;

        function getSize() {
            return new Vector2(__screenSize.x / size_delimeter, __screenSize.y / size_delimeter);
        }

        var sz = getSize();
        var rt = makeRenderTarget(sz.x, sz.y);

        node.__post_effect_node = node.__addChildBox({
            __size: [1, 1],
            __getRTSize: getSize,
            __shader: 'base',
            __z: 10,
            __renderTarget: rt,
            map: rt.__texture,
            __render() {
                effect.__onRender();
                renderer.__setRenderTarget(0);
                this.map = rt.__texture;
                NodePrototype.__render.apply(this, arguments);
                if (effect.swaprt) {
                    Effects.swaprt(this);
                }
            }
        });

        var pen = node.__post_effect_node;

        node.__begin_post_effect_node = addToScene(new Node({
            __render() {
                var sz = pen.__getRTSize();
                pen.__renderTarget.__setSize(sz.x, sz.y);
                renderer.__setRenderTarget(pen.__renderTarget);
            }, __z: 10000
        }));

    },

    __selector(params, node) {
        if (params) {
            if (isObject(params)) {
                if (params.__selector) {
                    return Effects.__selector(params.__selector);
                } else if (params.isNode || params.isCell) {
                    return [params];
                } 
            } else if (isArray(params)) {
                return params;
            } else if (isString(params)) {
                if (params == "stack") {
                    var stack = AD.selectedStack;
                    // todo костыль, удалить после рефакторинга ячеек
                    $each(stack, c => {
                        c.__userData = Effects.__currentUserData;
                    })
                    return stack;
                }
            }
        }
    },

    __run(node, effect, params, disableUdEffects, selector) {
        Effects.__currentUserData = params;
        node = Effects.__selector(ifdef(selector, params)) || Effects.__selector(node);

        if (isArray(node)) {
            if (node.length > 1) {
            var nodes = node.slice();
            setTimeoutOrCallNow(a => {
                $each(nodes, (n, idx) => {
                    if (!n.__destructed) {
                        setTimeoutOrCallNow(a => {
                            if (!n.__destructed) {
                                Effects.__run(n, effect, { 
                                    __additionalDuration: (params.__duration_per_child || 0) * idx
                                }, disableUdEffects, 0);
                            }
                        }, (params.__delay_per_child || 0) * idx)
                    }
                })
            }, params.__delay)
            return;
        }

        node = node[0];
        if (!node) return;

        // todo проблема с перезаписывание параметров

        var ud = params ? mergeObj(params, node.__userData) : node.__userData || {};

        if (isFunction(effect)) {
            return effect(node, ud);
        } else if (!disableUdEffects) {
            $each(ud.__effects, (v, k) => {
                Effects.__run(node, Effects[k], v, 1);
            })
        }
    }
    },

    __stop(effect) {
        effect.__stop()
    }

})

var CellsCoins = makeClass(function (node) {
    this.__node = node;

}, {
    remove_money_from_letter(letter_cell, lifespan) {

        // remove old particles in cell
        var p = letter_cell.__money_particle;
        if (p) {
            p.__current_lifespan = lifespan || -1;
            letter_cell.__money_particle = 0;
        }
    },

    add_money_to_letters(targetNode) {
        var effectNode = (targetNode || AD.getLevelFieldNode()).__addChildBox({
                __effect: "money_idle",
                __z: -1000
            })
            , emitter = effectNode.__effect.__emitters[0]
            , unsolved_letter_cells = AD.__controller.getUnsolvedLetters()
            , letter_cells = $filter(unsolved_letter_cells, l => {
                var needCellCoin = $find(l.words, w => {
                    var word = w[0], letterIndex = w[1];
                    return word.getLetterConfig(letterIndex).cells_coins;
                })

                return (AD.needCellCoins || needCellCoin) && !l.__money_particle;
            })
            , letter_positions = $map(letter_cells, n => n.__offset)
            , dc = emitter.__defaultComponent
            , dc__initParticle = dc.__initParticle
            , ci = 0
            , cip = 0;

        $each(letter_cells, l => l.hasCellCoin = 1)

        this.__letter_moneys_emitter = emitter;

        dc.__initParticle = function (p) {
            dc__initParticle.call(this, p);
            letter_cells[ci++].__money_particle = p;
        };

        emitter.g.rate = part => letter_positions.length;

        var ud = this.__node.__userData || {}
            , cellCoinShiftY = ud.__cellCoinShiftY || 0;

        emitter.g.origin = part => {
            var pos = letter_positions[cip++ % letter_positions.length];
            return new Vector2(pos.x, -pos.y + cellCoinShiftY);
        };

        emitter.__getComponentByType('uv').g.__animationPostfix_factor = part => {
            return floor(TIME_NOW * 10) % 8;
        };
    },


    add_money_fly_to_letter(letter_cell) {
        var t = this;
        if (!t.__money_fly_effect_node) {

            t.__money_fly_effect_node = AD.getMainNode().__addChildBox({
                __effect: "money_fly",
                __z: -1005
            });
            t.__letter_to_emit_index = 0;
            t.__letters_to_emit = [];
            t.__money_fly_effect_emitter = t.__money_fly_effect_node.__effect.__emitters[0]

            t.__money_fly_effect_emitter.g.rate = part => t.__letters_to_emit.length * 10;
            t.__money_fly_effect_emitter.g.power = part => t.__letters_to_emit.length * 10;

            t.__money_fly_effect_emitter.g.origin = part => {
                t.__letter_to_emit_index = (t.__letter_to_emit_index + 1) % t.__letters_to_emit.length;
                var lc = t.__letters_to_emit[t.__letter_to_emit_index]
                    , pos = lc.__worldPosition;
                return new Vector2(pos.x, -pos.y);
            };

        }

        t.__money_fly_effect_emitter.__elapsed = 0;

        // remove old particles in cell
        t.remove_money_from_letter(letter_cell);

        // push new cell to emit
        t.__letters_to_emit.push(letter_cell);
        _setTimeout(a => {
            removeFromArray(letter_cell, t.__letters_to_emit);
        }, 0.5);

        BUS.__post(ON_EVENT_FLY);

    },
});