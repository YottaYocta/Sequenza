import { useCallback, useState, type FC, type RefObject } from 'react';
import type { Patch, Shader, Uniforms } from './renderer';
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

interface EditorProps {
	shaders: Shader[];
}

export const Editor: FC<EditorProps> = ({ shaders }) => {
	const [nodes, setNodes] = useState<Node[]>([
		{
			id: 'n1',
			position: { x: 0, y: 0 },
			data: { label: 'Node 1' },
			type: 'input'
		},
		{
			id: 'n2',
			position: { x: 100, y: 100 },
			data: { label: 'Node 2' }
		}
	]);

	const [edges, setEdges] = useState<Edge[]>([
		{
			id: 'fjslkfkjsajflaj',
			source: 'n1',
			target: 'n2',
			label: 'edge'
		}
	]);

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

	return (
		<div className="w-full h-full">
			<ReactFlow
				proOptions={{ hideAttribution: true }}
				nodes={nodes}
				edges={edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onConnect={onConnect}
				fitView
			>
				<Panel position="center-right">
					<div className="bg-white p-4 flex flex-col border rounded-sm border-neutral-200 gap-4">
						<p className="text-sm">Add Shader</p>
						<div className="flex flex-col gap-1">
							{shaders.map((shader) => (
								<button
									key={shader.id}
									className="text-xs flex justify-start p-1 border border-neutral-200 rounded-sm hover:bg-neutral-100 cursor-pointer"
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
		</div>
	);
};
