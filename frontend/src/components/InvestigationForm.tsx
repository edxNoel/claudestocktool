'use client';

import { useState } from 'react';

interface InvestigationFormProps {
  onInvestigationStart: (symbol: string, dateRange: { start_date: string; end_date: string }) => Promise<void>;
  onReset: () => void;
  isLoading: boolean;
}

export default function InvestigationForm({ onInvestigationStart, onReset, isLoading }: InvestigationFormProps) {
  const [symbol, setSymbol] = useState('');
  const [dateMode, setDateMode] = useState<'preset' | 'custom'>('preset');
  const [presetRange, setPresetRange] = useState('30d');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [error, setError] = useState('');

  // Helper function to get date in YYYY-MM-DD format
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // Set default dates when switching to custom mode
  const handleDateModeChange = (mode: 'preset' | 'custom') => {
    setDateMode(mode);
    if (mode === 'custom' && !customStartDate && !customEndDate) {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30); // Default to 30 days ago
      
      setCustomEndDate(formatDate(endDate));
      setCustomStartDate(formatDate(startDate));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!symbol.trim()) {
      setError('Please enter a stock symbol');
      return;
    }

    try {
      let dateRangeObj;
      
      if (dateMode === 'custom') {
        if (!customStartDate || !customEndDate) {
          setError('Please select both start and end dates');
          return;
        }
        
        const startDate = new Date(customStartDate);
        const endDate = new Date(customEndDate);
        
        if (startDate >= endDate) {
          setError('Start date must be before end date');
          return;
        }
        
        const today = new Date();
        if (endDate > today) {
          setError('End date cannot be in the future');
          return;
        }
        
        dateRangeObj = {
          start_date: customStartDate,
          end_date: customEndDate
        };
      } else {
        // Calculate date range based on preset selection
        const endDate = new Date();
        const startDate = new Date();
        
        switch (presetRange) {
          case '7d':
            startDate.setDate(endDate.getDate() - 7);
            break;
          case '30d':
            startDate.setDate(endDate.getDate() - 30);
            break;
          case '90d':
            startDate.setDate(endDate.getDate() - 90);
            break;
          case '1y':
            startDate.setFullYear(endDate.getFullYear() - 1);
            break;
          default:
            startDate.setDate(endDate.getDate() - 30);
        }

        dateRangeObj = {
          start_date: formatDate(startDate),
          end_date: formatDate(endDate)
        };
      }

      await onInvestigationStart(symbol.toUpperCase().trim(), dateRangeObj);
    } catch {
      setError('Failed to start investigation. Please try again.');
    }
  };

  const handleReset = () => {
    setSymbol('');
    setDateMode('preset');
    setPresetRange('30d');
    setCustomStartDate('');
    setCustomEndDate('');
    setError('');
    onReset();
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
      <h2 className="text-xl font-semibold text-white mb-4">Start Investigation</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="symbol" className="block text-sm font-medium text-gray-300 mb-2">
            Stock Symbol
          </label>
          <input
            type="text"
            id="symbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="Enter symbol (e.g., AAPL, TSLA)"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Investigation Period
          </label>
          
          {/* Date Mode Toggle */}
          <div className="flex space-x-4 mb-3">
            <label className="flex items-center">
              <input
                type="radio"
                name="dateMode"
                value="preset"
                checked={dateMode === 'preset'}
                onChange={() => handleDateModeChange('preset')}
                className="mr-2 text-blue-600"
                disabled={isLoading}
              />
              <span className="text-gray-300">Preset Ranges</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="dateMode"
                value="custom"
                checked={dateMode === 'custom'}
                onChange={() => handleDateModeChange('custom')}
                className="mr-2 text-blue-600"
                disabled={isLoading}
              />
              <span className="text-gray-300">Custom Range</span>
            </label>
          </div>

          {/* Preset Date Range */}
          {dateMode === 'preset' && (
            <select
              id="presetRange"
              value={presetRange}
              onChange={(e) => setPresetRange(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last 1 year</option>
            </select>
          )}

          {/* Custom Date Range */}
          {dateMode === 'custom' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="startDate" className="block text-xs font-medium text-gray-400 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                  max={customEndDate || formatDate(new Date())}
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-xs font-medium text-gray-400 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                  min={customStartDate}
                  max={formatDate(new Date())}
                />
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded p-2">
            {error}
          </div>
        )}

        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Investigating...
              </>
            ) : (
              'Start AI Investigation'
            )}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className={`${
              isLoading 
                ? 'bg-red-600 hover:bg-red-700 border-2 border-red-400' 
                : 'bg-gray-600 hover:bg-gray-700'
            } text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center`}
          >
            {isLoading ? (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Force Stop
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset
              </>
            )}
          </button>
        </div>
      </form>

      <div className="mt-6 text-xs text-gray-400">
        <h4 className="font-medium mb-2">Popular Stocks to Try:</h4>
        <div className="flex flex-wrap gap-2">
          {['AAPL', 'TSLA', 'GOOGL', 'MSFT', 'AMZN', 'NVDA'].map((ticker) => (
            <button
              key={ticker}
              onClick={() => setSymbol(ticker)}
              className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 transition-colors"
              disabled={isLoading}
            >
              {ticker}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}