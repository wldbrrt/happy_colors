AD.addBehaviour('happy_colour', node => {
  const userData = node.__userData || {};
  const nodeSize = node.__size;
  const dataPath = userData.__dataPath;
  const cachePath = userData.__cachPath;
  const useSelectedColor = userData.__useSelectedColor;

  if (node.__visible === 0) return

  loadAndParseMesh(dataPath, cachePath).then((mesh) => {
    BUS.__post(LEVEL_STARTED, { mesh: mesh });
    node.__mergedMesh = mergeMeshes(mesh);

    initNode(node);
  });

  const initNode = (node) => {
    const mesh = node.__mergedMesh;
    let count1 = 0;
    let count2 = 0;

    const halfW = node.__size.x * 0.5;
    const halfH = node.__size.y * 0.5;

    for (let i = 0; i < mesh.vertices.length; i += 2) {
      const x = mesh.vertices[i];
      const y = mesh.vertices[i + 1];

      mesh.vertices[i] = x * halfW;
      mesh.vertices[i + 1] = -(y * halfH);

      mesh.vertices[i] < 0 || mesh.vertices[i + 1] < 0 ? count1++ : 0;
      mesh.vertices[i] > 0 || mesh.vertices[i + 1] > 0 ? count2++ : 0;
    }

    node.__init({
      __selectedColor: null,
      __shader: 'ca',
      __drawMe() {
        return renderer.__draw(this, this.__indecesBuffer.__realsize);
      },
      __updateUVS() {
        return this;
      },
      pointInPolygon(point, polygon) {
        let inside = false;

        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
          const xi = polygon[i].x;
          const yi = polygon[i].y;
          const xj = polygon[j].x;
          const yj = polygon[j].y;

          const intersect =
            ((yi > point.y) !== (yj > point.y)) &&
            (point.x < ((xj - xi) * (point.y - yi) / (yj - yi) + xi));

          if (intersect) {
            inside = !inside;
          }
        }
        return inside;
      },

      getRegionAtPoint(point) {
        const mesh = node.__mergedMesh;
        if (!mesh || !mesh.regions || !mesh.vertices) {
          return null;
        }

        for (let i = mesh.regions.length - 1; i >= 0; i--) {
          const region = mesh.regions[i];
          const polygon = [];

          if (region.isContour || region.colored) continue

          const start = region.vertexOffset * 2;
          const end = start + region.vertexCount * 2;

          for (let p = start; p < end; p += 2) {
            polygon.push({
              x: mesh.vertices[p],
              y: mesh.vertices[p + 1]
            });
          }

          if (polygon.length && this.pointInPolygon(point, polygon)) {
            return region;
          }
        }

        return null;
      },

      setRegionColor(region, color) {
        if (!node.__colorsBuffer || !region) return;

        const colors = node.__colorsBuffer.__array;
        const start = region.vertexOffset * 4;
        const end = (region.vertexOffset + region.vertexCount) * 4;

        for (let i = start; i < end; i += 4) {
          colors[i + 0] = color.r;
          colors[i + 1] = color.g;
          colors[i + 2] = color.b;
          colors[i + 3] = 1;
        }

        region.colored = true;
        node.__colorsBuffer.__changed = 1;
      },
      __onTap() {
        if (!node.__hitTest(mouse)) return;

        const localPoint = world_to_local(node, mouse);
        const region = this.getRegionAtPoint(localPoint);

        if (region && !region.isContour) {
          if (useSelectedColor && !node.__selectedColor) return
          const targetColor = useSelectedColor ? node.__selectedColor : new Color(region.color[0], region.color[1], region.color[2])
          this.setRegionColor(region, targetColor);
          BUS.__post(COLOR_CHANGED, { eventNode: this });
        }
      },
      __updateColors() {
        var count = this.__verticesCount * 4;
        if (!this.__colorsBuffer) {
          this.__colorsBuffer = this.__addAttributeBuffer('color', 4);
          const colors = this.__colorsBuffer.__getArrayOfSize(mesh.colors.length, 1);
          colors.set(mesh.colors);
        }
        return this;
      },
      __updateVertices() {
        if (!this.__verticesCount) {
          this.__removeAttributeBuffer('uv');
          this.__verticesCount = mesh.vertices.length / 2;
          this.__verticesBuffer = this.__addAttributeBuffer('position', 2);

          const arr = this.__verticesBuffer.__getArrayOfSize(mesh.vertices.length, 1);
          arr.set(mesh.vertices);

          this.__indecesBuffer = new MyBufferAttribute('', Uint16Array, 1, GL_ELEMENT_ARRAY_BUFFER, mesh.indices);
          this.__geomSize = nodeSize;
        }

        return this.__updateColors();
      }
    });

    node.update(1);
    node.__addBusObservers(COLOR_SELECTED, (eName, eData) => {
      node.__selectedColor = new Color().__fromJson(eData.selectedColor)
      node.__anim({ __scaleF: 2.5 }, 1);
    })
  };
});