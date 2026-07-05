AD.addBehaviour('tap_to_color', node => {
  const userData = node.__userData || {}
  const animParams = userData.tap_to_color.__anim_params

  node.__addBusObservers(LEVEL_READY, () => {
    if (node.__isEventTarget) {
      const eNode = node.__addChildBox({
        __class: 'tap_to_color',
        __alphaDeep: 0
      })

      Effects.__run(eNode, Effects.animIn, animParams)
      node.__addBusObservers(ON_POINTER_DOWN, () => {
        BUS.__post(LEVEL_COMPLETED);
      })
    }
  }
  )
})