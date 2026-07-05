/*
 * операции по инициаизации загрузки игры, по загрузке ресурсов игры, конфигов
 * различные харкодные конфиги
 */

set(__window, '$INIT$', wrapFunctionInTryCatch(function (projectData) {

    options.__projectData = projectData || {};

    //debug
        var opts1 = projectData.options;
        mergeObjectDeep(options, opts1);
    //undebug

    var opts = globalConfigsData["build_res/opts.json"] || {},
        resources = opts.res;

    mergeObjectDeep(options, opts.options);
    
    //debug
        resources = projectData.res;
    //undebug

    options.__lang = get(projectData, "lang") || options.__lang;

    createGame({
        element: document.getElementById('gameDiv'),
        onCreate: function () {

            // bidease
            html.__opensdk(__window, "sendImpression");

            scene.onResize = function () {
                scene.__eachChild(function (c) {
                    c.update(1);
                });
            };

            consoleLog('beginLoadGameResources');
            
            TASKS_RUN(resources, function () {

                globalConfigsData = $map(globalConfigsData, function (d) {
                    return d.packed ? repackJson(d.packed) : d.pkd ? unpackJson(d.pkd) : d;
                });

                BUS.__post(__ON_GAME_LOADED);

            });

        }
    });

}));

