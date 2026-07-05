
AD.addBehaviour('scale_content', node => {
    var step = node.__numericInputStep;
    node.update = node.__img && !step ? function () {
        var psz = this.__parent.__contentSize
            , isz = this.__imgSize 
            , sz = isz || this.__size
            , p_aspect = psz.x / psz.y
            , aspect = sz.x / sz.y;

        if (this.__uvsTransform > 3 && isz) {
            this.__scaleF = mmax(psz.y / sz.x, psz.x / sz.y);
        }
        else {
            this.__scaleF = p_aspect > aspect ? psz.x / sz.x : psz.y / sz.y;
        }

        return NodePrototype.update.apply(this, arguments);

    } : function () {

        var psz = this.__parent.__contentSize
            , sz = step == 1 ? this.__size : this.__contentSize;

        this.__scaleF = mmin(psz.x / sz.x, psz.y / sz.y);
        return NodePrototype.update.apply(this, arguments);
    };

    node.update();

}); 