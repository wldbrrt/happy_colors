//debug

 

var AdConfigParamsPanel = {
    name: 'AdConfigParamsPanel',
    title: 'Ad config',
    unique: 0,
    needRemoveOnClose: 1,

    headerButtons: [
        {
            t: 'Save', 
            
            f(existingPanel){

                invokeEventWithKitten("Files.save_json", {
                    path: existingPanel.__ud.path,
                    data: $filterObject(existingPanel.__objectToChange, v => v != null && v!= undefined)
                });

            } 
        }
    ],
 
    properties: {
        
        type: { 
            // [ 'object', 'b', 'number', 's', 'list', 'array', 'typename', 'ddList' ]
            type: 'ddList',
            label: 'level type',
            tooltip: 'Тип уровня',
            values: ['list', 'crossword', 'sudoku']
        },

        tapsToRedirect:  {
            type: "number",
            label: 'taps to redirect',
            tooltip: 'Количество тапов для редиректа\nпо умолчанию = 0',
            __defaultValue: 0
        },
 
        wordsToRedirect: {
            type:"number",
            label: 'words to redirect',
            tooltip: 'Количество разгаданных слов для редиректа\nпо умолчанию = -1',
            __defaultValue: -1
        },

        ha: {
            type: 'ddList',
            label: 'alignment',
            values: [0, 1, 2],
            tooltip: 'Выравнивание слов\n( list )\nпо умолчанию = 1'
        },


        tutorWord: {
            label: 'tutorial word',
            type: "number",
            tooltip: 'Индекс слова для туториала\nпо умолчанию = -1',
            __defaultValue: -1
        },

        failedTimeout: 
        {
            label: 'fail timeout',
            type: "number",
            tooltip: 'Время после которого уровень считается проигранным\n( сек )\nпо умолчанию = 0',
            __defaultValue: 0
        },

        completeTimeout: 
        {
            type: "number",
            label: 'complete timeout',
            tooltip: 'Время после которого уровень считается завершенным\n( сек )\nпо умолчанию = 0',
            __defaultValue: 0
        },

        redirectTimeout: 
        {
            type: "number",
            label: 'redirect timeout',
            tooltip: 'Время после которого происходит автоматический редирект\n( сек )\nпо умолчанию = 0',
            __defaultValue: 0
        },

        redirectCongratTimeout: {
            type: "number",
            label: 'congrat redirect timeout',
            tooltip: 'Время после которого происходит автоматический редирект в пэкшоте\n( сек )\nпо умолчанию = 0',
            __defaultValue: 0
        },

        screen_aspect_factor: {
            label: 'screen aspect factor',
            type: "number",
            tooltip: 'Коэффициент пропорции перехода между горизонтальным и вертикальным режимами верски\nпо умолчанию = 1',
            __defaultValue: 1
        },

        congratOnLevelCompleted: {
            label: 'congrat on level completed',
            type: "number",
            tooltip: 'Номер уровня, на котором нужно показать пэкшот при завершении уровня\nпо умолчанию = -1',
            __defaultValue: -1
        },

        congratOnLevelFailed: {
            label: 'congrat on level failed',
            type: "number",
            tooltip: 'Номер уровня, на котором нужно показать пэкшот при провале уровня\nпо умолчанию = -1',
            __defaultValue: -1
        },
 

        completeDelay: {
            label: 'complete delay',
            type: "number",
            tooltip: 'Время после которого показывается пэкшот при выигрыше\n( сек )\nпо умолчанию = 0',
            __defaultValue: 0
        },

        failedDelay: {
            label: 'failed delay',
            type: "number",
            tooltip: 'Время после которого показывается пэкшот при проигрыше\n( сек )\nпо умолчанию = 0',
            __defaultValue: 0
        },
 
        solve_cells_to_redirect: {
            label: 'solve cells to redirect',
            type: "number",
            tooltip: 'Количество решенных клеток для редиректа\n( sudoku )\nпо умолчанию = -1',
            __defaultValue: -1
        },

        solve_cells_to_complete: {
            label: 'solve cells to complete',
            type: "number",
            tooltip: 'Количество решенных клеток для завершения уровня\n( sudoku )\nпо умолчанию = -1',
            __defaultValue: -1
        },
 
         
        back: {
            label: 'background',
            type:'s',
            tooltip: 'Задник уровня\nпо умолчанию = ""'
        },

        field: {
            type:'s',
            tooltip: 'Строка уровня\n( sudoku, 81 цифра )\nпо умолчанию = ""'
        },

        solved: {
            type:'s',
            tooltip: 'Маска решенных чисел уровня\n( sudoku, 81 цифра 1/0 )\nпо умолчанию = ""'
        },


        openFirstLetter: {
            label: 'open first letter',
            type: 'b',
            tooltip: 'Открыть первую букву\n( list )\nпо умолчанию = 0'
        },

        sorted: {
            type: 'b',
            tooltip: 'Список слов не надо сортировать\n( list )\nпо умолчанию = 0'
        },
   
        redirectOnTapCongrat: {
            label: 'redirect on tap congrat',
            type: "b",
            tooltip: 'Редирект при тапе в любое место в пэкшоте\nпо умолчанию = 0'
        },


        redirectOnGameEnd: {
            label: 'redirect on game end',
            type: "b",
            tooltip: 'Автоматический редирект при провале или завершении уровня\nпо умолчанию = 0'
        },

        
        gameEndOnFail:  {
            label: 'game end on level failed',
            type: "b",
            tooltip: 'Завершать ли игру при провале уровня\nпо умолчанию = 0'
        },

        redirect_url: {
            label: 'redirects',
            type: 'object',
            properties: {
                ios: { type: 's', tooltip: 'url игры в GooglePlay' },
                android: { type: 's', tooltip: 'url игры в AppStore' }
            }
        },
        /*

        levels: {
            type: 'array',
            item_viewer(existingPanel, index) {
                AdConfigParamsPanel.title = 'Ad level ' + index;
                showParamsPanel(AdConfigParamsPanel, existingPanel.__ud, existingPanel.__objectToChange.levels[index]);
            },

            item_constructor(existingPanel, index){
                return {}
            }
        }
        */
    },
    panelWidth: 500
};

function showParamsPanel(panel, ud, object, busObservers, propertyBinding) {
    
    panel.object = object;
    panel.__propertyBinding = propertyBinding;
    panel.acceptor = 'middle';
 
    var existingPanel = invokeEventWithKitten('Editor.showCustomPanel', panel, {}, 1);
    existingPanel.__ud = ud;
    
    var panelNode = PanelsWithKitten.$(panel.name);
    if (panelNode) {
        var my = __screenSize.y - 100;
        panelNode.__maxsize = { x: 300, y: my };
        panelNode.__maxsize = { x: 300, y: my - 30 };

        panelNode.__busObservers = mergeObj(busObservers || {}, {
            VIEW_UPDATED() {
                EditFieldsWithKitten.updateAllPropsIn(PanelsWithKitten.$(panel.name));
            },

            LAYOUT_DEACTIVATED() { // при переходе на другой лейаут
                // PanelsWithKitten._closePanel(panelNode);
            }
        });
    }

    return panelNode;
} 


var ConfigFileWorker = {
    
    onTap(node) {
        
        var m = this.match;
        var path = m[0];

        activateProjectOptions();
        getJson(path, data => {

            AdConfigParamsPanel.title = 'Ad config ' + path;
            showParamsPanel(AdConfigParamsPanel, {
                path: path
            }, data);

        });
        deactivateProjectOptions();

    } 
};

// showParamsPanel(StateParamsPanel, PlayerState);

FileWorkersWithKitten['conf/level\\.json$'] = ConfigFileWorker;


addEditorEvents('Ad', {

    newSubproject(existingPanel) {
        AskerWithKitten.ask({ caption: "Enter ad project name",  
    
        ok(subproject) {
            if (subproject){
                var data = $filterObject(existingPanel.__objectToChange, v => v != null && v!= undefined);
         
                if (!data.projects[subproject]){

                    data.projects[subproject] = {
                        "packing": [ { "LANG": "auto" }, { "LANG": "en" }, { "LANG": "ru" } ],
                        "options": { "__supportedLangs": [ "en", "ru" ] },
                        "res": [ ]
                    };

                    data.buildFlags.SUBPROJECT = subproject;

                    data.editor_properties.buildFlags.properties.SUBPROJECT.values.push(subproject);

                    var cc = 0;

                    // replace project hack                
                    
                    var pdir = Editor.currentProject.options.__projectServerPath;
                    Editor.currentProject.options.__projectServerPath = subproject + '/';
                    
                    invokeEventWithKitten("Files.mkdir", {
                        dirs: $map([
                            "bg",
                            "conf",
                            "fonts",
                            "img",
                            "lang",
                            "layouts",
                            "particles",
                            "sounds"
                        ], v => {
                            return { name: v, path: '../' + subproject }
                        }),
                        cb(){
                            cc++;
                            if (cc==2) html.__reload();
                        }
                    });

                    Editor.currentProject.options.__projectServerPath = pdir;

                    invokeEventWithKitten("Files.save_json", {
                        path: 'project.json',
                        absolute: 1,
                        data: data,
                        cb(result){
                            if (result) {
                                cc++;
                                if (cc==2) html.__reload();
                            }
                        }
                    });
                }

            }
        }
    });


    }
});


//undebug