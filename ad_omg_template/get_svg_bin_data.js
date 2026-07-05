const fs = require("fs");
const path = require("path");
const { DOMParser } = require("xmldom");
const xpath = require("xpath");
const earcut = require("earcut");
const parse = require("parse-svg-path");
const normalize = require("normalize-svg-path");
const abs = require("abs-svg-path");
const bezierCurve = require("adaptive-bezier-curve");
const svgpath = require("svgpath");

const builder = require("../../eeditor/tools/builder.js")

optimist.options('ad', { 'default': '', describe: 'set ad subproject name!' })

const projectDir = __dirname;
const projectJsonPath = path.join(projectDir, "project.json");
const projectJson = JSON.parse(fs.readFileSync(projectJsonPath, "utf8"));
const buildFlags = projectJson.buildFlags || {};
const playablePath = path.join(projectDir, buildFlags.SUBPROJECT || "");

const NAMES_ARR = [/* 'Animals',  *//* 'Anime' */, 'Fantasy', /* 'Mandalas' */];
const DISTEPS = 0;              // 0
const AREAEPS = 0;              // 0
const TOLERANCE = 1.5;         // 1e-4

// DEBUG: set environment variable DEBUG_SVG=1 for extra logs
const DEBUG = !!process.env.DEBUG_SVG;

function parseFillStyle(style) {
  if (!style) return null;
  const parts = style.split(";");
  for (const part of parts) {
    const [key, value] = part.split(":").map((s) => s.trim());
    if (key === "fill" && value) return value;
  }
  return null;
}

function parseColor(fill) {
  if (!fill /* || fill === "none" */) return { r: 0, g: 0, b: 0, a: 1 };

  if (/* !fill ||  */fill === "none") return { r: 0, g: 0, b: 0, a: 0 };
  fill = fill.trim();

  const hex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/i.exec(fill);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    const num = parseInt(h, 16);
    return {
      r: ((num >> 16) & 255) / 255,
      g: ((num >> 8) & 255) / 255,
      b: (num & 255) / 255,
      a: 1,
    };
  }

  const rgb = /^rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)(?:\s*,\s*([0-9.]+))?\s*\)$/i.exec(
    fill
  );
  if (rgb) {
    return {
      r: Number(rgb[1]) / 255,
      g: Number(rgb[2]) / 255,
      b: Number(rgb[3]) / 255,
      a: rgb[4] !== undefined ? Number(rgb[4]) : 1,
    };
  }

  return { r: 0, g: 0, b: 0, a: 1 };
}

function getFill(node) {
  const fillAttr = node.getAttribute("fill");
  const styleFill = parseFillStyle(node.getAttribute("style"));

  return fillAttr || styleFill || /* "#000000" */null;
}

// flatten cubic with configurable tolerance (smaller => more points)
function flattenCubic(start, c1, c2, end, tol = 0.35) {
  // adaptive-bezier-curve returns points including start and end
  return bezierCurve(start, c1, c2, end, tol);
}

function signedArea(points) {
  let a = 0;
  for (let i = 0, n = points.length; i < n; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % n];
    a += x1 * y2 - x2 * y1;
  }
  return a / 2;
}

function simplifyContour(points, distEps = /* 0.5 */0.2, areaEps = /* 0.25 */0.1) {
  return points; 
  if (!points || points.length === 0) return [];
  // remove consecutive duplicates
  const uniq = [];
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (uniq.length === 0) uniq.push([p[0], p[1]]);
    else {
      const prev = uniq[uniq.length - 1];
      const dx = p[0] - prev[0], dy = p[1] - prev[1];
      if (dx * dx + dy * dy < distEps * distEps) continue;
      uniq.push([p[0], p[1]]);
    }
  }
  if (uniq.length < 3) return uniq;

  // remove near-collinear points
  const res = [];
  for (let i = 0; i < uniq.length; i++) {
    const a = uniq[(i + uniq.length - 1) % uniq.length];
    const b = uniq[i];
    const c = uniq[(i + 1) % uniq.length];
    const area = Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1])) / 2;
    if (area <= areaEps) continue;
    res.push(b);
  }
  // if over-simplified, return uniq fallback
  return res.length >= 3 ? res : uniq;
}

// Build meshes from a single 'd' attribute.
// Returns array of { vertices: [x,y,...], indices: [...] }
function buildMeshesFromPath(d) {
  if (!d) return [];
  // robust normalization: expand arcs and shorthand before parse
  let prepared;
  try {
    prepared = svgpath(d).abs().unarc().unshort().toString();
  } catch (e) {
    // fallback to existing pipeline
    prepared = d;
  }

  // parse/abs/normalize to get canonical segments (M/C primarily)
  let pathData;
  try {
    pathData = normalize(abs(parse(prepared)));
  } catch (e) {
    if (DEBUG) console.warn("parse/normalize failed, using svgpath output parse:", e.message);
    try {
      pathData = parse(prepared);
    } catch (e2) {
      return [];
    }
  }

  const subpaths = [];
  let active = null;
  let current = null;

  for (const seg of pathData) {
    const cmd = seg[0];
    if (cmd === "M") {
      if (active && active.length) subpaths.push(active);
      active = [[seg[1], seg[2]]];
      current = active[0];
    } else if (cmd === "C") {
      if (!active) continue;
      const last = active[active.length - 1];
      const start = last.slice();
      const c1 = [seg[1], seg[2]];
      const c2 = [seg[3], seg[4]];
      const end = [seg[5], seg[6]];
      const pts = flattenCubic(start, c1, c2, end, TOLERANCE);
      if (pts && pts.length > 1) {
        // append excluding duplicate start
        for (let i = 1; i < pts.length; i++) active.push([pts[i][0], pts[i][1]]);
      } else {
        // fallback line
        active.push([end[0], end[1]]);
      }
      current = end;
    } else if (cmd === "L") {
      if (!active) continue;
      active.push([seg[1], seg[2]]);
      current = [seg[1], seg[2]];
    } else if (cmd === "Z" || cmd === "z") {
      if (active && active.length) {
        subpaths.push(active);
        active = null;
      }
      current = null;
    } else {
      // other commands should have been handled by svgpath/unarc/unshort; ignore otherwise
      continue;
    }
  }
  if (active && active.length) subpaths.push(active);

  if (subpaths.length === 0) return [];

  // sanitize all rings
  const rings = subpaths.map(r => ({ pts: simplifyContour(r, DISTEPS, AREAEPS), area: Math.abs(signedArea(r)) }))
    .filter(r => r.pts && r.pts.length >= 3);

  if (rings.length === 0) return [];

  const meshes = [];

  // When there is only one ring, produce a single polygon mesh.
  if (rings.length === 1) {
    const pts = rings[0].pts;
    const flat = [];
    for (const p of pts) flat.push(p[0], p[1]);
    if (flat.length >= 6) {
      const idx = earcut(flat);
      if (idx && idx.length) meshes.push({ vertices: flat, indices: idx });
    }
    return meshes;
  }

  // Multiple rings: attempt to build one polygon with holes.
  // Sort rings by absolute area descending: treat largest as outer, others as holes.
  rings.sort((a, b) => b.area - a.area);

  // If the largest ring has area much smaller than second, or rings do not overlap,
  // earcut as outer+holes may produce wrong result. We keep a heuristic:
  const outer = rings[0].pts;
  const holes = [];
  const flat = [];
  for (const p of outer) flat.push(p[0], p[1]);
  let holeIndex = flat.length / 2;

  for (let i = 1; i < rings.length; i++) {
    const r = rings[i].pts;
    holes.push(holeIndex);
    for (const p of r) { flat.push(p[0], p[1]); }
    holeIndex += r.length;
  }

  if (flat.length >= 6) {
    const idx = earcut(flat, holes.length ? holes : null);
    if (idx && idx.length) {
      meshes.push({ vertices: flat, indices: idx });
      if (DEBUG) {
        console.log("Built mesh from path: rings=", rings.length, "verts=", flat.length / 2, "indices=", idx.length);
      }
      return meshes;
    }
  }

  // Fallback: triangulate each ring separately (disconnected shapes)
  for (const r of rings) {
    const pts = r.pts;
    const flat2 = [];
    for (const p of pts) flat2.push(p[0], p[1]);
    if (flat2.length < 6) continue;
    const idx2 = earcut(flat2);
    if (idx2 && idx2.length) meshes.push({ vertices: flat2, indices: idx2 });
  }

  return meshes;
}

function normalizePaths(meshes) {
  if (!meshes || meshes.length === 0) return;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const m of meshes) {
    for (let i = 0; i < m.vertices.length; i += 2) {
      const x = m.vertices[i];
      const y = m.vertices[i + 1];
      if (!isFinite(x) || !isFinite(y)) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  const width = maxX - minX;
  const height = maxY - minY;
  const maxSize = Math.max(width, height) || 1;
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const scale = 2 / maxSize;

  for (const m of meshes) {
    for (let i = 0; i < m.vertices.length; i += 2) {
      m.vertices[i] = (m.vertices[i] - centerX) * scale;
      m.vertices[i + 1] = (m.vertices[i + 1] - centerY) * scale;
    }
  }
}

function writeBinary(paths, output) {
  const chunks = [];
  const header = Buffer.alloc(4);
  header.writeUInt32LE(paths.length, 0);
  chunks.push(header);

  for (const pathItem of paths) {
    const vertexCount = pathItem.vertices.length / 2;
    const indexCount = pathItem.indices.length;

    const info = Buffer.alloc(4);
    info.writeUInt16LE(vertexCount, 0);
    info.writeUInt16LE(indexCount, 2);

    chunks.push(info);

    const vb = Buffer.alloc(vertexCount * 2 * 4);
    for (let i = 0; i < pathItem.vertices.length; i += 1) {
      const v = pathItem.vertices[i];
      vb.writeFloatLE(isFinite(v) ? v : 0, i * 4);
    }
    chunks.push(vb);

    const ib = Buffer.alloc(indexCount * 2);
    for (let i = 0; i < pathItem.indices.length; i += 1) {
      ib.writeUInt16LE(pathItem.indices[i], i * 2);
    }
    chunks.push(ib);

    const colorBytes = [
      Math.round(pathItem.color.r * 255),
      Math.round(pathItem.color.g * 255),
      Math.round(pathItem.color.b * 255),
      Math.round(pathItem.color.a * 255),
    ];
    chunks.push(Buffer.from(colorBytes));
  }

  fs.writeFileSync(output, Buffer.concat(chunks));
}

function convert(input, output) {
  const svgText = fs.readFileSync(input, "utf8");
  const doc = new DOMParser().parseFromString(svgText);
  const nodes = xpath.select("//*", doc);
  const result = [];

  let processed = 0;
  for (const node of nodes) {
    const d = node.getAttribute("d");
    if (!d) continue;

    const meshes = buildMeshesFromPath(d);
    if (!meshes.length) continue;

    const color = parseColor(getFill(node));
    for (const mesh of meshes) {

      result.push({
        id: node.getAttribute("id") || "",
        vertices: mesh.vertices,
        indices: mesh.indices,
        color,
      });
    }

    processed++;
    if (DEBUG && processed <= 30) {
      console.log(`Node ${processed}: meshes=${meshes.length}, color=${JSON.stringify(color)}`);
    }
  }

  if (result.length === 0) {
    console.warn("No meshes generated.");
    return;
  }

  normalizePaths(result);
  writeBinary(result, output);
  console.log(`Converted ${result.length} paths to ${path.relative(projectDir, output)}`);
}

NAMES_ARR.forEach(name => {
  const input = path.join(playablePath, "bg", `${name}.svg`);
  const output = path.join(playablePath, "bg", `${name}.bin`);

  convert(input, output);
})