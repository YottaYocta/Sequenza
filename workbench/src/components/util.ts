import type { Edge, Node } from "@xyflow/react";

/**
 * traverses nodes in topological order (sources first, sinks last),
 * calling `fn` on each node. The callback receives the current node and
 * a map of all nodes (already updated for previously visited nodes),
 * and returns a replacement node.
 *
 * note that modifying the map is undefined behavior. don't modify the map
 *
 * when `startId` is provided, only the subgraph reachable from that
 * node (following edge direction) is traversed; unreachable nodes are
 * returned unchanged.
 */
export function topologicalMap(
  nodes: Node[],
  edges: Edge[],
  fn: (node: Node, nodeMap: Map<string, Node>) => Node,
  startId?: string,
): Node[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const adjacency = new Map<string, string[]>();

  for (const node of nodes) {
    adjacency.set(node.id, []);
  }
  for (const edge of edges) {
    adjacency.get(edge.source)?.push(edge.target);
  }

  let reachable: Set<string> | null = null;
  if (startId !== undefined) {
    reachable = new Set<string>();
    const queue = [startId];
    while (queue.length > 0) {
      const id = queue.shift()!;
      if (reachable.has(id)) continue;
      reachable.add(id);
      for (const neighbor of adjacency.get(id) ?? []) {
        queue.push(neighbor);
      }
    }
  }

  // kahn's algo, courtesy of chat
  const inDegree = new Map<string, number>();
  for (const node of nodes) {
    if (reachable && !reachable.has(node.id)) continue;
    inDegree.set(node.id, 0);
  }
  for (const edge of edges) {
    if (reachable && !reachable.has(edge.target)) continue;
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
  }

  const queue: string[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }

  while (queue.length > 0) {
    const id = queue.shift()!;
    const node = nodeMap.get(id);
    if (node) {
      nodeMap.set(id, fn(node, nodeMap));
    }
    for (const neighbor of adjacency.get(id) ?? []) {
      if (reachable && !reachable.has(neighbor)) continue;
      const newDeg = (inDegree.get(neighbor) ?? 1) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) queue.push(neighbor);
    }
  }

  return [...nodeMap.values()];
}
