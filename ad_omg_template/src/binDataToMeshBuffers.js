function loadAndParseMesh(path, cachePath) {
  return new Promise(function (resolve, reject) {
    try {
      var dataUri = globalConfigsData[cachePath];

      function parseBuffer(buffer) {
        var view = new DataView(buffer);

        var offset = 0;
        var pathCount = view.getUint32(offset, true);
        offset += 4;

        var result = [];

        for (var p = 0; p < pathCount; p++) {
          var vertexCount = view.getUint16(offset, true);
          offset += 2;

          var indexCount = view.getUint16(offset, true);
          offset += 2;

          var vertices = new Float32Array(vertexCount * 2);

          for (var i = 0; i < vertices.length; i++) {
            vertices[i] = view.getFloat32(offset, true);
            offset += 4;
          }

          var indices = new Uint16Array(indexCount);

          for (var j = 0; j < indexCount; j++) {
            indices[j] = view.getUint16(offset, true);
            offset += 2;
          }

          var colorBytes = new Uint8Array(buffer, offset, 4);
          offset += 4;

          var color = new Float32Array([
            colorBytes[0] / 255,
            colorBytes[1] / 255,
            colorBytes[2] / 255,
            colorBytes[3] / 255
          ]);

          result.push({
            vertices: vertices,
            indices: indices,
            color: color
          });
        }

        return result;
      }

      function base64ToArrayBuffer(dataUri) {
        var base64 = dataUri.split(",")[1];
        var binary = atob(base64);
        var len = binary.length;

        var buffer = new ArrayBuffer(len);
        var bytes = new Uint8Array(buffer);

        for (var i = 0; i < len; i++) {
          bytes[i] = binary.charCodeAt(i);
        }

        return buffer;
      }

      // 1) из кэша
      if (dataUri) {
        var buffer = base64ToArrayBuffer(dataUri);
        resolve(parseBuffer(buffer));
        return;
      }

      // 2) fallback fetch
      fetch(path)
        .then(function (r) {
          return r.arrayBuffer();
        })
        .then(function (buffer) {
          resolve(parseBuffer(buffer));
        })
        .catch(reject);

    } catch (e) {
      reject(e);
    }
  });
}

function mergeMeshes(meshes) {
  let totalVertices = 0;
  let totalIndices = 0;

  for (const m of meshes) {
    totalVertices += m.vertices.length / 2;
    totalIndices += m.indices.length;
  }

  const vertices = new Float32Array(totalVertices * 2);
  const colors = new Float32Array(totalVertices * 4);
  // const indices = new Uint16Array(totalIndices);
  const indices = new Uint32Array(totalIndices);

  const regions = [];

  let vOffset = 0;
  let iOffset = 0;

  for (const mesh of meshes) {
    const vCount = mesh.vertices.length / 2;
    const iCount = mesh.indices.length;

    vertices.set(mesh.vertices, vOffset * 2);

    const c = mesh.color;
    const color = new Color(c[0], c[1], c[2])
    const isContour = color.getHexString() == "000000"

    for (let i = 0; i < vCount; i++) {
      const idx = (vOffset + i) * 4;
      const defaultColor = isContour ? color : new Color(1, 1, 1)

      colors[idx + 0] = defaultColor.r;
      colors[idx + 1] = defaultColor.g;
      colors[idx + 2] = defaultColor.b;
      colors[idx + 3] = c[3];
    }

    for (let i = 0; i < iCount; i++) {
      indices[iOffset + i] =
        mesh.indices[i] + vOffset;
    }

      regions.push({
        vertexOffset: vOffset,
        vertexCount: vCount,
        indexOffset: iOffset,
        indexCount: iCount,
        color: mesh.color,
        isContour: isContour
      });

    vOffset += vCount;
    iOffset += iCount;
  }

  return {
    vertices,
    colors,
    indices,
    regions
  };
}