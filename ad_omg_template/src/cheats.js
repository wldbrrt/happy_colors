var __cheats_tmp = {};
var __ON_CHEATS_ENABLED = "__ON_CHEATS_ENABLED";

function showMessage() {
    var args = arguments;
    if (!AD.getMainNode()) {
        _setTimeout(a => { showMessage.apply(__window, args) }, 0.1);
        return;
    }
    var s = '';
    for (var i in args) { s += '' + args[i] + (i == args.length - 1 ? '' : ' '); }
    if (__cheats_tmp.cur_message) {
        if (__cheats_tmp.cur_message.__showTime > TIME_NOW - 0.5) {
            _setTimeout(a => { showMessage.apply(__window, args) }, 2);
            return;
        } else {
            __cheats_tmp.cur_message.__removeFromParent();
        }

    }
    __cheats_tmp.cur_message = new Node({
        __size: [1, 1], __padding: 50,
        __color: '#000', __alpha: 0.8,
        ha: 0, __text: { __text: s, __autowrap: 1, __align: 0, __autoscale: 1 }, __z: -500,
        __onTap() { this.__removeFromParent(); if (__cheats_tmp.cur_message == this) __cheats_tmp.cur_message = 0; }
    });
    __cheats_tmp.cur_message.__showTime = TIME_NOW;
    addToScene(__cheats_tmp.cur_message);
    return __cheats_tmp.cur_message;
}

(a => {
    var cheatsState;

    function save_cheats() { LocalSetKey('cs', JSON.stringify(cheatsState)); }

    function wrap(n) {
        var getf = a => get(cheatsState, n);
        return {
            get: getf,
            set(v) { if (getf() != v) { set(cheatsState, n, v); save_cheats(); } }
        }
    }

    var cheatsState = ObjectDefineProperties({}, {
        __soundsDisabled: wrap('sd'),
        __musicDisabled: wrap('md'),
        __redirectsDisabled: wrap('rd'),
        __isCheatsEnabled: wrap('ce')
    });

    try { mergeObj(cheatsState, JSON.parse(LocalGetKey('cs'))); } catch (e) { }

    if (typeof _canPlayMusic != undefinedType) {
        _canPlayMusic = function () { return !cheatsState.__musicDisabled }
        _canPlaySingleSound = function () { return !cheatsState.__soundsDisabled }
    }


    var oldr = AD.__redirect;

    AD.__redirect = function (a, b) {
        if (cheatsState.__redirectsDisabled) return;
        oldr.call(this, a, b);
    }


    //consoleLog(cheatsState);


    function notch_info() {

        var body = html.__getBody();
        var text = "";

        function test(prefix, func) {
            var aa = ["top", "right", "bottom", "left"];
            var e = html.__addCSSStyle("body { " + $map(aa, s => prefix + "-" + s + ":" + func + "(safe-area-inset-" + s + ");") + "; }");

            var cstyle = getComputedStyle(body);

            $each(aa, a => {
                var pname = prefix + "-" + a;
                var pval = cstyle.getPropertyValue(pname);
                var pnum = toNumber(pval);
                text += func + "-" + pname + " : " + pval + (pnum ? " -> " + pnum : "") + "\n"
            }) + "\n";

            html.__removeElement(e);
        }

        $each(['env', 'constant'], func => $each(['sa', 'margin', 'padding'], prefix => test(prefix, func)));
        text += "safe area : " + JSON.stringify(getSafeAreaPaddings())
        showMessage(text);
    }


    function detect_ad_platform() {
        if (isFunction(get(__window, "openAppStore"))) return 'tiktok';
        if (isFunction(get(__window, "FbPlayableAd", "onCTAClick"))) return 'facebook';
        if (isFunction(get(__window, "install"))) return 'mintegral';
        if (isFunction(get(__window, "BGY_MRAID", "open"))) return 'bgy';
        if (isFunction(get(__window, "sendImpression") || get(__window, "trackClick"))) return 'Bidease';
        if (__mraid) return 'mraid (Unity, AppLovin, Bidease, etc.)';
        return 'unknown'
    }

    function argStringify(arg) {
        if (isString(arg)) return JSON.stringify(arg);
        return readableStringify(arg, 0, 1);
    }

    function redirect_info() {

        if (!__cheats_tmp.redirect_captured) {
            var stack;
            var line = 0;
            function track(f, msg, notcall) {
                var original = f;

                return function () {

                    var ll = line++;
                    if (!stack) {
                        stack = [];
                        showMessage('collecting redirect info...');
                        _setTimeout(function () {
                            showMessage($map(stack.sort((a, b) => a.line - b.line), s => s.text).join('\n'));
                            stack = 0;
                        }, 1);
                    }

                    var text = msg + '( ';
                    for (var i = 0; i < arguments.length; i++) {
                        text += argStringify(arguments[i]) + (i < arguments.length - 1 ? ', ' : ' ');
                    }
                    text += ")\n> > > > ";
                    if (notcall) {
                        text += '<no call>\n';
                        stack.push({ line: ll, text: text });
                    } else {
                        var res = original.apply(this, arguments);
                        text += argStringify(res) + '\n';
                        stack.push({ line: ll, text: text });
                        return res;
                    }

                }
            }

            function track_sdk(a, msg, notcall) {
                var f = get.apply(this, a);
                if (isFunction(f)) {
                    f = track(f, msg, notcall);
                    var last = a.pop()
                    var o = getDeepFieldFromObject.apply(this, a);
                    if (o) o[last] = f;
                }
            }

            __cheats_tmp.redirect_captured = 1;

            AD.__redirect = track(AD.__redirect, 'AD.redirect');
            html.__openAppStore = track(html.__openAppStore, 'html.openAppStore');
            html.__redirect = track(html.__redirect, 'html.redirect', 1);
            if (__mraid) __mraid.__open = track(__mraid.__open, 'mraid.open', 1);
            track_sdk([__window, "openAppStore"], 'tiktok.openAppStore', 1);
            track_sdk([__window, "FbPlayableAd", "onCTAClick"], 'FbPlayableAd.onCTAClick', 1);
            track_sdk([__window, "install"], 'mintegral.install', 1);
            track_sdk([__window, "gameEnd"], 'mintegral.gameEnd', 1);
        }

        var platform = detect_ad_platform();
        showMessage(
            "ad platform: " + platform + "\n\n",
            "redirect capture enabled");

    }

    function browser_info() {
        var flags = set({
            name: "name",
            opera: "opera",
            version: "version",
            samsungBrowser: "samsungBrowser",
            coast: "coast",
            yandexbrowser: "yandexbrowser",
            ucbrowser: "ucbrowser",
            maxthon: "maxthon",
            epiphany: "epiphany",
            puffin: "puffin",
            sleipnir: "sleipnir",
            kMeleon: "kMeleon",
            windowsphone: "windowsphone",
            msedge: "msedge",
            msie: "msie",
            chromeos: "chromeos",
            chromeBook: "chromeBook",
            chrome: "chrome",
            vivaldi: "vivaldi",
            sailfish: "sailfish",
            seamonkey: "seamonkey",
            firefox: "firefox",
            firefoxos: "firefoxos",
            silk: "silk",
            phantom: "phantom",
            slimer: "slimer",
            blackberry: "blackberry",
            webos: "webos",
            touchpad: "touchpad",
            bada: "bada",
            tizen: "tizen",
            qupzilla: "qupzilla",
            chromium: "chromium",
            safari: "safari",
            googlebot: "googlebot",
            blink: "blink",
            webkit: "webkit",
            gecko: "gecko",
            android: "android",
            iosdevice: "iosdevice",
            ios: "ios",
            mac: "mac",
            xbox: "xbox",
            windows: "windows",
            linux: "linux",
            osversion: "osversion",
            tablet: "tablet",
            mobile: "mobile",
            a: "a",
            c: "c",
            x: "x"
        }, "ipod", "ipod", "iphone", "iphone", "ipad", "ipad");

        var text = $mapObjectToArray(
            $mapAndFilter(flags, (v, i) => _bowser[i] != undefined ? v + " : " + _bowser[i] : undefined),
            (v, i) => v
        ).join('\n');
        showMessage(text);
    }

    function cheat_lang(l){
        return a => { LocalSetKey('lang', l); html.__reload(); };
    }

    var iscc = 0, lcc;
    var handle_cheat_tap = (a) => function() {
        if (iscc == -1) {
            this.__onTap = 0;
            return;
        }
        if (lcc == a) {
            iscc = -1;
            this.__onTap = 0;
            return;
        }
        lcc = a;
        iscc++;
        if (iscc > 9) {
            cheatsState.__isCheatsEnabled = 1;
            BUS.__post(__ON_CHEATS_ENABLED, {});
            iscc = -1;
            this.__onTap = 0;
        }

    };


    var cheats = [

        "fullscreen", a => {
            isFullScreen() ? exitFullScreen() : enterFullScreen();
        }

        , "redirect", a => AD.__redirect()

        , "complete", a => AD.__controller.LevelCompleted()

        , "fail", a => AD.__controller.LevelFailed()

        , "sound", a => cheatsState.__soundsDisabled = !cheatsState.__soundsDisabled

        , "music", a => {
            cheatsState.__musicDisabled = !cheatsState.__musicDisabled;
            if (cheatsState.__musicDisabled) { stopAllSounds(); }
            else { playSound('s_music', 1); }
        }
        , "debug", [
            "catch redirects", redirect_info,
            "no redirects", a => { cheatsState.__redirectsDisabled = !cheatsState.__redirectsDisabled; LocalSetKey('redirectsDisabled', cheatsState.__redirectsDisabled); },
            "notch info", notch_info,
            "browser info", browser_info,
            "lang", [
                "en", cheat_lang('en'),
                "ru", cheat_lang('ru'),
                "es", cheat_lang('es'),
                //"pt", cheat_lang('pt'),
                "pt_pt", cheat_lang('pt_pt'),
                "pt_br", cheat_lang('pt_pt'),
                "de", cheat_lang('de'),
                "fr", cheat_lang('fr'),
                "it", cheat_lang('it'),
                "id", cheat_lang('id'),
                "tr", cheat_lang('tr'),
                "ko", cheat_lang('ko'),
                "ja", cheat_lang('ja')
            ],
            "time", [
                "0.1", a => { options.__timeMultiplier = 0.1; }
                , "0.5", a => { options.__timeMultiplier = 0.5; }
                , "1", a => { options.__timeMultiplier = 1; }
                , "2", a => { options.__timeMultiplier = 2; }
                , "5", a => { options.__timeMultiplier = 5; }
                , "10", a => { options.__timeMultiplier = 10; }
            ]
        ],
        "close cheats", a => {
            cheatsState.__isCheatsEnabled = 0;
            LocalRemoveKey('lang');
            html.__redirect(__window.location.href, 1);
        }
    ];

//debug
    cheatsState.__isCheatsEnabled = 1;
//undebug

    var listener = cheatsState.__isCheatsEnabled ? __ON_GAME_LOADED : __ON_CHEATS_ENABLED;

    BUS.__addEventListener(listener, a => {

        function fillCheats(pnode, list) {
            pnode.__clearChildNodes();
            $each(list, (cheat, i) => {
                if (i % 2) {
                    pnode.__addChildBox({
                        __text: list[i - 1], __color: "#000", __alpha: 0.8, __size: [1, 56],
                        __spacing: 2, __padding: 6,
                        __onTap() {
                            if (isArray(cheat)) {
                                fillCheats(pnode, cheat)
                            } else {
                                cheat()
                            }
                        },
                        __onTapHighlight: 1
                    });
                }
            });
        }

        var cheatPanel = new Node({
            __size: [1, 1],
            __z: -500,
            __childs: [
                {
                    sva: 0, sha: 2, __y: 70, __size: [50, 50],
                    __img: 'bt_mix',
                    __visible: _bowser.mobile,
                    __onTap() {
                        html.__redirect(__window.location.href, 1)
                    }
                },

                {
                    sva: 2, sha: 2,
                    __y: 0, __size: [70, 70],
                    __text: { __text: '[c]', __lineWidth: 2 },
                    __onTap() {
                        var pp = cheatPanel.__childs[2];
                        pp.__visible = !pp.__visible;
                        if (pp.__visible) {
                            fillCheats(pp, cheats);
                        }
                    }
                },
                {
                    sva: 2, sha: 2, ha: 0, va: ALIGN_FROM_START_TO_END,
                    __size: [300, 1, 0, 'o'],
                    __maxsize: {
                        x: 300,
                        y: 470
                    },
                    __visible: 0,
                    __x: -5, __y: -56, __scroll: 1
                }
            ]

        });

        var fpsNode = cheatPanel.__addChildBox({ sha: 0, sva: 2, __size: [70, 70], __text: { __lineWidth: 2 } });
        _setInterval(function () { fpsNode.__text = currentFPS; }, 1);

        addToScene(cheatPanel);
        return 1;
    });

    if (!cheatsState.__isCheatsEnabled) {
        BUS.__addEventListener(__ON_GAME_LOADED, a => {
            var startPanel = new Node({
                __size: [1, 1],
                __z: -400,
                __childs: [
                    {
                        sva: 0, sha: 2,  __size: [100, 100],
                        __onTap: handle_cheat_tap('l')
                    },
                    {
                        sva: 0, sha: 0,  __size: [100, 100],
                        __onTap: handle_cheat_tap('r')
                    }
                ]
            });

            addToScene(startPanel);
            return 1;
        })
    }


})();
