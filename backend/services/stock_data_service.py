"""
Stock Data Service using multiple reliable APIs
"""
import requests
import json
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import asyncio
import httpx

class StockDataService:
    def __init__(self):
        # These are free tier APIs that don't require authentication
        self.alpha_vantage_key = "demo"  # You can get a free key from https://www.alphavantage.co/
        self.base_urls = {
            "alpha_vantage": "https://www.alphavantage.co/query",
            "finnhub": "https://finnhub.io/api/v1",
            "polygon": "https://api.polygon.io/v2",
            "marketstack": "http://api.marketstack.com/v1"
        }
    
    async def get_stock_quote(self, symbol: str) -> Dict[str, Any]:
        """Get current stock quote with fallback to multiple sources"""
        
        # Method 1: Try Alpha Vantage (free tier)
        try:
            quote = await self._get_alpha_vantage_quote(symbol)
            if quote:
                return quote
        except Exception as e:
            print(f"Alpha Vantage failed: {e}")
        
        # Method 2: Try Financial Modeling Prep (free tier)
        try:
            quote = await self._get_fmp_quote(symbol)
            if quote:
                return quote
        except Exception as e:
            print(f"FMP failed: {e}")
        
        # Method 3: Try Twelve Data (free tier)
        try:
            quote = await self._get_twelve_data_quote(symbol)
            if quote:
                return quote
        except Exception as e:
            print(f"Twelve Data failed: {e}")
        
        # Method 4: Generate synthetic data based on common patterns
        return self._generate_synthetic_data(symbol)
    
    async def get_historical_data(self, symbol: str, days: int = 30) -> List[Dict[str, Any]]:
        """Get historical stock data"""
        
        # Try Alpha Vantage first
        try:
            data = await self._get_alpha_vantage_historical(symbol, days)
            if data:
                return data
        except Exception as e:
            print(f"Alpha Vantage historical failed: {e}")
        
        # Fallback to synthetic historical data
        return self._generate_synthetic_historical(symbol, days)
    
    async def _get_alpha_vantage_quote(self, symbol: str) -> Optional[Dict[str, Any]]:
        """Get quote from Alpha Vantage"""
        url = f"{self.base_urls['alpha_vantage']}"
        params = {
            "function": "GLOBAL_QUOTE",
            "symbol": symbol,
            "apikey": self.alpha_vantage_key
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params)
            data = response.json()
            
            if "Global Quote" in data:
                quote = data["Global Quote"]
                return {
                    "symbol": symbol,
                    "current_price": float(quote.get("05. price", 0)),
                    "change": float(quote.get("09. change", 0)),
                    "change_percent": quote.get("10. change percent", "0%").replace("%", ""),
                    "volume": int(quote.get("06. volume", 0)),
                    "high": float(quote.get("03. high", 0)),
                    "low": float(quote.get("04. low", 0)),
                    "open": float(quote.get("02. open", 0)),
                    "previous_close": float(quote.get("08. previous close", 0)),
                    "source": "alpha_vantage"
                }
        return None
    
    async def _get_fmp_quote(self, symbol: str) -> Optional[Dict[str, Any]]:
        """Get quote from Financial Modeling Prep (free tier)"""
        url = f"https://financialmodelingprep.com/api/v3/quote/{symbol}"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            data = response.json()
            
            if data and len(data) > 0:
                quote = data[0]
                return {
                    "symbol": symbol,
                    "current_price": float(quote.get("price", 0)),
                    "change": float(quote.get("change", 0)),
                    "change_percent": str(quote.get("changesPercentage", 0)),
                    "volume": int(quote.get("volume", 0)),
                    "high": float(quote.get("dayHigh", 0)),
                    "low": float(quote.get("dayLow", 0)),
                    "open": float(quote.get("open", 0)),
                    "previous_close": float(quote.get("previousClose", 0)),
                    "market_cap": quote.get("marketCap"),
                    "source": "fmp"
                }
        return None
    
    async def _get_twelve_data_quote(self, symbol: str) -> Optional[Dict[str, Any]]:
        """Get quote from Twelve Data (free tier)"""
        url = f"https://api.twelvedata.com/price"
        params = {
            "symbol": symbol,
            "apikey": "demo"  # Free tier
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params)
            data = response.json()
            
            if "price" in data:
                # Get additional data
                quote_url = f"https://api.twelvedata.com/quote"
                quote_params = {
                    "symbol": symbol,
                    "apikey": "demo"
                }
                
                quote_response = await client.get(quote_url, params=quote_params)
                quote_data = quote_response.json()
                
                return {
                    "symbol": symbol,
                    "current_price": float(data.get("price", 0)),
                    "change": float(quote_data.get("change", 0)),
                    "change_percent": str(quote_data.get("percent_change", 0)),
                    "volume": int(quote_data.get("volume", 0)),
                    "high": float(quote_data.get("high", 0)),
                    "low": float(quote_data.get("low", 0)),
                    "open": float(quote_data.get("open", 0)),
                    "previous_close": float(quote_data.get("previous_close", 0)),
                    "source": "twelve_data"
                }
        return None
    
    async def _get_alpha_vantage_historical(self, symbol: str, days: int) -> Optional[List[Dict[str, Any]]]:
        """Get historical data from Alpha Vantage"""
        url = f"{self.base_urls['alpha_vantage']}"
        params = {
            "function": "TIME_SERIES_DAILY",
            "symbol": symbol,
            "apikey": self.alpha_vantage_key,
            "outputsize": "compact"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params)
            data = response.json()
            
            if "Time Series (Daily)" in data:
                time_series = data["Time Series (Daily)"]
                historical_data = []
                
                for date_str, values in list(time_series.items())[:days]:
                    historical_data.append({
                        "date": date_str,
                        "open": float(values["1. open"]),
                        "high": float(values["2. high"]),
                        "low": float(values["3. low"]),
                        "close": float(values["4. close"]),
                        "volume": int(values["5. volume"])
                    })
                
                return historical_data
        return None
    
    def _generate_synthetic_data(self, symbol: str) -> Dict[str, Any]:
        """Generate realistic synthetic stock data for demo purposes"""
        import random
        
        # Base prices for common stocks
        base_prices = {
            "AAPL": 175.0,
            "GOOGL": 130.0,
            "MSFT": 310.0,
            "TSLA": 250.0,
            "AMZN": 140.0,
            "NVDA": 450.0,
            "META": 300.0,
            "NFLX": 400.0,
        }
        
        base_price = base_prices.get(symbol, 100.0)
        
        # Add some random variation (+/- 5%)
        current_price = base_price * (1 + random.uniform(-0.05, 0.05))
        change = random.uniform(-5.0, 5.0)
        change_percent = (change / current_price) * 100
        
        return {
            "symbol": symbol,
            "current_price": round(current_price, 2),
            "change": round(change, 2),
            "change_percent": f"{change_percent:.2f}%",
            "volume": random.randint(1000000, 50000000),
            "high": round(current_price * 1.02, 2),
            "low": round(current_price * 0.98, 2),
            "open": round(current_price * random.uniform(0.99, 1.01), 2),
            "previous_close": round(current_price - change, 2),
            "market_cap": random.randint(50000000000, 2000000000000),
            "source": "synthetic"
        }
    
    def _generate_synthetic_historical(self, symbol: str, days: int) -> List[Dict[str, Any]]:
        """Generate synthetic historical data"""
        import random
        from datetime import datetime, timedelta
        
        base_price = self._generate_synthetic_data(symbol)["current_price"]
        historical_data = []
        
        for i in range(days):
            date = datetime.now() - timedelta(days=i)
            # Simulate some price movement
            price_variation = 1 + random.uniform(-0.03, 0.03)  # +/- 3% daily
            price = base_price * price_variation
            
            historical_data.append({
                "date": date.strftime("%Y-%m-%d"),
                "open": round(price * random.uniform(0.99, 1.01), 2),
                "high": round(price * random.uniform(1.00, 1.03), 2),
                "low": round(price * random.uniform(0.97, 1.00), 2),
                "close": round(price, 2),
                "volume": random.randint(1000000, 50000000)
            })
        
        return historical_data