import asyncio
from services.claude_ai_service import ClaudeAIService
import json
import re

async def debug_claude():
    try:
        service = ClaudeAIService()
        
        prompt = """You are a senior equity research analyst. Analyze why GOOGL moved 1.88%.
        
Respond with valid JSON only:
{
  "executive_summary": "brief explanation",
  "primary_cause": "cause", 
  "detailed_reasoning": "explanation"
}"""

        response = service.client.messages.create(
            model=service.model,
            max_tokens=800,
            temperature=0.2,
            messages=[{'role': 'user', 'content': prompt}]
        )
        
        content = response.content[0].text
        print('Raw response length:', len(content))
        print('Raw content:')
        print(repr(content))
        
        # Look for problematic characters
        problematic_chars = []
        for i, char in enumerate(content):
            if ord(char) < 32 and char not in '\n\t\r':
                problematic_chars.append((i, char, ord(char)))
        
        if problematic_chars:
            print('\nFound problematic characters:')
            for pos, char, code in problematic_chars[:10]:
                print(f'  Position {pos}: {repr(char)} (code {code})')
        else:
            print('No problematic control characters found')
            
        # Try parsing as-is
        try:
            result = json.loads(content)
            print('\nDirect JSON parsing successful!')
            print('Result:', result)
        except json.JSONDecodeError as e:
            print(f'\nDirect JSON parsing failed: {e}')
            if hasattr(e, 'pos'):
                error_pos = e.pos
                start = max(0, error_pos - 20)
                end = min(len(content), error_pos + 20)
                print(f'Context around error at position {error_pos}:')
                print(repr(content[start:end]))
        
    except Exception as e:
        print('Error:', e)
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(debug_claude())