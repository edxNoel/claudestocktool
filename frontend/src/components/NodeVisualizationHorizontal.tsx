'use client';

import { useEffect, useRef, useState } from 'react';
import { AgentNode } from '@/types';

interface NodeVisualizationProps {
  nodes: AgentNode[];
  isLoading: boolean;
}

export default function NodeVisualization({ nodes, isLoading }: NodeVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [showChildNodes, setShowChildNodes] = useState<Set<string>>(new Set());

  const toggleNodeExpansion = (nodeId: string) => {
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

  const toggleChildNodes = (nodeId: string) => {
    setShowChildNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const getChildNodes = (parentId: string) => {
    return nodes.filter(node => node.parent_id === parentId);
  };

  const getRootNodes = () => {
    return nodes.filter(node => !node.parent_id);
  };

  const isLargeInferenceNode = (node: AgentNode) => {
    return node.type === 'inference' && (
      node.label.includes('Master Inference') || 
      node.label.includes('Comprehensive') ||
      (node.data as any)?.executive_summary
    );
  };

  const getNodeColor = (type: string) => {
    const colors = {
      data_fetch: 'border-blue-500 bg-blue-900/20',
      analysis: 'border-emerald-500 bg-emerald-900/20',
      decision: 'border-amber-500 bg-amber-900/20', 
      inference: 'border-purple-500 bg-purple-900/20',
      validation: 'border-red-500 bg-red-900/20',
      spawn: 'border-cyan-500 bg-cyan-900/20'
    };
    return colors[type as keyof typeof colors] || 'border-gray-500 bg-gray-900/20';
  };

  const getNodeIcon = (type: string) => {
    const icons = {
      data_fetch: 'DATA',
      analysis: 'ANALYZE', 
      decision: 'DECIDE',
      inference: 'INFER',
      validation: 'VALID',
      spawn: 'SPAWN'
    };
    return icons[type as keyof typeof icons] || 'NODE';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      completed: 'bg-green-600 text-green-100',
      in_progress: 'bg-yellow-600 text-yellow-100', 
      error: 'bg-red-600 text-red-100',
      pending: 'bg-gray-600 text-gray-100'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-600 text-gray-100';
  };

  if (!nodes.length && !isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 font-bold text-blue-400">AI</div>
          <h3 className="text-xl font-semibold text-white mb-2">Ready to Investigate</h3>
          <p className="text-gray-400">Enter a stock symbol to watch AI agents work in real-time</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">
          AI Agent Investigation Flow
        </h3>
        <div className="flex items-center space-x-4 text-sm">
          <div className="text-gray-300">Nodes: <span className="text-blue-400 font-bold">{nodes.length}</span></div>
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

      {isLoading && nodes.length === 0 && (
        <div className="text-gray-400 text-center py-12">
          <div className="animate-spin text-4xl mb-4 font-bold">AI</div>
          <p>Initializing AI agents...</p>
        </div>
      )}

      {/* Horizontal Flow Layout */}
      <div className="overflow-x-auto pb-4" ref={containerRef}>
        <div className="flex items-center gap-4 min-w-max pb-4">
          {nodes.map((node, index) => (
            <div key={node.id} className="flex items-center">
              {/* Node Card */}
              <div
                className={`min-w-[300px] max-w-[300px] border-2 rounded-lg p-4 transition-all duration-500 transform ${
                  getNodeColor(node.type)
                } hover:scale-105 hover:shadow-xl`}
                style={{
                  animationDelay: `${index * 0.3}s`,
                }}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 text-xs rounded bg-gray-600 text-gray-200 font-mono font-bold">
                      {getNodeIcon(node.type)}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded font-medium ${getStatusColor(node.status)}`}>
                      {node.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(node.created_at).toLocaleTimeString()}
                  </div>
                </div>
                
                {/* Node Title */}
                <h4 className="font-semibold text-white text-sm mb-2 leading-tight">
                  {node.label}
                </h4>
                
                {/* Description */}
                <p className="text-gray-300 text-xs mb-3 leading-relaxed">
                  {node.description}
                </p>
                
                {/* Data Preview - Special handling for Master Inference */}
                {node.data && Object.keys(node.data).length > 0 && (
                  <div className="bg-gray-900/50 rounded p-3 text-xs border border-gray-600">
                    <div className="text-gray-300 font-medium mb-2">
                      Key Data
                    </div>
                    {isLargeInferenceNode(node) ? (
                      <div className="space-y-2">
                        {/* Executive Summary */}
                        {(node.data as any)?.executive_summary && (
                          <div>
                            <span className="text-gray-400 text-xs font-medium">Executive Summary:</span>
                            <p className="text-white text-xs mt-1 leading-relaxed">
                              {(node.data as any).executive_summary}
                            </p>
                          </div>
                        )}
                        
                        {/* Key Findings */}
                        {(node.data as any)?.key_findings && (
                          <div>
                            <span className="text-gray-400 text-xs font-medium">Key Findings:</span>
                            <p className="text-white text-xs mt-1 leading-relaxed">
                              {(node.data as any).key_findings}
                            </p>
                          </div>
                        )}
                        
                        {/* Detailed Reasoning - Expandable */}
                        {(node.data as any)?.detailed_reasoning && (
                          <div>
                            <button
                              onClick={() => toggleNodeExpansion(node.id)}
                              className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors"
                            >
                              {expandedNodes.has(node.id) ? '▼' : '▶'} Detailed Reasoning
                            </button>
                            {expandedNodes.has(node.id) && (
                              <div className="mt-2 p-3 bg-gray-800/80 rounded text-xs border border-gray-500">
                                <p className="text-white leading-relaxed whitespace-pre-wrap">
                                  {(node.data as any).detailed_reasoning}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Other important fields */}
                        {Object.entries(node.data)
                          .filter(([key]) => !['executive_summary', 'key_findings', 'detailed_reasoning'].includes(key))
                          .slice(0, 2)
                          .map(([key, value]) => (
                            <div key={key} className="flex justify-between items-start">
                              <span className="text-gray-400 capitalize text-xs mr-2">
                                {key.replace(/_/g, ' ')}:
                              </span>
                              <span className="text-white text-xs text-right flex-1 truncate">
                                {typeof value === 'object' 
                                  ? JSON.stringify(value).substring(0, 30) + '...'
                                  : typeof value === 'number'
                                  ? value.toLocaleString()
                                  : String(value).substring(0, 40)
                                }
                              </span>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {Object.entries(node.data).slice(0, 4).map(([key, value]) => (
                          <div key={key} className="flex justify-between items-start">
                            <span className="text-gray-400 capitalize text-xs mr-2">
                              {key.replace(/_/g, ' ')}:
                            </span>
                            <span className="text-white text-xs text-right flex-1 truncate">
                              {typeof value === 'object' 
                                ? JSON.stringify(value).substring(0, 30) + '...'
                                : typeof value === 'number'
                                ? value.toLocaleString()
                                : String(value).substring(0, 40)
                              }
                            </span>
                          </div>
                        ))}
                        {Object.keys(node.data).length > 4 && (
                          <div className="text-gray-500 text-xs italic">
                            +{Object.keys(node.data).length - 4} more fields
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Node Type Badge */}
                <div className="mt-3 flex justify-between items-center">
                  <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded font-mono">
                    {node.type.replace('_', ' ').toUpperCase()}
                  </span>
                  {node.parent_id && (
                    <span className="text-gray-500 text-xs">↳ child node</span>
                  )}
                  {getChildNodes(node.id).length > 0 && (
                    <button
                      onClick={() => toggleChildNodes(node.id)}
                      className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                    >
                      {showChildNodes.has(node.id) ? 'Hide' : 'Show'} {getChildNodes(node.id).length} child{getChildNodes(node.id).length !== 1 ? 'ren' : ''}
                    </button>
                  )}
                </div>
              </div>

              {/* Child Nodes Display */}
              {showChildNodes.has(node.id) && getChildNodes(node.id).length > 0 && (
                <div className="mt-4 ml-8">
                  <div className="flex flex-col gap-3">
                    {getChildNodes(node.id).map((childNode) => (
                      <div
                        key={childNode.id}
                        className={`min-w-[250px] max-w-[250px] border border-gray-600 rounded-lg p-3 ${
                          getNodeColor(childNode.type)
                        } opacity-90`}
                      >
                        {/* Child Node Header */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="px-1 py-0.5 text-xs rounded bg-gray-600 text-gray-200 font-mono">
                              {getNodeIcon(childNode.type)}
                            </span>
                            <span className={`px-1 py-0.5 text-xs rounded font-medium ${getStatusColor(childNode.status)}`}>
                              {childNode.status}
                            </span>
                          </div>
                          <span className="text-gray-500 text-xs">↳ child</span>
                        </div>
                        
                        {/* Child Node Content */}
                        <h5 className="font-medium text-white text-xs mb-1">
                          {childNode.label}
                        </h5>
                        <p className="text-gray-300 text-xs leading-relaxed">
                          {childNode.description}
                        </p>
                        
                        {/* Child Node Data */}
                        {childNode.data && Object.keys(childNode.data).length > 0 && (
                          <div className="mt-2 bg-gray-900/30 rounded p-2 text-xs">
                            {Object.entries(childNode.data).slice(0, 2).map(([key, value]) => (
                              <div key={key} className="flex justify-between items-start mb-1">
                                <span className="text-gray-400 text-xs mr-1">
                                  {key}:
                                </span>
                                <span className="text-white text-xs text-right flex-1 truncate">
                                  {typeof value === 'object' ? JSON.stringify(value).slice(0, 30) + '...' : String(value).slice(0, 30)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Arrow Connector */}
              {index < nodes.length - 1 && (
                <div className="flex items-center px-4">
                  <div className="flex items-center">
                    <div className="w-12 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400"></div>
                    <div className="w-0 h-0 border-l-[10px] border-l-purple-400 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent ml-1"></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Progress Summary */}
      {nodes.length > 0 && (
        <div className="mt-6 p-4 bg-gray-700 rounded-lg">
            <h4 className="text-white font-medium mb-3">
            Investigation Progress
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
            <div className="text-center">
              <span className="text-blue-400 font-bold text-xl block">{nodes.length}</span>
              <span className="text-gray-300 text-xs">Total Nodes</span>
            </div>
            <div className="text-center">
              <span className="text-blue-400 font-bold text-xl block">
                {nodes.filter(n => n.type === 'data_fetch').length}
              </span>
              <span className="text-gray-300 text-xs">Data Fetches</span>
            </div>
            <div className="text-center">
              <span className="text-emerald-400 font-bold text-xl block">
                {nodes.filter(n => n.type === 'analysis').length}
              </span>
              <span className="text-gray-300 text-xs">Analyses</span>
            </div>
            <div className="text-center">
              <span className="text-amber-400 font-bold text-xl block">
                {nodes.filter(n => n.type === 'decision').length}
              </span>
              <span className="text-gray-300 text-xs">Decisions</span>
            </div>
            <div className="text-center">
              <span className="text-purple-400 font-bold text-xl block">
                {nodes.filter(n => n.type === 'inference').length}
              </span>
              <span className="text-gray-300 text-xs">Inferences</span>
            </div>
            <div className="text-center">
              <span className="text-red-400 font-bold text-xl block">
                {nodes.filter(n => n.type === 'validation').length}
              </span>
              <span className="text-gray-300 text-xs">Validations</span>
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-between text-xs">
            <span className="text-gray-400">
              Investigation Status: 
              <span className={`ml-1 font-medium ${isLoading ? 'text-yellow-400' : 'text-green-400'}`}>
                {isLoading ? 'In Progress' : 'Completed'}
              </span>
            </span>
            <span className="text-gray-400">
              Latest: {nodes.length > 0 ? nodes[nodes.length - 1].label : 'None'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}