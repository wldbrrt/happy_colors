(function () {
    var projectFile = 'project.json';
    var head = document.getElementsByTagName('head')[0];

    function createXHRRequest(url, params) {
        var xhr = new XMLHttpRequest();
        for (var i in params) xhr[i] = params[i];
        xhr.open('GET', url, true);
        xhr.send();
        return xhr;
    }

    function criticalLoadingError(msg) {
        document.body.innerHTML = msg;
        throw msg;
    }

    function processFields(d) {
        for (var i in d) {
            if (fieldsCfg[i]) {
                try {
                    fieldsCfg[i](d[i], i);
                } catch (e) {
                    console.error(e);
                    criticalLoadingError("error while process field " + i + " from " + projectFile);
                }
            }

        }
    }

    function setfavicons(szs, rel) {
        for (var i in szs) {
            var link = document.createElement('link'), sz = szs[i];
            link.type = 'image/png';
            link.rel = rel;
            link.href = 'fvi/' + sz + '.png';
            link.sizes = sz + 'x' + sz;
            head.appendChild(link);
        }
    };

    function addScript(ssrc, onLoad) {
        var script = document.createElement("script");
        var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        // disable caching for tests
        script.src = ssrc + (isMobile ? '?rnd=' + Math.random() : "");
        script.async = false;
        script.onload = onLoad;
        script.onerror = function () { criticalLoadingError("loader error while loading " + this.src); };
        head.appendChild(script);
    }

    var fieldsCfg = {

        head: processFields,
        icon: setfavicons,
        'apple-touch-icon': setfavicons,

        title: function (txt) { t = document.createElement('title'); t.text = txt; head.appendChild(t); },
        meta: function (m) { for (var i in m) { var t = document.createElement('meta'); t.name = i; t.content = m[i]; head.appendChild(t); } },

        src: function (src) {

            var c = 0, nc = 0;
            function onLoad() {
                c++;
                if (c >= nc) {
                    var initFunc = window.$INIT$;
                    if (initFunc) {
                        addScript("../../eeditor/tools/unwind.js", function () {
                            window.$projectData$ = unwind(window.$projectData$)
                            initFunc(window.$projectData$, 'res');
                        })
                    }
                    else {
                        criticalLoadingError("loader error: function window.$INIT$ not found");
                    }
                }
            }

            for (var i in src) {
                for (var j in src[i]) {
                    nc++;
                    addScript(i + src[i][j], onLoad);
                }
            }
        }
    }

    var xhr = createXHRRequest(projectFile, {
        onerror: function () { criticalLoadingError("loader error while loading " + projectFile); },
        onload: function () {
            try {
                var d = JSON.parse(xhr.responseText);
                processFields(d);
                window.$projectData$ = d;
            } catch (e) {
                criticalLoadingError("error: can't parse " + projectFile);
            }
        }
    })



})();
