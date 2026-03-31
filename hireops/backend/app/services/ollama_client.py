"""
OpenRouter LLM Client — API communication with OpenRouter for resume parsing.

Handles HTTP requests to OpenRouter API for LLM-based text extraction.
"""

import httpx
import json
import logging
import os
from typing import Optional

logger = logging.getLogger(__name__)

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini")
OPENROUTER_TIMEOUT = 240.0


async def call_openrouter(prompt: str, model: str = OPENROUTER_MODEL, response_format: str = "json") -> Optional[str]:
    """
    Call OpenRouter API with a given prompt.
    
    Args:
        prompt: The complete prompt to send to OpenRouter
        model: The model name to use (default: openai/gpt-4o-mini)
        response_format: The format of the response (default: json)

    Returns:
        Response text from OpenRouter, or None if request fails
        
    Raises:
        httpx.ConnectError: If OpenRouter is unreachable
        httpx.TimeoutException: If request exceeds timeout
    """
    if not OPENROUTER_API_KEY:
        logger.error("[OpenRouter] API key not configured. Set OPENROUTER_API_KEY environment variable.")
        raise RuntimeError("OPENROUTER_API_KEY not configured")
    
    try:
        logger.info(f"[OpenRouter] Calling model: {model}")
        
        # Build request payload
        payload = {
            "model": model,
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.0,  # Deterministic: 0 = no randomness
        }
        
        # Add response_format if specified
        if response_format:
            if response_format == "json":
                payload["response_format"] = {"type": "json"}
            elif response_format == "json_object":
                payload["response_format"] = {"type": "json_object"}
            else:
                # Default to text
                pass
        
        # Required headers for OpenRouter
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "hireops.local",  # Required by OpenRouter
            "X-Title": "HireOps",  # Optional but recommended
        }
        
        logger.debug(f"[OpenRouter] Request payload: {json.dumps({k: v for k, v in payload.items() if k != 'messages'}, indent=2)}")
        
        async with httpx.AsyncClient(timeout=OPENROUTER_TIMEOUT) as client:
            response = await client.post(
                f"{OPENROUTER_BASE_URL}/chat/completions",
                headers=headers,
                json=payload,
                timeout=OPENROUTER_TIMEOUT
            )
            
            # Log response status and headers for debugging
            logger.debug(f"[OpenRouter] Response status: {response.status_code}")
            
            # Try to get error details if status is not 2xx
            if response.status_code >= 400:
                try:
                    error_data = response.json()
                    logger.error(f"[OpenRouter] Error response: {json.dumps(error_data, indent=2)}")
                except:
                    logger.error(f"[OpenRouter] Error response text: {response.text}")
            
            response.raise_for_status()
            response_data = response.json()
            
            # Check for error in response
            if "error" in response_data:
                logger.error(f"[OpenRouter] Error in response: {response_data.get('error')}")
                return None
            
            # Extract content from OpenAI-format response
            if "choices" in response_data and len(response_data["choices"]) > 0:
                result = response_data["choices"][0].get("message", {}).get("content", "").strip()
                
                if result:
                    logger.info(f"[OpenRouter] Success: {result[:100]}...")
                    return result
                else:
                    logger.error(f"[OpenRouter] No content in response. Full response: {response_data}")
                    return None
            else:
                logger.error(f"[OpenRouter] Unexpected response structure: {response_data}")
                return None
            
    except httpx.HTTPStatusError as e:
        logger.error(f"[OpenRouter] HTTP error {e.response.status_code}: {e}")
        raise
    except httpx.ConnectError as e:
        logger.warning(f"[OpenRouter] Server not reachable: {str(e)}")
        raise
    except httpx.TimeoutException as e:
        logger.warning(f"[OpenRouter] Request timed out after {OPENROUTER_TIMEOUT}s: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"[OpenRouter] Unexpected error: {type(e).__name__}: {str(e)}")
        raise


# Keep old function name for backward compatibility
async def call_ollama(prompt: str, model: str = OPENROUTER_MODEL, response_format: str = "json") -> Optional[str]:
    """
    Legacy wrapper that calls OpenRouter instead of Ollama.
    Maintained for backward compatibility.
    """
    return await call_openrouter(prompt, model, response_format)


def is_openrouter_available() -> bool:
    """
    Check if OpenRouter API key is configured.
    
    Returns:
        True if OPENROUTER_API_KEY is set, False otherwise
    """
    return bool(OPENROUTER_API_KEY)
