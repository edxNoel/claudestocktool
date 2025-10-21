'use client';

import { useState, useEffect, useRef } from 'react';
import InvestigationForm from '@/components/InvestigationForm';
import NodeVisualization from '@/components/NodeVisualizationHorizontal';
import { InvestigationData, AgentNode } from '@/types';
import { API_ENDPOINTS } from '@/lib/api';

export default function Home() {
  const [investigationData, setInvestigationData] = useState<InvestigationData | null>(null);
  const [nodes, setNodes] = useState<AgentNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentWebSocket, setCurrentWebSocket] = useState<WebSocket | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (currentWebSocket) {
        currentWebSocket.close();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentWebSocket]);

  const handleInvestigationStart = async (symbol: string, dateRange: { start_date: string; end_date: string }) => {
    setIsLoading(true);
    setNodes([]);
    
    try {
      // Validate stock first
      const validateResponse = await fetch(API_ENDPOINTS.validateStock, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol }),
      });

      if (!validateResponse.ok) {
        const errorData = await validateResponse.text();
        throw new Error(`Stock validation failed: ${errorData}`);
      }

      const validationData = await validateResponse.json();
      console.log('Stock validated:', validationData);

      // Start investigation with date range
      const response = await fetch(API_ENDPOINTS.investigate, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          symbol,
          date_range: dateRange
        }),
      });

      const data = await response.json();
      setInvestigationData(data);

      // Close any existing WebSocket and timeout
      if (currentWebSocket) {
        currentWebSocket.close();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set up safety timeout (2 minutes max for investigation)
      timeoutRef.current = setTimeout(() => {
        console.log('Investigation timeout - forcing completion');
        setIsLoading(false);
        if (currentWebSocket) {
          currentWebSocket.close();
          setCurrentWebSocket(null);
        }
      }, 120000); // 2 minutes timeout

      // Connect to WebSocket for real-time updates
      const ws = new WebSocket(API_ENDPOINTS.websocket(data.investigation_id));
      setCurrentWebSocket(ws);
      
      ws.onmessage = (event) => {
        const update = JSON.parse(event.data);
        console.log('Received update:', update);

        if (update.type === 'node_update') {
          // Handle actual investigation nodes
          setNodes(prev => [...prev, update.node]);
        } else if (update.type === 'investigation_complete') {
          console.log('Investigation completed');
          setIsLoading(false);
          ws.close();
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
        } else if (update.type === 'error') {
          console.error('Investigation error:', update);
          setIsLoading(false);
          ws.close();
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
        }
      };      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsLoading(false);
        setCurrentWebSocket(null);
      };

      ws.onclose = () => {
        console.log('WebSocket connection closed');
        setIsLoading(false);
        setCurrentWebSocket(null);
      };

    } catch (error) {
      console.error('Investigation failed:', error);
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    // Force close WebSocket connection
    if (currentWebSocket) {
      currentWebSocket.close();
      setCurrentWebSocket(null);
    }
    
    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Reset all state
    setInvestigationData(null);
    setNodes([]);
    setIsLoading(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Agentic AI Stock Investigation System
          </h1>
          <p className="text-blue-200 text-lg">
            Watch autonomous AI agents investigate stocks in real-time
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Investigation Form */}
          <div className="lg:col-span-1">
            <InvestigationForm 
              onInvestigationStart={handleInvestigationStart}
              onReset={handleReset}
              isLoading={isLoading}
            />
            
            {investigationData && (
              <div className="mt-6 bg-gray-800 rounded-lg p-6">
                <h3 className="text-white font-semibold mb-3">Investigation Status</h3>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-300">ID: {investigationData.investigation_id}</p>
                  <p className="text-gray-300">Status: <span className="text-green-400">{investigationData.status}</span></p>
                  <p className="text-gray-300">Investigation Nodes: <span className="text-blue-400">{nodes.length}</span></p>
                </div>
              </div>
            )}
          </div>

          {/* Node Visualization */}
          <div className="lg:col-span-2">
            <NodeVisualization nodes={nodes} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </main>
  );
}
