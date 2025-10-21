'use client';

import { useEffect, useRef, useState } from 'react';
import { AgentNode } from '@/types';

interface AgentAction {
  type: string;
  action_type: string;
  label: string;
  description: string;
  symbol: string;
  investigation_id: string;
  timestamp: string;
  data: any;
}

interface NodeVisualizationProps {
  nodes: AgentNode[];
  agentActions: AgentAction[];
  isLoading: boolean;
}

interface VisualNode {
  id: string;
  type: 'api_call' | 'decision' | 'analysis' | 'inference' | 'cross_validation' | 'data_fetch';
  label: string;
  description: string;
  x: number;
  y: number;
  width: number;
  height: number;
  data: any;
  parentId?: string;
  isInference?: boolean;
  isExpanded?: boolean;
}

interface Edge {
  id: string;
  source: string;
  target: string;
  type: 'normal' | 'cross_validation' | 'inference';
}

export default function RealTimeAgentVisualization({ nodes, agentActions, isLoading }: NodeVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1400, height: 1000 });
  const [viewState, setViewState] = useState({ scale: 0.8, translateX: 100, translateY: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [visualNodes, setVisualNodes] = useState<VisualNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Node styling based on type
  const getNodeStyle = (type: string, isInference = false) => {
    const baseStyle = {
      stroke: '#e2e8f0',
      strokeWidth: 2,
      rx: 8,
      filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
    };

    switch (type) {
      case 'api_call':
        return {
          ...baseStyle,
          fill: '#dbeafe', // Blue
          stroke: '#3b82f6',
          icon: '🌐'
        };
      case 'decision':
        return {
          ...baseStyle,
          fill: '#fef3c7', // Yellow
          stroke: '#f59e0b',
          icon: '🧠'
        };
      case 'analysis':
        return {
          ...baseStyle,
          fill: '#d1fae5', // Green
          stroke: '#10b981',
          icon: 'DATA'
        };
      case 'cross_validation':
        return {
          ...baseStyle,
          fill: '#e0e7ff', // Indigo
          stroke: '#6366f1',
          icon: '🔗'
        };
      case 'inference':
        return {
          ...baseStyle,
          fill: isInference ? '#fce7f3' : '#f3e8ff', // Pink for final inference, purple for others
          stroke: isInference ? '#ec4899' : '#8b5cf6',
          strokeWidth: isInference ? 3 : 2,
          icon: isInference ? 'TARGET' : 'IDEA'
        };
      default:
        return {
          ...baseStyle,
          fill: '#f1f5f9',
          stroke: '#64748b',
          icon: '📄'
        };
    }
  };

  // Convert agent actions and nodes to visual representation
  useEffect(() => {
    const newVisualNodes: VisualNode[] = [];
    const newEdges: Edge[] = [];
    let nodeIndex = 0;

    // First, add agent actions as nodes (these show the thinking process)
    agentActions.forEach((action, index) => {
      const visualNode: VisualNode = {
        id: `action_${index}`,
        type: action.action_type as any,
        label: action.label,
        description: action.description,
        x: 50 + (index % 6) * 220,
        y: 50 + Math.floor(index / 6) * 120,
        width: 200,
        height: 80,
        data: action.data
      };
      newVisualNodes.push(visualNode);
      nodeIndex++;
    });

    // Then add actual investigation nodes (these are the results)
    nodes.forEach((node, index) => {
      const isLargeInference = node.type === 'inference' && (
        node.label.includes('Master Inference') || 
        node.label.includes('Comprehensive') ||
        (node.data as any)?.executive_summary
      );

      const visualNode: VisualNode = {
        id: node.id,
        type: node.type === 'inference' ? 'inference' : 
              node.type === 'analysis' ? 'analysis' : 'data_fetch',
        label: node.label,
        description: node.description,
        x: 50 + (nodeIndex % 5) * 260,
        y: 200 + Math.floor(nodeIndex / 5) * 150,
        width: isLargeInference ? 400 : 240,
        height: isLargeInference ? 200 : 100,
        data: node.data,
        parentId: node.parent_id,
        isInference: isLargeInference,
        isExpanded: expandedNodes.has(node.id)
      };
      
      newVisualNodes.push(visualNode);
      
      // Create edges for parent-child relationships
      if (node.parent_id) {
        newEdges.push({
          id: `edge_${node.parent_id}_${node.id}`,
          source: node.parent_id,
          target: node.id,
          type: 'normal'
        });
      }

      nodeIndex++;
    });

    // Add cross-validation edges (when nodes reference multiple sources)
    nodes.forEach(node => {
      const nodeData = node.data as any;
      if (nodeData?.parent_nodes && Array.isArray(nodeData.parent_nodes)) {
        nodeData.parent_nodes.forEach((parentId: string) => {
          if (parentId !== node.parent_id) {
            newEdges.push({
              id: `cross_${parentId}_${node.id}`,
              source: parentId,
              target: node.id,
              type: 'cross_validation'
            });
          }
        });
      }
    });

    setVisualNodes(newVisualNodes);
    setEdges(newEdges);
  }, [nodes, agentActions, expandedNodes]);

  // Pan and zoom handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as Element).closest('.node-content')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - viewState.translateX, y: e.clientY - viewState.translateY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setViewState(prev => ({
      ...prev,
      translateX: e.clientX - dragStart.x,
      translateY: e.clientY - dragStart.y
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setViewState(prev => ({
      ...prev,
      scale: Math.max(0.2, Math.min(2, prev.scale * scaleFactor))
    }));
  };

  const handleNodeClick = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const resetView = () => {
    setViewState({ scale: 0.8, translateX: 100, translateY: 50 });
  };

  // Get text content for node based on type and expansion state
  const getNodeContent = (node: VisualNode) => {
    if (node.isInference && node.isExpanded && (node.data as any)?.executive_summary) {
      return (node.data as any).executive_summary;
    }
    return node.description;
  };

  return (
    <div className="relative w-full h-full bg-gray-50 overflow-hidden">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button
          onClick={resetView}
          className="px-3 py-2 bg-white rounded-lg shadow text-sm hover:bg-gray-50"
        >
          Reset View
        </button>
        <div className="px-3 py-2 bg-white rounded-lg shadow text-sm">
          Zoom: {Math.round(viewState.scale * 100)}%
        </div>
      </div>

      {/* Legend */}
      <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow p-4 max-w-xs">
        <h3 className="font-semibold mb-2">AI Agent Actions</h3>
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#dbeafe' }}></div>
            <span>🌐 API Calls</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#fef3c7' }}></div>
            <span>🧠 AI Decisions</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#d1fae5' }}></div>
            <span>Analysis</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#e0e7ff' }}></div>
            <span>🔗 Cross-Validation</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#fce7f3' }}></div>
            <span>Final Inference</span>
          </div>
        </div>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute bottom-4 right-4 z-10 bg-blue-500 text-white px-4 py-2 rounded-lg shadow animate-pulse">
          AI Agent Investigating...
        </div>
      )}

      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="3" floodOpacity="0.1"/>
          </filter>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                  refX="10" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
          </marker>
          <marker id="cross-arrowhead" markerWidth="10" markerHeight="7" 
                  refX="10" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" />
          </marker>
        </defs>
        
        <g transform={`translate(${viewState.translateX}, ${viewState.translateY}) scale(${viewState.scale})`}>
          {/* Render edges first */}
          {edges.map(edge => {
            const sourceNode = visualNodes.find(n => n.id === edge.source);
            const targetNode = visualNodes.find(n => n.id === edge.target);
            
            if (!sourceNode || !targetNode) return null;
            
            const startX = sourceNode.x + sourceNode.width / 2;
            const startY = sourceNode.y + sourceNode.height;
            const endX = targetNode.x + targetNode.width / 2;
            const endY = targetNode.y;
            
            const isCrossValidation = edge.type === 'cross_validation';
            
            return (
              <g key={edge.id}>
                <line
                  x1={startX}
                  y1={startY}
                  x2={endX}
                  y2={endY}
                  stroke={isCrossValidation ? "#6366f1" : "#64748b"}
                  strokeWidth={isCrossValidation ? 3 : 2}
                  strokeDasharray={isCrossValidation ? "5,5" : "none"}
                  markerEnd={isCrossValidation ? "url(#cross-arrowhead)" : "url(#arrowhead)"}
                />
              </g>
            );
          })}
          
          {/* Render nodes */}
          {visualNodes.map(node => {
            const style = getNodeStyle(node.type, node.isInference);
            const content = getNodeContent(node);
            const isExpanded = node.isExpanded;
            
            return (
              <g key={node.id} className="node-content">
                {/* Node background */}
                <rect
                  x={node.x}
                  y={node.y}
                  width={node.width}
                  height={isExpanded ? Math.max(node.height, 300) : node.height}
                  fill={style.fill}
                  stroke={style.stroke}
                  strokeWidth={style.strokeWidth}
                  rx={style.rx}
                  filter="url(#shadow)"
                  className="cursor-pointer hover:opacity-80"
                  onClick={() => handleNodeClick(node.id)}
                />
                
                {/* Node icon */}
                <text
                  x={node.x + 15}
                  y={node.y + 25}
                  fontSize="20"
                  textAnchor="start"
                >
                  {style.icon}
                </text>
                
                {/* Node title */}
                <text
                  x={node.x + 45}
                  y={node.y + 25}
                  fontSize="14"
                  fontWeight="600"
                  fill="#1f2937"
                  textAnchor="start"
                >
                  {node.label.length > 25 ? node.label.substring(0, 22) + '...' : node.label}
                </text>
                
                {/* Node content */}
                <foreignObject
                  x={node.x + 10}
                  y={node.y + 35}
                  width={node.width - 20}
                  height={isExpanded ? 250 : node.height - 45}
                >
                  <div className="text-xs text-gray-600 p-2 overflow-hidden">
                    {isExpanded ? (
                      <div className="whitespace-pre-wrap max-h-60 overflow-y-auto">
                        {content}
                      </div>
                    ) : (
                      <div className="line-clamp-3">
                        {content.length > 100 ? content.substring(0, 97) + '...' : content}
                      </div>
                    )}
                    {node.isInference && (
                      <div className="mt-2 text-blue-600 font-medium">
                        Click to {isExpanded ? 'collapse' : 'expand'}
                      </div>
                    )}
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}