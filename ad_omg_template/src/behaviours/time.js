function addTimerToNode(node, params){
    node.__init({
        __timer: new Timer(params),   
        __clearTimer: () => {  
            if (node.__timer) {
                node.__timer.__stop();
                node.__timer = 0;
            }
        } 
    });
   node.__addOnDestruct(node.__clearTimer);
   node.__timer.__onTick(); // первое обновление текста
}

AD.addBehaviour('time', node => {
    var ud = node.__userData || {}
        , timeFormat = ud.__timeFormat // если не задано, то по умолчанию будет 'M:S'
        , params = ud.__timerParameters || {}

    params.__onTick = function() {
        node.__text = this.__getText(timeFormat);
    };

    addTimerToNode(node, params);

    node.__addBusObservers(
        LEVEL_COMPLETED, node.__clearTimer,
        LEVEL_FAILED, node.__clearTimer
    )
})