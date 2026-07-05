
AD.addBehaviour('orchange', node => {

   // node.__orientation = ORIENTATION_PORTRAIT;
 
    function updateOrientation() {

        if (node.__orientation != AD.__orientation && node.__userData) {

            node.__orientation = AD.__orientation;
            var ud = node.__userData;
            node.__init(
                AD.__orientation == ORIENTATION_PORTRAIT ? ud.__portrait : ud.__landscape
            );

        }
    }

    node.__addBusObservers(ON_ORIENTATION_CHANGED, updateOrientation);

    updateOrientation();


});