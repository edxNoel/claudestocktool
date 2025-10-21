export interface InvestigationData {
  investigation_id: string;
  status: string;
  message: string;
  timestamp: string;
}

export interface InferenceNodeData {
  executive_summary: string;
  primary_cause: string;
  cause_confidence: number;
  detailed_reasoning: string[];
  supporting_evidence: string[];
  price_analysis: {
    start_price: number;
    end_price: number;
    change_percent: number;
    direction: string;
    magnitude: number;
  };
  movement_type: string;
  sustainability_rating: string;
}

export interface SentimentNodeData {
  overall_sentiment: string;
  sentiment_score: number;
  news_articles: any[];
  sentiment_analysis: any;
}

export interface EarningsNodeData {
  eps_beat: boolean;
  eps_surprise: number;
  revenue_beat: boolean;
  revenue_surprise: number;
  guidance_update: string;
}

export interface PriceNodeData {
  price_change_percent: number;
  volume_change: number;
  technical_indicators: any;
}

export interface AgentNode {
  id: string;
  type: 'data_fetch' | 'analysis' | 'decision' | 'inference' | 'validation' | 'spawn';
  label: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  data: InferenceNodeData | SentimentNodeData | EarningsNodeData | PriceNodeData | Record<string, any>;
  parent_id?: string;
  children_ids: string[];
  created_at: string;
  completed_at?: string;
}

export interface InvestigationUpdate {
  type: string;
  investigation_id: string;
  node?: AgentNode;
  message: string;
  timestamp: string;
}

export interface StockValidation {
  symbol: string;
  valid: boolean;
  current_price: number;
  market_cap?: number;
  company_name: string;
  sector: string;
  timestamp: string;
}