'use client';

import { useEffect, useRef, useState } from 'react';
import { AgentNode } from '@/types';

interface NodeVisualizationProps {
  nodes: AgentNode[];
  isLoading: boolean;
}

export default function NodeVisualizationBranched({ nodes, isLoading }: NodeVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });
  const [viewState, setViewState] = useState({ scale: 1, translateX: 0, translateY: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current?.parentElement) {
        const rect = svgRef.current.parentElement.getBoundingClientRect();
        setDimensions({
          width: Math.max(1200, rect.width - 32),
          height: Math.max(800, rect.height - 32)
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Pan and zoom handlers
  const handleMouseDown = (e: React.MouseEvent) => {
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
    const scaleChange = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(3, viewState.scale * scaleChange));
    
    setViewState(prev => ({
      ...prev,
      scale: newScale
    }));
  };

  const resetView = () => {
    setViewState({ scale: 1, translateX: 0, translateY: 0 });
  };

  const zoomIn = () => {
    setViewState(prev => ({
      ...prev,
      scale: Math.min(3, prev.scale * 1.2)
    }));
  };

  const zoomOut = () => {
    setViewState(prev => ({
      ...prev,
      scale: Math.max(0.1, prev.scale * 0.8)
    }));
  };

  const getNodeColor = (type: string, status: string) => {
    const colors = {
      data_fetch: '#3B82F6',    // Blue
      analysis: '#10B981',      // Emerald  
      decision: '#F59E0B',      // Amber
      inference: '#8B5CF6',     // Violet
      validation: '#EF4444',    // Red
      spawn: '#06B6D4'          // Cyan
    };
    
    const baseColor = colors[type as keyof typeof colors] || '#6B7280';
    
    if (status === 'error') return '#EF4444';
    if (status === 'in_progress') return '#F59E0B'; 
    if (status === 'pending') return '#6B7280';
    
    return baseColor;
  };

  const getNodeIcon = (type: string) => {
    const icons = {
      data_fetch: 'DATA',
      analysis: 'ANALYZE',
      decision: 'DECIDE', 
      inference: 'INFER',
      validation: 'VALIDATE',
      spawn: 'SPAWN'
    };
    return icons[type as keyof typeof icons] || 'NODE';
  };

  // Advanced layout algorithm for branched investigation flow
  const calculateNodePositions = () => {
    if (nodes.length === 0) return [];

    const positions: Array<{node: AgentNode, x: number, y: number, level: number, branch: number}> = [];
    const nodeWidth = 280; // Increased for more content
    const nodeHeight = 120; // Increased for more content
    const levelSpacing = 320;
    const branchSpacing = 140;

    // Group nodes by investigation flow
    const mainFlow: AgentNode[] = [];
    const newsBranch: AgentNode[] = [];
    const financialBranch: AgentNode[] = [];
    const marketBranch: AgentNode[] = [];
    const validationNodes: AgentNode[] = [];
    const finalNodes: AgentNode[] = [];

    nodes.forEach(node => {
      if (node.label.includes('Price Data') || node.label.includes('Agent Decision')) {
        mainFlow.push(node);
      } else if (node.label.includes('News') || node.label.includes('Headlines')) {
        newsBranch.push(node);
      } else if (node.label.includes('Earnings') || node.label.includes('Financial')) {
        financialBranch.push(node);
      } else if (node.label.includes('Market') || node.label.includes('Sector')) {
        marketBranch.push(node);
      } else if (node.type === 'validation') {
        validationNodes.push(node);
      } else if (node.label.includes('Master') || node.label.includes('Final Analysis')) {
        finalNodes.push(node);
      }
    });

    let currentLevel = 0;

    // Position main flow nodes horizontally
    mainFlow.forEach((node, index) => {
      positions.push({
        node,
        x: 100 + (index * levelSpacing),
        y: dimensions.height / 2,
        level: index,
        branch: 0
      });
      currentLevel = Math.max(currentLevel, index + 1);
    });

    // Position branch nodes
    const branches = [
      { nodes: newsBranch, yOffset: -200, name: 'news' },
      { nodes: financialBranch, yOffset: 0, name: 'financial' }, 
      { nodes: marketBranch, yOffset: 200, name: 'market' }
    ];

    branches.forEach((branch, branchIndex) => {
      branch.nodes.forEach((node, nodeIndex) => {
        positions.push({
          node,
          x: 100 + (currentLevel + nodeIndex) * levelSpacing,
          y: (dimensions.height / 2) + branch.yOffset + (nodeIndex * 40),
          level: currentLevel + nodeIndex,
          branch: branchIndex + 1
        });
      });
    });

    // Position validation nodes
    const validationLevel = currentLevel + Math.max(2, ...branches.map(b => b.nodes.length));
    validationNodes.forEach((node, index) => {
      positions.push({
        node,
        x: 100 + validationLevel * levelSpacing,
        y: dimensions.height / 2 + (index * branchSpacing),
        level: validationLevel,
        branch: 0
      });
    });

    // Position final nodes
    finalNodes.forEach((node, index) => {
      positions.push({
        node,
        x: 100 + (validationLevel + 1) * levelSpacing,
        y: dimensions.height / 2,
        level: validationLevel + 1,
        branch: 0
      });
    });

    return positions;
  };

  const nodePositions = calculateNodePositions();

  // Calculate connections between nodes
  const getConnections = () => {
    const connections: Array<{from: {x: number, y: number}, to: {x: number, y: number}, type: string}> = [];
    
    nodePositions.forEach(nodePos => {
      if (nodePos.node.parent_id) {
        const parentPos = nodePositions.find(p => p.node.id === nodePos.node.parent_id);
        if (parentPos) {
          connections.push({
            from: {x: parentPos.x, y: parentPos.y},
            to: {x: nodePos.x, y: nodePos.y},
            type: 'parent'
          });
        }
      }
      
      // Add connections to children
      if (nodePos.node.children_ids && nodePos.node.children_ids.length > 0) {
        nodePos.node.children_ids.forEach(childId => {
          const childPos = nodePositions.find(p => p.node.id === childId);
          if (childPos) {
            connections.push({
              from: {x: nodePos.x, y: nodePos.y},
              to: {x: childPos.x, y: childPos.y},
              type: 'validation'
            });
          }
        });
      }
    });

    return connections;
  };

  const connections = getConnections();

  if (!nodes.length && !isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🤖</div>
          <h3 className="text-xl font-semibold text-white mb-2">Ready for Complex Investigation</h3>
          <p className="text-gray-400">Watch AI agents create branched investigation workflows</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          Branched AI Investigation Flow
        </h3>
        <div className="flex items-center space-x-4">
          {/* Zoom Controls */}
          <div className="flex items-center space-x-2 bg-gray-700 rounded px-3 py-1">
            <button
              onClick={zoomOut}
              className="text-gray-300 hover:text-white text-sm px-2 py-1 rounded hover:bg-gray-600"
              title="Zoom Out"
            >
              −
            </button>
            <span className="text-gray-300 text-xs min-w-[3rem] text-center">
              {Math.round(viewState.scale * 100)}%
            </span>
            <button
              onClick={zoomIn}
              className="text-gray-300 hover:text-white text-sm px-2 py-1 rounded hover:bg-gray-600"
              title="Zoom In"
            >
              +
            </button>
            <button
              onClick={resetView}
              className="text-gray-300 hover:text-white text-xs px-2 py-1 rounded hover:bg-gray-600 ml-2"
              title="Reset View"
            >
              Reset
            </button>
          </div>
          
          <div className="text-gray-300 text-sm">Nodes: <span className="text-blue-400 font-bold">{nodes.length}</span></div>
          <div className="text-gray-300 text-sm">Branches: <span className="text-emerald-400 font-bold">3</span></div>
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

      <div 
        ref={containerRef}
        className="bg-gray-900 rounded-lg overflow-hidden cursor-move" 
        style={{ height: '700px', width: '100%' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="w-full h-full"
        >
          {/* Define gradients and patterns */}
          <defs>
            <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.6"/>
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.8"/>
            </linearGradient>
            <linearGradient id="validationGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#EF4444" stopOpacity="0.6"/>
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.8"/>
            </linearGradient>
          </defs>

          {/* Main group with pan/zoom transform */}
          <g transform={`translate(${viewState.translateX},${viewState.translateY}) scale(${viewState.scale})`}>
            {/* Draw connections */}
          {connections.map((conn, index) => (
            <g key={index}>
              <path
                d={`M ${conn.from.x + 80} ${conn.from.y} 
                   Q ${conn.from.x + 120} ${conn.from.y} ${conn.to.x - 80} ${conn.to.y}`}
                fill="none"
                stroke={conn.type === 'validation' ? 'url(#validationGradient)' : 'url(#connectionGradient)'}
                strokeWidth="2"
                strokeDasharray={conn.type === 'validation' ? '5,5' : '0'}
                markerEnd="url(#arrowhead)"
              />
            </g>
          ))}

          {/* Arrow marker */}
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" 
             refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#8B5CF6" />
            </marker>
          </defs>

          {/* Draw nodes */}
          {nodePositions.map((nodePos, index) => {
            const color = getNodeColor(nodePos.node.type, nodePos.node.status);
            
            return (
              <g key={nodePos.node.id} 
                 style={{
                   animation: `fadeInNode 0.6s ease-out ${index * 0.2}s both`
                 }}>
                
                {/* Node background */}
                <rect
                  x={nodePos.x - 140}
                  y={nodePos.y - 60}
                  width="280"
                  height="120"
                  rx="8"
                  fill={color}
                  fillOpacity="0.9"
                  stroke="#1F2937"
                  strokeWidth="2"
                  className="filter drop-shadow-lg"
                />
                
                {/* Node content background */}
                <rect
                  x={nodePos.x - 135}
                  y={nodePos.y - 55}
                  width="270"
                  height="110"
                  rx="6"
                  fill="#1F2937"
                  fillOpacity="0.8"
                />
                
                {/* Node type badge */}
                <rect
                  x={nodePos.x - 130}
                  y={nodePos.y - 50}
                  width="60"
                  height="16"
                  rx="8"
                  fill="#374151"
                  stroke="#4B5563"
                />
                <text
                  x={nodePos.x - 100}
                  y={nodePos.y - 40}
                  className="text-xs font-mono"
                  textAnchor="middle"
                  fill="#D1D5DB"
                >
                  {getNodeIcon(nodePos.node.type)}
                </text>
                
                {/* Node title */}
                <text
                  x={nodePos.x - 125}
                  y={nodePos.y - 20}
                  className="text-white text-sm font-medium"
                  textAnchor="start"
                  fill="white"
                >
                  {nodePos.node.label.length > 35 
                    ? `${nodePos.node.label.slice(0, 35)}...` 
                    : nodePos.node.label
                  }
                </text>
                
                {/* Node description */}
                <foreignObject
                  x={nodePos.x - 125}
                  y={nodePos.y - 5}
                  width="250"
                  height="40"
                >
                  <div className="text-xs text-gray-300 leading-tight">
                    {nodePos.node.description.length > 80
                      ? `${nodePos.node.description.slice(0, 80)}...`
                      : nodePos.node.description
                    }
                  </div>
                </foreignObject>
                
                {/* Key thinking output */}
                <foreignObject
                  x={nodePos.x - 125}
                  y={nodePos.y + 25}
                  width="250"
                  height="25"
                >
                  <div className="text-xs text-blue-200 bg-gray-800 rounded px-2 py-1 max-w-xs">
                    {nodePos.node.data && Object.keys(nodePos.node.data).length > 0 && (
                      <div className="space-y-1">
                        {nodePos.node.type === 'inference' && nodePos.node.data && 'primary_cause' in nodePos.node.data ? (
                          // Special handling for master inference nodes
                          <div>
                            <div className="font-semibold text-yellow-300">
                              WHY: {String(nodePos.node.data.primary_cause)}
                            </div>
                            <div className="text-xs text-gray-300">
                              Confidence: {Math.round((Number(nodePos.node.data.cause_confidence) || 0.7) * 100)}%
                            </div>
                            {nodePos.node.data.detailed_reasoning && Array.isArray(nodePos.node.data.detailed_reasoning) && nodePos.node.data.detailed_reasoning.length > 0 && (
                              <div className="text-xs text-blue-200 mt-1">
                                {String(nodePos.node.data.detailed_reasoning[0]).slice(0, 100)}...
                              </div>
                            )}
                          </div>
                        ) : nodePos.node.data && 'executive_summary' in nodePos.node.data ? (
                          // Show executive summary for detailed nodes
                          <div className="text-xs">
                            {String(nodePos.node.data.executive_summary).split('\n').slice(0, 3).join(' ').slice(0, 120)}...
                          </div>
                        ) : (
                          // Default display for other nodes
                          <span>
                            {(() => {
                              // Show most relevant data based on node type
                              if (nodePos.node.data && 'sentiment_score' in nodePos.node.data) {
                                return `Sentiment: ${String((nodePos.node.data as any).overall_sentiment)} (${Math.round(Number((nodePos.node.data as any).sentiment_score) * 100)}%)`;
                              } else if (nodePos.node.data && 'eps_beat' in nodePos.node.data) {
                                const surprise = Number((nodePos.node.data as any).earnings_surprise) || 0;
                                return `Earnings: ${(nodePos.node.data as any).eps_beat ? 'Beat' : 'Missed'} by ${Math.abs(surprise).toFixed(1)}%`;
                              } else if (nodePos.node.data && 'price_change_percent' in nodePos.node.data) {
                                const priceChange = Number((nodePos.node.data as any).price_change_percent);
                                return `Price: ${priceChange > 0 ? '+' : ''}${priceChange.toFixed(1)}%`;
                              } else if (nodePos.node.data && typeof nodePos.node.data === 'object') {
                                const key = Object.keys(nodePos.node.data)[0];
                                const value = (nodePos.node.data as any)[key];
                                return `${key}: ${typeof value === 'object' ? JSON.stringify(value).slice(0, 40) : String(value).slice(0, 40)}`;
                              } else {
                                return 'Processing...';
                              }
                            })()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </foreignObject>
                
                {/* Status indicator */}
                <circle
                  cx={nodePos.x + 125}
                  cy={nodePos.y - 45}
                  r="6"
                  fill={nodePos.node.status === 'completed' ? '#10B981' : 
                        nodePos.node.status === 'error' ? '#EF4444' : '#F59E0B'}
                />
                
              </g>
            );
          })}
          </g>
        </svg>
      </div>

      {/* Investigation Summary */}
      {nodes.length > 0 && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* News Branch Summary */}
          <div className="bg-blue-900/20 border border-blue-500 rounded p-3">
            <h4 className="text-blue-300 font-medium text-sm mb-2">📰 News Investigation</h4>
            <div className="text-xs text-gray-300">
              Nodes: {nodes.filter(n => n.label.includes('News')).length}
            </div>
          </div>
          
          {/* Financial Branch Summary */}
          <div className="bg-emerald-900/20 border border-emerald-500 rounded p-3">
            <h4 className="text-emerald-300 font-medium text-sm mb-2">💰 Financial Analysis</h4>
            <div className="text-xs text-gray-300">
              Nodes: {nodes.filter(n => n.label.includes('Financial') || n.label.includes('Earnings')).length}
            </div>
          </div>
          
          {/* Market Branch Summary */}
          <div className="bg-amber-900/20 border border-amber-500 rounded p-3">
            <h4 className="text-amber-300 font-medium text-sm mb-2">Market Context</h4>
            <div className="text-xs text-gray-300">
              Nodes: {nodes.filter(n => n.label.includes('Market') || n.label.includes('Sector')).length}
            </div>
          </div>
        </div>
      )}

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes fadeInNode {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}