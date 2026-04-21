import type { Patch, Shader } from "../renderer";

export function topologicalSort(patch: Patch): Shader[] {
  const ids = patch.shaders.map((s) => s.id);
  const inDegree = new Map<string, number>(ids.map((id) => [id, 0]));

  for (const conn of patch.connections) {
    inDegree.set(conn.to, (inDegree.get(conn.to) ?? 0) + 1);
  }

  const queue = ids.filter((id) => inDegree.get(id) === 0);
  const sorted: Shader[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const shader = patch.shaders.find((s) => s.id === current)!;
    sorted.push(shader);

    for (const conn of patch.connections) {
      if (conn.from === current) {
        const newDeg = (inDegree.get(conn.to) ?? 1) - 1;
        inDegree.set(conn.to, newDeg);
        if (newDeg === 0) queue.push(conn.to);
      }
    }
  }

  return sorted;
}
