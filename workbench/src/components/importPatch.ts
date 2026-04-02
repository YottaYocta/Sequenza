import type { Patch, Shader } from "@sequenza/lib";
import type { Edge } from "@xyflow/react";

const COL_GAP = 500; // horizontal distance between nodes in the same layer
const ROW_GAP = 500; // vertical distance between layers

export type ImportedNode = {
  id: string;
  position: { x: number; y: number };
  shader: Shader;
};

/**
 *
 * source: claude
 *
 * Converts a Patch into positioned ReactFlow nodes and edges using the
 * Sugiyama layered-graph layout algorithm:
 *   1. Longest-path layer assignment
 *   2. Barycentric crossing minimization (one down + one up pass)
 *   3. Centered coordinate assignment per layer
 *
 * All shader IDs are replaced with fresh random IDs. Returns the idMap so
 * the caller can remap uniforms. Positions are relative to `center`.
 */
export function importPatchToGraph(
  patch: Patch,
  center: { x: number; y: number },
): { nodes: ImportedNode[]; edges: Edge[]; idMap: Map<string, string> } {
  const { shaders, connections } = patch;

  if (shaders.length === 0) {
    return { nodes: [], edges: [], idMap: new Map() };
  }

  // ── 1. Remap IDs ──────────────────────────────────────────────────────────
  const idMap = new Map<string, string>();
  for (const s of shaders) {
    idMap.set(s.id, `${Math.random() * 100000}`);
  }
  const ids = shaders.map((s) => s.id);

  // ── 2. Adjacency (original IDs) ───────────────────────────────────────────
  const incoming = new Map<string, string[]>(); // target → sources
  const outgoing = new Map<string, string[]>(); // source → targets
  for (const id of ids) {
    incoming.set(id, []);
    outgoing.set(id, []);
  }
  for (const conn of connections) {
    incoming.get(conn.to)?.push(conn.from);
    outgoing.get(conn.from)?.push(conn.to);
  }

  // ── 3. Topological sort (Kahn's) ──────────────────────────────────────────
  const tempDeg = new Map<string, number>(
    ids.map((id) => [id, incoming.get(id)!.length]),
  );
  const bfsQ: string[] = ids.filter((id) => tempDeg.get(id) === 0);
  const topoOrder: string[] = [];
  while (bfsQ.length > 0) {
    const id = bfsQ.shift()!;
    topoOrder.push(id);
    for (const child of outgoing.get(id)!) {
      const d = tempDeg.get(child)! - 1;
      tempDeg.set(child, d);
      if (d === 0) bfsQ.push(child);
    }
  }

  // ── 4. Layer assignment (longest-path) ────────────────────────────────────
  const layer = new Map<string, number>(ids.map((id) => [id, 0]));
  for (const id of topoOrder) {
    const parents = incoming.get(id)!;
    if (parents.length > 0) {
      layer.set(id, Math.max(...parents.map((p) => layer.get(p)! + 1)));
    }
  }

  const maxLayer = Math.max(...layer.values());

  // Group by layer; initial within-layer order follows topoOrder
  const layerGroups = new Map<number, string[]>();
  for (const id of ids) {
    const l = layer.get(id)!;
    if (!layerGroups.has(l)) layerGroups.set(l, []);
    layerGroups.get(l)!.push(id);
  }
  for (const [, g] of layerGroups) {
    g.sort((a, b) => topoOrder.indexOf(a) - topoOrder.indexOf(b));
  }

  // ── 5. Crossing minimization (barycentric, down + up pass) ────────────────
  const posOf = (id: string) => layerGroups.get(layer.get(id)!)!.indexOf(id);

  const barycenter = (id: string, neighbors: string[]): number =>
    neighbors.length
      ? neighbors.reduce((s, n) => s + posOf(n), 0) / neighbors.length
      : posOf(id);

  // Down pass: sort by average parent position
  for (let l = 1; l <= maxLayer; l++) {
    layerGroups
      .get(l)
      ?.sort(
        (a, b) =>
          barycenter(a, incoming.get(a)!) - barycenter(b, incoming.get(b)!),
      );
  }
  // Up pass: sort by average child position
  for (let l = maxLayer - 1; l >= 0; l--) {
    layerGroups
      .get(l)
      ?.sort(
        (a, b) =>
          barycenter(a, outgoing.get(a)!) - barycenter(b, outgoing.get(b)!),
      );
  }

  // ── 6. Coordinate assignment (centered per layer) ─────────────────────────
  const coord = new Map<string, { x: number; y: number }>();
  for (const [l, group] of layerGroups) {
    for (let i = 0; i < group.length; i++) {
      coord.set(group[i], {
        x: (i - (group.length - 1) / 2) * COL_GAP,
        y: l * ROW_GAP,
      });
    }
  }

  // ── 7. Build output ───────────────────────────────────────────────────────
  const nodes: ImportedNode[] = shaders.map((s) => {
    const newId = idMap.get(s.id)!;
    const { x, y } = coord.get(s.id)!;
    return {
      id: newId,
      position: { x: center.x + x, y: center.y + y },
      shader: { ...s, id: newId },
    };
  });

  const edges: Edge[] = connections.map((conn) => ({
    id: `${Math.random() * 100000}`,
    source: idMap.get(conn.from)!,
    target: idMap.get(conn.to)!,
    targetHandle: conn.input,
    type: "insert" as const,
  }));

  return { nodes, edges, idMap };
}
