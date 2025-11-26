export type EndpointType = "start" | "end";

export type EndpointPosition = {
  nodeIdx: number;
  type: EndpointType;
  x: number;
  y: number;
};

// Global state - just a vanilla object
export let endpointPositions: EndpointPosition[] = [];

export function updateEndpoint(
  nodeIdx: number,
  type: EndpointType,
  x: number,
  y: number
) {
  const existing = endpointPositions.findIndex(
    (ep) => ep.nodeIdx === nodeIdx && ep.type === type
  );

  if (existing >= 0) {
    endpointPositions[existing] = { nodeIdx, type, x, y };
  } else {
    endpointPositions.push({ nodeIdx, type, x, y });
  }
}

export function getEndpoint(
  nodeIdx: number,
  type: EndpointType
): EndpointPosition | undefined {
  return endpointPositions.find(
    (ep) => ep.nodeIdx === nodeIdx && ep.type === type
  );
}

export function clearEndpoint(nodeIdx: number, type: EndpointType) {
  endpointPositions = endpointPositions.filter(
    (ep) => !(ep.nodeIdx === nodeIdx && ep.type === type)
  );
}
