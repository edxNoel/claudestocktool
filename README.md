# 🤖 Agentic AI Stock Investigation System

A real-time stock investigation system powered by autonomous AI agents that make independent decisions about their investigation paths, built with Next.js and FastAPI using LangGraph.

## Features

- **Autonomous AI Investigation**: AI agents make independent decisions about investigation paths
- **Real-time Node Visualization**: Watch agent decision-making in real-time through interactive graphs  
- **LangGraph Workflows**: Sophisticated agent workflows with state management
- **Stock Data Validation**: Real market data validation before investigation
- **WebSocket Updates**: Live investigation progress streaming
- **Dynamic Node Creation**: Agents spawn new investigation threads based on findings

## Architecture

```
├── frontend/          # Next.js with TypeScript & Tailwind CSS
│   ├── src/
│   │   ├── app/          # App Router pages
│   │   ├── components/   # React components for UI
│   │   └── types/        # TypeScript type definitions
├── backend/           # FastAPI Python backend
│   ├── agents/           # LangGraph investigation agents
│   ├── models/           # Pydantic schemas
│   └── main.py          # FastAPI app with endpoints
```

## Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety and better DX
- **Tailwind CSS** - Utility-first styling
- **WebSockets** - Real-time updates

### Backend  
- **FastAPI** - High-performance Python API framework
- **LangGraph** - Agentic AI workflow orchestration
- **Pydantic** - Data validation and serialization
- **yfinance** - Stock data fetching
- **WebSockets** - Real-time communication

### AI Framework
- **LangGraph** - State-based agent workflows
- **OpenAI GPT-4** - Language model for decisions
- **Custom Agent Architecture** - Autonomous investigation logic

## Quick Start

### Prerequisites
- **Node.js** 18+ 
- **Python** 3.9+
- **OpenAI API Key** (for AI features)

### 1. Clone and Setup
```bash
git clone <your-repo>
cd agentic-ai-stock-investigation
```

### 2. Backend Setup
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Add your API keys to .env file
```

### 3. Frontend Setup  
```bash
cd frontend
npm install
```

### 4. Environment Variables
Create `backend/.env` with:
```env
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_claude_api_key_here  
PERPLEXITY_API_KEY=your_perplexity_api_key_here
```

### 5. Run the Application

#### Development Mode (Recommended)
```bash
# From root directory - runs both frontend and backend
npm run dev
```

#### Manual Mode
```bash
# Terminal 1 - Backend
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### 6. Open Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 📡 API Endpoints

### Core Endpoints
- `POST /api/validate-stock` - Validate stock symbol and fetch market data
- `POST /api/investigate` - Start autonomous AI investigation
- `GET /api/investigation/{id}` - Get investigation status and results
- `WS /ws/investigation/{id}` - WebSocket for real-time updates

### Example Usage
```javascript
// Start investigation
const response = await fetch('http://localhost:8000/api/investigate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ symbol: 'AAPL' })
});

// Connect to real-time updates
const ws = new WebSocket(`ws://localhost:8000/ws/investigation/${investigation_id}`);
```

## 🤖 How the AI Agent Works

### Autonomous Decision Making
The AI agent uses LangGraph to create sophisticated workflows that:

1. **Data Fetching** - Retrieves stock data and market information
2. **Trend Analysis** - Analyzes patterns and technical indicators  
3. **Decision Points** - AI decides next investigation steps autonomously
4. **Parallel Threads** - Spawns new investigation branches based on findings
5. **Cross Validation** - Combines multiple data sources for insights
6. **Inference Generation** - Creates conclusions from accumulated evidence

### Node Types
- **Data Fetch** - Retrieving information from various sources
- **Analysis** - Processing and analyzing collected data
- **Decision** - AI agent making autonomous choices
- **Inference** - Combining multiple findings into insights
- **Validation** - Cross-checking information accuracy
- **Spawn** - Creating new investigation threads

### Real-time Visualization
Watch the AI agent's decision-making process through the node-based interface:
- Nodes appear as the agent creates them
- Connections show information flow
- Colors indicate node types and status
- Real-time updates via WebSocket

## Usage Examples

### Stock Symbols to Try
- **AAPL** - Apple Inc.
- **TSLA** - Tesla Inc. 
- **GOOGL** - Alphabet Inc.
- **MSFT** - Microsoft Corp.
- **AMZN** - Amazon.com Inc.
- **NVDA** - NVIDIA Corp.

### Investigation Process
1. Enter a stock symbol (e.g., "TSLA")
2. Watch as the AI agent:
   - Fetches current market data
   - Analyzes price trends and patterns
   - Makes decisions about what to investigate next
   - Spawns parallel investigation threads
   - Cross-validates findings from multiple sources
   - Generates insights and conclusions

## Development

### Project Structure
```
frontend/src/
├── app/
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Main investigation interface
├── components/
│   ├── InvestigationForm.tsx    # Stock symbol input form
│   └── NodeVisualization.tsx    # Real-time node graph
└── types/
    └── index.ts          # TypeScript definitions

backend/
├── agents/
│   └── investigation_agent.py   # LangGraph agent implementation
├── models/
│   └── schemas.py        # Pydantic data models
└── main.py              # FastAPI application
```

### Adding New Agent Capabilities
1. Extend the `InvestigationAgent` class in `backend/agents/investigation_agent.py`
2. Add new node types to the LangGraph workflow
3. Update the frontend types in `frontend/src/types/index.ts`
4. Enhance the visualization in `NodeVisualization.tsx`

### Extending the Investigation Logic
The agent workflow is defined in the `build_graph()` method. Add new nodes by:
```python
def your_new_investigation_step(state: InvestigationState) -> InvestigationState:
    # Your custom investigation logic
    return state

workflow.add_node("your_step", your_new_investigation_step)
```

## Troubleshooting

### Common Issues
1. **WebSocket Connection Failed**: Ensure backend is running on port 8000
2. **Stock Data Not Loading**: Check yfinance package installation  
3. **AI Agent Not Working**: Verify OpenAI API key in .env file
4. **Frontend Not Starting**: Run `npm install` in frontend directory

### Debug Mode
Enable debug logging in the backend:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## Deployment

### Production Build
```bash
# Build frontend
cd frontend
npm run build

# Run production backend
cd backend  
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### Docker (Coming Soon)
Docker configuration for easy deployment will be added in future updates.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For questions and support:
- Create an issue in the GitHub repository
- Check the API documentation at `/docs` when running the backend
- Review the browser console for frontend debugging

---

**Built using Next.js, FastAPI, and LangGraph**