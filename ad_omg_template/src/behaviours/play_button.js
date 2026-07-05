
AD.addBehaviour('play_button', node => {

    node.__init({
        __onTap(){
            BUS.__post(CTA_CLICK);

            switch (node.__propertyBinding) {
                case "start_next_level" : {
                    if (node.__numericInputStep != undefined) {
                        AD.__controller.nextLevelIndex = Number(node.__numericInputStep);
                    }
                    AD.__controller.LevelCompleted();
                    closeWindow('congrat');
                    break;
                };
                case "reload": html.__reload(); break;
                default: AD.__redirect();
            }
        },
        __onTapHighlight: 1
    }).__anim({
        __scaleF:[ node.__scaleF, node.__scaleF*1.05 ],
        __alphaDeep: [0.5, 1]
    }, 0.5, -1, easeSineIO)


});

AD.addBehaviour('reload', node => {
    AD.__redirect = function() {
        html.__reload();
    }
});