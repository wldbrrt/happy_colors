AD.addBehaviour('move_on_tap', node => {
  node.__addBusObservers(LEVEL_STARTED, () => {
    const userData = node.__userData || {};
    const isMandala = userData.__isMandala;
    const targetNodeName = userData.__targetNode;
    const targetNode = getNodeByAlias(AD.getMainNode(), 'targetNodeName', { [targetNodeName]: 1 })

    node.__onTap = () => {
      if(node.__moved) return
      flyNodeToTheNode(node, targetNode, mergeObjExclude(userData,
        {
          __parentNode: targetNode,
          __callback: () => {
            node.__z = -1
            node.__childs.forEach((c) => c.__z = -2)
          }
        }));
      node.__moved = true;
      node.__isEventTarget = true;
      BUS.__post(LEVEL_READY, { target: node.__name, isMandala: isMandala, node: node.__childs[1]});
    };
  })
})