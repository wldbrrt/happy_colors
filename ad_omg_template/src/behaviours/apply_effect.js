AD.addBehaviour('apply_effect', node => {
    var ud = node.__userData || {}
        , effects = ud.apply_effect;

    if (!effects) return;

    function addListener(i) {
        node.__addBusObservers(effects[i], () => {
            var effectNames = objectKeys(effects[i + 1]);
            $each(effectNames, effectName => {
                Effects.__run(node, Effects[effectName], effects[i + 1][effectName]);
            })
        })
    };

    for (var i = 0; i < effects.length; i += 2) {
        addListener(i);
    };

})