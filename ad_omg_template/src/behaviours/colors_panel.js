AD.addBehaviour('colors_panel', node => {
  const userData = node.__userData || {};
  const colors = AD.config.colors;

  node.__addBusObservers(LEVEL_READY, (eName, eData) => {
    if (!eData.isMandala) return;

    node.__init({
      __addColors() {
        colors.forEach((colorString, ind) => {
          const childNode = node.__addChildBox({
            name: `_colorItem_${ind}`,
            __class: 'color_select',
            __color: new Color().__fromJson(colorString),
            __text: ind + 1,
            __onTap: () => {
              node.__childs.forEach(c => {
                c.__class = 'color_select';
                c.__selected = false
              })
              childNode.__class = "color_select:selected";
              childNode.__selected = true;
              BUS.__post(COLOR_SELECTED, {selectedColor: colorString, eventNode: childNode});
            }
          })
        })
      }
    })

    node.__addColors();
    BUS.__post("COLORS_CREATED");
    node.__anim({__y: -80}, 0.7, 0, 1, 0.3);

    return 1
  }
  )
})