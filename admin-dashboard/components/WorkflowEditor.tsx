'use client';

import { useState, useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card, Button, TextInput, Select, SelectItem, Badge } from '@tremor/react';
import { Save, Plus, Settings } from 'lucide-react';
import toast from 'react-hot-toast';

interface WorkflowNode {
  id: string;
  name: string;
  level: number;
  type: string;
  requiredRole: string;
  timeoutHours: number;
}

export function WorkflowEditor() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [workflowName, setWorkflowName] = useState('Standard Incident Workflow');
  const [nodeConfig, setNodeConfig] = useState({
    name: '',
    requiredRole: 'responder',
    timeoutHours: 24,
  });

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addNode = () => {
    const newNode: Node = {
      id: `node_${nodes.length + 1}`,
      type: 'default',
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: {
        label: `New Step ${nodes.length + 1}`,
        level: nodes.length + 1,
        requiredRole: 'responder',
      },
      style: {
        background: '#3B82F6',
        color: 'white',
        padding: '10px',
        borderRadius: '8px',
        width: '150px',
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const onNodeClick = (_: any, node: Node) => {
    setSelectedNode(node);
    setNodeConfig({
      name: node.data.label,
      requiredRole: node.data.requiredRole || 'responder',
      timeoutHours: node.data.timeoutHours || 24,
    });
    setShowConfig(true);
  };

  const updateNodeConfig = () => {
    if (selectedNode) {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === selectedNode.id
            ? {
                ...node,
                data: {
                  ...node.data,
                  label: nodeConfig.name,
                  requiredRole: nodeConfig.requiredRole,
                  timeoutHours: nodeConfig.timeoutHours,
                },
              }
            : node
        )
      );
      setShowConfig(false);
      toast.success('Workflow node updated');
    }
  };

  const saveWorkflow = async () => {
    try {
      const workflowData = {
        name: workflowName,
        nodes: nodes.map(node => ({
          id: node.id,
          name: node.data.label,
          level: node.data.level,
          type: 'assignment',
          required_role: node.data.requiredRole,
          timeout_hours: node.data.timeoutHours,
          position_x: node.position.x,
          position_y: node.position.y,
        })),
        edges: edges.map(edge => ({
          from_node_id: edge.source,
          to_node_id: edge.target,
        })),
      };
      
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/workflow/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(workflowData),
      });
      
      if (res.ok) {
        toast.success('Workflow saved successfully');
      } else {
        toast.error('Failed to save workflow');
      }
    } catch (error) {
      toast.error('Network error');
    }
  };

  const loadDefaultWorkflow = () => {
    const defaultNodes: Node[] = [
      {
        id: '1',
        type: 'default',
        position: { x: 100, y: 100 },
        data: { label: 'Reported', level: 1, requiredRole: 'resident' },
        style: { background: '#10B981', color: 'white', padding: '10px', borderRadius: '8px', width: '150px' },
      },
      {
        id: '2',
        type: 'default',
        position: { x: 400, y: 100 },
        data: { label: 'Assigned to Staff', level: 2, requiredRole: 'responder', timeoutHours: 1 },
        style: { background: '#3B82F6', color: 'white', padding: '10px', borderRadius: '8px', width: '150px' },
      },
      {
        id: '3',
        type: 'default',
        position: { x: 700, y: 100 },
        data: { label: 'Supervisor Review', level: 3, requiredRole: 'supervisor', timeoutHours: 2 },
        style: { background: '#F59E0B', color: 'white', padding: '10px', borderRadius: '8px', width: '150px' },
      },
      {
        id: '4',
        type: 'default',
        position: { x: 1000, y: 100 },
        data: { label: 'HOD Review', level: 4, requiredRole: 'hod', timeoutHours: 4 },
        style: { background: '#EF4444', color: 'white', padding: '10px', borderRadius: '8px', width: '150px' },
      },
      {
        id: '5',
        type: 'default',
        position: { x: 1300, y: 100 },
        data: { label: 'Resolved', level: 5, requiredRole: 'none', timeoutHours: 0 },
        style: { background: '#6B7280', color: 'white', padding: '10px', borderRadius: '8px', width: '150px' },
      },
    ];
    
    const defaultEdges: Edge[] = [
      { id: 'e1-2', source: '1', target: '2', type: 'smoothstep' },
      { id: 'e2-3', source: '2', target: '3', type: 'smoothstep' },
      { id: 'e3-4', source: '3', target: '4', type: 'smoothstep' },
      { id: 'e4-5', source: '4', target: '5', type: 'smoothstep' },
    ];
    
    setNodes(defaultNodes);
    setEdges(defaultEdges);
    toast.success('Default workflow loaded');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">Workflow Designer</h2>
          <TextInput
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            placeholder="Workflow Name"
            className="w-64"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={loadDefaultWorkflow}>
            Load Default
          </Button>
          <Button icon={Plus} onClick={addNode}>
            Add Step
          </Button>
          <Button icon={Save} onClick={saveWorkflow}>
            Save Workflow
          </Button>
        </div>
      </div>

      <Card>
        <div style={{ height: '600px' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>
      </Card>

      {/* Node Configuration Modal */}
      {showConfig && selectedNode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Configure Workflow Step</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Step Name</label>
                <TextInput
                  value={nodeConfig.name}
                  onChange={(e) => setNodeConfig({ ...nodeConfig, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Required Role</label>
                <Select
                  value={nodeConfig.requiredRole}
                  onValueChange={(value) => setNodeConfig({ ...nodeConfig, requiredRole: value })}
                >
                  <SelectItem value="responder">Responder/Staff</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="hod">Head of Department</SelectItem>
                  <SelectItem value="dept_director">Department Director</SelectItem>
                  <SelectItem value="overall_manager">Overall Manager</SelectItem>
                  <SelectItem value="overall_director">Overall Director</SelectItem>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Timeout (hours)</label>
                {/* <TextInput
                  type="number"
                  value={nodeConfig.timeoutHours}
                  onChange={(e) => setNodeConfig({ ...nodeConfig, timeoutHours: parseInt(e.target.value) })}
                /> */}
                <TextInput
                  type="number"
                  value={String(nodeConfig.timeoutHours)}
                  onChange={(e) =>
                    setNodeConfig({
                      ...nodeConfig,
                      timeoutHours: parseInt(e.target.value) || 0,
                    })
                  }
                />
                <p className="text-xs text-gray-500 mt-1">Hours before auto-escalation to next step</p>
              </div>
              <div className="flex gap-2 justify-end mt-6">
                <Button variant="secondary" onClick={() => setShowConfig(false)}>
                  Cancel
                </Button>
                <Button onClick={updateNodeConfig}>
                  Update Step
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
