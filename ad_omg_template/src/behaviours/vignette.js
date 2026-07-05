
AD.addBehaviour('vignette', node => {
    var ud = node.__userData || {};
    var listener = {
        __on(m, word) {
            if (AD.wrong_words_behaviour && word && inArray(word.text || word, AD.config.wrong_words)) {
            } else {
                var target = scene;

                if (AD.targetNodeIdx != undefined) {
                    target = node;
                    if (AD.targetNodeIdx != node.__source_index) return;
                } 

                Effects.__run(target, Effects.vignette, {
                    __duration: ud.__duration || 0.5,
                    __color: ud.__color || '#f00',
                    __alpha: ud.__alpha || 0.5,
                    __shader: ud.__shader,
                    f1: -1
                });
            }
           
        }
    };
    // такой код нужен для исключения пересечения с другими событиями
    /// \todo: может стоит вынести в отдельную функцию
    BUS.__addEventListener( WORD_BAD, listener );
    BUS.__addEventListener( ON_ERROR, listener );
    node.__addOnDestruct(a => {
        BUS.__removeEventListener( listener );
    })
});
