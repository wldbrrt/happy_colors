
AD.addBehaviour('orientation_rotator', node => {
    /*
    function switchFour(p){
        // switch padding/margin/spacing: top <-> left , bottom <-> right
        if (p) {
            var tmp = p[0]; p[0] = p[1]; p[1] = tmp;
            tmp = p[2]; p[3] = p[2]; p[3] = tmp;
        }
    }
    */
    node.__baseOrientation = ORIENTATION_PORTRAIT;
    var original_align = node.__alignment || [1, 3];

    function updateOrientation() {

        if (node.__baseOrientation != AD.__orientation) {

            node.__baseOrientation = AD.__orientation;

            node.__alignment = AD.__orientation == ORIENTATION_LANDSCAPE ? [original_align[1], original_align[0]] : original_align;

            node.__eachChild(n => {
                var sz = n.____size;
                if (isObject(sz)) {
                    // switch size: width <-> height
                    var tmp = sz.x;
                    sz.x = sz.y;
                    sz.y = tmp;
                    tmp = sz.px;
                    sz.px = sz.py;
                    sz.py = tmp;
                    n.__size = n.____size;

                    /*
                    switchFour(n.__padding);
                    switchFour(n.__margin);
                    switchFour(n.__spacing);
                    */

                    // n.__dirty = 5;
                }
            });
        }
    }


    node.__addBusObservers(ON_ORIENTATION_CHANGED, updateOrientation);

    updateOrientation();


});