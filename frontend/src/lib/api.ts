// API configuration for different environments
export const API_CONFIG = {
  baseURL: process.env.NODE_ENV === 'production' 
    ? '' // In production, API routes will be at the same domain via vercel.json routing
    : 'http://localhost:8000',
  
  wsURL: process.env.NODE_ENV === 'production'
    ? `wss://${typeof window !== 'undefined' ? window.location.host : ''}`
    : 'ws://localhost:8000'
};

export const API_ENDPOINTS = {
  validateStock: `${API_CONFIG.baseURL}/api/validate-stock`,
  investigate: `${API_CONFIG.baseURL}/api/investigate`,
  websocket: (investigationId: string) => 
    `${API_CONFIG.wsURL}/ws/investigation/${investigationId}`
};