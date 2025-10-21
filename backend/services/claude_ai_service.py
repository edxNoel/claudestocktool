import os
import json
import re
from typing import Dict, List, Any, Optional
from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()

class ClaudeAIService:
    def __init__(self):
        self.api_key = os.getenv("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable is required")
        
        self.client = Anthropic(api_key=self.api_key)
        self.model = "claude-3-5-sonnet-20241022"  # Latest Claude model
    
    def _parse_claude_json(self, content: str) -> Dict[str, Any]:
        """Robust JSON parsing for Claude responses"""
        try:
            # First, try direct parsing
            return json.loads(content)
        except json.JSONDecodeError:
            pass
        
        try:
            # Clean control characters except newlines and tabs
            cleaned_content = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', content)
            
            # Try to extract JSON from markdown code blocks
            json_patterns = [
                r'```json\s*(\{.*?\})\s*```',
                r'```\s*(\{.*?\})\s*```',
                r'(\{[^{}]*\{[^{}]*\}[^{}]*\})',  # Nested JSON
                r'(\{[^{}]+\})'  # Simple JSON
            ]
            
            for pattern in json_patterns:
                matches = re.findall(pattern, cleaned_content, re.DOTALL)
                if matches:
                    json_str = matches[0].strip()
                    try:
                        return json.loads(json_str)
                    except json.JSONDecodeError:
                        continue
            
            # If all else fails, try to manually extract key-value pairs
            result = {}
            key_patterns = [
                r'"executive_summary":\s*"([^"]*)"',
                r'"primary_cause":\s*"([^"]*)"',
                r'"detailed_reasoning":\s*"([^"]*)"',
                r'"confidence_score":\s*([0-9.]+)',
                r'"cause_confidence":\s*([0-9.]+)'
            ]
            
            for i, pattern in enumerate(key_patterns):
                match = re.search(pattern, cleaned_content)
                if match:
                    key = ["executive_summary", "primary_cause", "detailed_reasoning", "confidence_score", "cause_confidence"][i]
                    value = match.group(1)
                    if key in ["confidence_score", "cause_confidence"]:
                        result[key] = float(value)
                    else:
                        result[key] = value
            
            if result:
                return result
            
            raise ValueError("Could not parse JSON from Claude response")
            
        except Exception as e:
            print(f"JSON parsing error: {e}")
            print(f"Content preview: {content[:200]}...")
            raise
    
    async def analyze_price_movement(self, stock_data: Dict[str, Any], symbol: str) -> Dict[str, Any]:
        """Use Claude to analyze price movement and determine investigation strategy"""
        
        price_change = stock_data.get("price_change_percent", 0)
        current_price = stock_data.get("current_price", 0)
        volume = stock_data.get("volume", 0)
        
        prompt = f"""You are a professional stock market analyst. Analyze the following stock data and provide intelligent investigation strategy:

STOCK: {symbol}
PRICE CHANGE: {price_change:.2f}%
CURRENT PRICE: ${current_price:.2f}
VOLUME: {volume:,}

Based on this price movement, determine:
1. What investigation hypotheses should be explored?
2. What parallel investigation threads should be spawned?
3. How significant is this price movement?
4. What's the most likely cause category?

Respond in JSON format:
{{
    "investigation_hypotheses": ["hypothesis1", "hypothesis2", ...],
    "parallel_investigations": ["thread1", "thread2", ...],
    "significance": "high|moderate|low",
    "primary_cause_category": "earnings|news|market|technical",
    "confidence": 0.8,
    "reasoning": "Brief explanation of your analysis"
}}"""

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=1000,
                temperature=0.3,
                messages=[{"role": "user", "content": prompt}]
            )
            
            # Parse Claude's response using robust JSON parser
            content = response.content[0].text
            return self._parse_claude_json(content)
            
        except Exception as e:
            print(f"Error in Claude price movement analysis: {e}")
            # Fallback response
            return {
                "investigation_hypotheses": ["Market dynamics analysis needed"],
                "parallel_investigations": ["news_analysis", "market_context"],
                "significance": "moderate",
                "primary_cause_category": "market",
                "confidence": 0.6,
                "reasoning": "Claude API unavailable - using fallback analysis"
            }
    
    async def analyze_news_sentiment(self, symbol: str, news_articles: List[Dict], price_change: float) -> Dict[str, Any]:
        """Use Claude to analyze news sentiment and its impact on stock price"""
        
        headlines = [article.get("headline", "") for article in news_articles[:5]]  # Limit to 5 headlines
        
        prompt = f"""As a financial news analyst, analyze how these news headlines relate to {symbol}'s {price_change:.2f}% price movement:

HEADLINES:
{chr(10).join([f"- {headline}" for headline in headlines])}

PRICE MOVEMENT: {price_change:.2f}%

Provide analysis in JSON format:
{{
    "overall_sentiment": "positive|negative|neutral",
    "sentiment_score": 0.0-1.0,
    "news_contribution_percent": 0-100,
    "key_themes": ["theme1", "theme2"],
    "market_impact_assessment": "detailed explanation",
    "confidence": 0.0-1.0
}}"""

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=800,
                temperature=0.2,
                messages=[{"role": "user", "content": prompt}]
            )
            
            content = response.content[0].text
            return self._parse_claude_json(content)
            
        except Exception as e:
            print(f"Error in Claude news analysis: {e}")
            return {
                "overall_sentiment": "neutral",
                "sentiment_score": 0.5,
                "news_contribution_percent": 30,
                "key_themes": ["market activity"],
                "market_impact_assessment": "Limited analysis available",
                "confidence": 0.5
            }
    
    async def analyze_earnings_impact(self, symbol: str, earnings_data: Dict[str, Any], price_change: float) -> Dict[str, Any]:
        """Use Claude to analyze earnings data and its impact on stock price"""
        
        prompt = f"""As a financial analyst, analyze how {symbol}'s earnings performance relates to its {price_change:.2f}% price movement:

EARNINGS DATA:
- EPS: ${earnings_data.get('last_quarter_eps', 0):.2f} (Expected: ${earnings_data.get('expected_eps', 0):.2f})
- Revenue Growth: {earnings_data.get('revenue_growth', 0):.1f}%
- Beat Expectations: {earnings_data.get('beat_estimate', False)}
- Guidance Updated: {earnings_data.get('guidance_updated', False)}

PRICE MOVEMENT: {price_change:.2f}%

Analyze in JSON format:
{{
    "earnings_explanation": "detailed analysis of earnings impact",
    "surprise_factor": 0.0-1.0,
    "earnings_contribution_percent": 0-100,
    "forward_guidance_impact": "positive|negative|neutral",
    "market_reaction_appropriateness": "overreaction|appropriate|underreaction",
    "confidence": 0.0-1.0
}}"""

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=800,
                temperature=0.2,
                messages=[{"role": "user", "content": prompt}]
            )
            
            content = response.content[0].text
            return self._parse_claude_json(content)
            
        except Exception as e:
            print(f"Error in Claude earnings analysis: {e}")
            return {
                "earnings_explanation": "Earnings analysis unavailable",
                "surprise_factor": 0.5,
                "earnings_contribution_percent": 40,
                "forward_guidance_impact": "neutral",
                "market_reaction_appropriateness": "appropriate",
                "confidence": 0.5
            }
    
    async def generate_master_inference(self, symbol: str, all_findings: List[str], 
                                      price_data: Dict[str, Any], 
                                      investigation_data: Dict[str, Any]) -> Dict[str, Any]:
        """Use Claude to generate comprehensive master inference explaining WHY price moved"""
        
        price_change = price_data.get("price_change_percent", 0)
        start_price = price_data.get("start_price", 0)
        end_price = price_data.get("end_price", 0)
        
        findings_text = "\n".join([f"- {finding}" for finding in all_findings])
        
        prompt = f"""Analyze why {symbol} moved {price_change:.2f}% from ${start_price:.2f} to ${end_price:.2f}.

INVESTIGATION FINDINGS:
{findings_text}

DATA: {json.dumps(investigation_data, indent=2) if investigation_data else "Limited data available"}

Respond with ONLY valid JSON in this exact format:
{{
    "executive_summary": "Brief 1-2 sentence explanation",
    "primary_cause": "Main driver category", 
    "detailed_reasoning": "Comprehensive explanation of why this price movement occurred",
    "key_catalysts": ["catalyst1", "catalyst2"],
    "confidence_score": 0.8,
    "cause_confidence": 0.8,
    "movement_sustainability": "moderate",
    "investment_thesis": "Investment implication"
}}

IMPORTANT: Response must be valid JSON only. No markdown, no explanatory text, just the JSON object."""

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=1500,
                temperature=0.2,
                messages=[{"role": "user", "content": prompt}]
            )
            
            content = response.content[0].text
            return self._parse_claude_json(content)
            
        except Exception as e:
            print(f"Error in Claude master inference: {e}")
            return {
                "executive_summary": f"{symbol} moved {price_change:.2f}% due to market dynamics requiring further analysis",
                "primary_cause": "Market Analysis Required",
                "detailed_reasoning": "Comprehensive analysis unavailable - Claude API error occurred",
                "key_catalysts": ["Market activity"],
                "confidence_score": 0.6,
                "cause_confidence": 0.6,
                "movement_sustainability": "moderate",
                "investment_thesis": "Monitor for additional data"
            }
    
    async def generate_investigation_decision(self, current_findings: List[str], symbol: str) -> Dict[str, Any]:
        """Use Claude to make autonomous investigation decisions"""
        
        findings_text = "\n".join([f"- {finding}" for finding in current_findings])
        
        prompt = f"""As an AI investment analyst, make autonomous decisions about what to investigate next for {symbol}.

CURRENT FINDINGS:
{findings_text}

Based on these findings, decide what investigation paths to pursue. Respond in JSON:
{{
    "next_investigations": ["investigation1", "investigation2"],
    "priority_level": "high|medium|low",
    "reasoning": "Why these investigations are needed",
    "expected_insights": ["insight1", "insight2"],
    "investigation_depth": "comprehensive|targeted|basic"
}}"""

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=600,
                temperature=0.3,
                messages=[{"role": "user", "content": prompt}]
            )
            
            content = response.content[0].text
            return self._parse_claude_json(content)
            
        except Exception as e:
            print(f"Error in Claude investigation decision: {e}")
            return {
                "next_investigations": ["market_analysis"],
                "priority_level": "medium",
                "reasoning": "Standard investigation protocol",
                "expected_insights": ["Market dynamics"],
                "investigation_depth": "targeted"
            }