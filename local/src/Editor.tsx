import { useCallback, useMemo, useRef, useState, type FC } from 'react';
import type { Connection, Patch, Shader, Uniforms } from './renderer';
import {
	addEdge,
	applyEdgeChanges,
	applyNodeChanges,
	Background,
	Controls,
	Panel,
	ReactFlow,
	type Edge,
	type Node,
	type OnConnect,
	type OnEdgesChange,
	type OnNodesChange
} from '@xyflow/react';
import { ShaderNode } from './ShaderNode';
import { EditorContext } from './EditorContext';

interface EditorProps {
	shaders: Shader[];
}

export const Editor: FC<EditorProps> = ({ shaders }) => {
	const [nodes, setNodes] = useState<Node[]>([]);

	const [edges, setEdges] = useState<Edge[]>([]);

	const onNodesChange: OnNodesChange = useCallback(
		(changes) => setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
		[setNodes]
	);
	const onEdgesChange: OnEdgesChange = useCallback(
		(changes) => setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
		[setEdges]
	);

	const onConnect: OnConnect = useCallback((params) => {
		setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot));
	}, []);

	const uniformRef = useRef<Record<string, Uniforms>>({});

	const handleAddShader = (shader: Shader) => {
		const newId = `${Math.random() * 100000}`;
		const newShader: Shader = { ...shader, id: newId };
		const shaderNode: ShaderNode = {
			id: newId,
			position: { x: 0, y: 0 },
			data: {
				shader: newShader,
				uniforms: uniformRef,
				handleUpdateUnforms: (newUniforms) => {
					uniformRef.current[newId] = newUniforms;
				}
			},
			type: 'shader'
		};

		setNodes((snapshot) => [...snapshot, shaderNode]);
	};

	/**
	 * patches[i] gives the patch for shader node with id [i]
	 */
	const patches = useMemo<Record<string, Patch>>(() => {
		// maps target -> incoming connection
		const edgeMap: Record<string, Connection[]> = {};

		// maps nodeId -> shader
		const shaderMap: Record<string, Shader> = {};

		// maps shader id to patch for that shader
		const patches: Record<string, Patch> = {};

		for (const node of nodes) {
			edgeMap[node.id] = [];
			if (node.type === 'shader') {
				const shaderNode = node as ShaderNode;
				shaderMap[shaderNode.id] = shaderNode.data.shader;
			}
		}

		for (const edge of edges) {
			edgeMap[edge.target].push({
				from: edge.source,
				to: edge.target,
				input: edge.targetHandle ?? ''
			});
		}

		for (const node of nodes) {
			if (node.type === 'shader') {
				const shaderNode = node as ShaderNode;
				patches[shaderNode.id] = { shaders: [shaderMap[shaderNode.id]], connections: [] };

				const queue: string[] = [shaderNode.data.shader.id]; // nodes to traverse

				while (queue.length !== 0) {
					const dependentNodeId = queue.shift()!;
					for (const incomingConnection of edgeMap[dependentNodeId]) {
						const dependencyNodeId = incomingConnection.from;
						queue.push(dependencyNodeId);
						const dependencyShader = shaderMap[dependencyNodeId];
						patches[shaderNode.id].shaders.push(dependencyShader);
						patches[shaderNode.id].connections.push(incomingConnection);
					}
				}
			}
		}
		return patches;
	}, [nodes.length, edges.length, shaders]);

	return (
		<div className="w-full h-full">
			<EditorContext.Provider
				value={{
					patches,
					uniforms: uniformRef
				}}
			>
				<ReactFlow
					panOnScroll={true}
					proOptions={{ hideAttribution: true }}
					nodes={nodes}
					nodeTypes={{ shader: ShaderNode }}
					edges={edges}
					onNodesChange={onNodesChange}
					onEdgesChange={onEdgesChange}
					onConnect={onConnect}
					fitView
				>
					<Panel position="top-left" className="flex flex-col gap-4">
						<div className="flex flex-col gap-2">
							{nodes.map((node) => (
								<p className="text-xs" key={node.id}>
									{node.id}
								</p>
							))}
						</div>
						<div className="flex flex-col gap-2">
							{edges.map((edge) => (
								<p className="text-xs" key={edge.id}>
									{edge.source} {'>'} {edge.target} {edge.targetHandle}
								</p>
							))}
						</div>
					</Panel>
					<Panel position="top-right">
						<div className="bg-white p-4 flex flex-col border rounded-sm border-neutral-200 gap-4">
							<p className="text-sm">Add Shader</p>
							<div className="flex flex-col gap-1">
								{shaders.map((shader) => (
									<button
										key={shader.id}
										className="text-xs flex justify-start p-1 border border-neutral-200 rounded-sm hover:bg-neutral-100 cursor-pointer"
										onClick={() => {
											handleAddShader(shader);
										}}
									>
										{shader.id}
									</button>
								))}
							</div>
						</div>
					</Panel>
					<Background />
					<Controls />
				</ReactFlow>
			</EditorContext.Provider>
		</div>
	);
};
