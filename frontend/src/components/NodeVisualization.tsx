'use client';

import { useEffect, useRef, useState } from 'react';
import { AgentNode } from '@/types';

interface NodeVisualizationProps {
  nodes: AgentNode[];
  isLoading: boolean;
}

export default function NodeVisualization({ nodes, isLoading }: NodeVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current) {
        const rect = svgRef.current.parentElement?.getBoundingClientRect();
        if (rect) {
          setDimensions({
            width: rect.width - 32, // Account for padding
            height: Math.max(600, rect.height - 32)
          });
        }
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Simple layout algorithm for nodes
  const getNodePosition = (index: number, total: number) => {
    const cols = Math.ceil(Math.sqrt(total));
    const rows = Math.ceil(total / cols);
    
    const col = index % cols;
    const row = Math.floor(index / cols);
    
    const x = (dimensions.width / (cols + 1)) * (col + 1);
    const y = (dimensions.height / (rows + 1)) * (row + 1);
    
    return { x, y };
  };

  const getNodeColor = (type: string, status: string) => {
    const baseColors = {
      data_fetch: '#3B82F6', // Blue
      analysis: '#10B981',    // Emerald
      decision: '#F59E0B',    // Amber
      inference: '#8B5CF6',   // Violet
      validation: '#EF4444',  // Red
      spawn: '#06B6D4'        // Cyan
    };

    const color = baseColors[type as keyof typeof baseColors] || '#6B7280';
    
    if (status === 'error') return '#EF4444';
    if (status === 'in_progress') return '#F59E0B';
    if (status === 'pending') return '#6B7280';
    
    return color;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✓';
      case 'in_progress': return '◐';
      case 'error': return '✗';
      case 'pending': return '○';
      default: return '○';
    }
  };

  if (!nodes.length && !isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🤖</div>
          <h3 className="text-xl font-semibold text-white mb-2">Ready to Investigate</h3>
          <p className="text-gray-400">Enter a stock symbol to watch AI agents work in real-time</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">AI Agent Investigation Graph</h3>
        <div className="flex items-center space-x-4 text-sm">
          <div className="text-gray-300">Nodes: {nodes.length}</div>
          {isLoading && (
            <div className="flex items-center text-blue-400">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Investigating...
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg overflow-hidden" style={{ height: '500px' }}>
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="w-full h-full"
        >
          {/* Draw connections between nodes */}
          {nodes.map((node, index) => {
            if (!node.parent_id) return null;
            
            const parentIndex = nodes.findIndex(n => n.id === node.parent_id);
            if (parentIndex === -1) return null;
            
            const parentPos = getNodePosition(parentIndex, nodes.length);
            const nodePos = getNodePosition(index, nodes.length);
            
            return (
              <line
                key={`connection-${node.id}`}
                x1={parentPos.x}
                y1={parentPos.y}
                x2={nodePos.x}
                y2={nodePos.y}
                stroke="#4B5563"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
            );
          })}

          {/* Draw nodes */}
          {nodes.map((node, index) => {
            const pos = getNodePosition(index, nodes.length);
            const color = getNodeColor(node.type, node.status);
            
            return (
              <g key={node.id}>
                {/* Node circle */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="30"
                  fill={color}
                  stroke="#1F2937"
                  strokeWidth="3"
                  className="filter drop-shadow-lg"
                />
                
                {/* Status icon */}
                <text
                  x={pos.x}
                  y={pos.y + 5}
                  textAnchor="middle"
                  className="text-white font-bold text-lg fill-white"
                >
                  {getStatusIcon(node.status)}
                </text>
                
                {/* Node label */}
                <text
                  x={pos.x}
                  y={pos.y + 50}
                  textAnchor="middle"
                  className="text-white text-sm fill-white font-medium"
                  style={{ fontSize: '12px' }}
                >
                  {node.label.length > 15 ? `${node.label.slice(0, 15)}...` : node.label}
                </text>
                
                {/* Node type badge */}
                <rect
                  x={pos.x - 25}
                  y={pos.y - 45}
                  width="50"
                  height="16"
                  rx="8"
                  fill="#374151"
                  stroke="#4B5563"
                />
                <text
                  x={pos.x}
                  y={pos.y - 33}
                  textAnchor="middle"
                  className="text-gray-300 text-xs fill-gray-300"
                  style={{ fontSize: '10px' }}
                >
                  {node.type.replace('_', ' ').toUpperCase()}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Node details panel */}
      {nodes.length > 0 && (
        <div className="mt-4 max-h-48 overflow-y-auto">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Node Details</h4>
          <div className="space-y-2">
            {nodes.slice(-3).reverse().map((node) => (
              <div key={node.id} className="bg-gray-700 rounded p-3 text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-white">{node.label}</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    node.status === 'completed' ? 'bg-green-900 text-green-200' :
                    node.status === 'error' ? 'bg-red-900 text-red-200' :
                    node.status === 'in_progress' ? 'bg-yellow-900 text-yellow-200' :
                    'bg-gray-600 text-gray-300'
                  }`}>
                    {node.status}
                  </span>
                </div>
                <p className="text-gray-300 text-xs">{node.description}</p>
                {Object.keys(node.data).length > 0 && (
                  <div className="mt-2 text-xs text-gray-400">
                    Data: {JSON.stringify(node.data, null, 0).slice(0, 100)}...
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}