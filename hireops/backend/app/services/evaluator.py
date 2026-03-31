import json
import os
from typing import Any, Dict

from openai import AsyncOpenAI

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
_evaluator_client = (
    AsyncOpenAI(base_url="https://openrouter.ai/api/v1", api_key=OPENROUTER_API_KEY)
    if OPENROUTER_API_KEY
    else None
)

INTERVIEW_SYSTEM_PROMPT = """
You are an elite Senior Technical Hiring Manager. Your task is to evaluate a candidate based on a raw voice interview transcript between them and an AI Recruiter.

CRITICAL INSTRUCTIONS:
1. STT Forgiveness: This is a raw Speech-to-Text transcript. It will contain missing punctuation, filler words ("um", "uh"), interrupted sentences, and phonetic typos (e.g., "react js" instead of "React.js"). Ignore these artifacts and grade the substance and intent of the candidate's answers.
2. Technical Assessment: Evaluate the depth of their technical knowledge. Did they provide superficial buzzwords, or did they explain concepts clearly?
3. Communication Assessment: Evaluate their ability to articulate complex ideas logically, keeping in mind that spoken answers are naturally less structured than written text.
4. Strict JSON Output: You must output ONLY a valid JSON object. Do not include markdown formatting like ```json or any conversational text before or after the object.

JSON SCHEMA:
{
    "technical_score": integer (0-100),
    "communication_score": integer (0-100),
    "strengths": [array of 2-3 specific technical or soft skill strengths demonstrated],
    "weaknesses": [array of 1-2 areas where they struggled or lacked depth],
    "hire_recommendation": "Strong Hire" | "Hire" | "No Hire",
    "summary": "A concise, objective 2-3 sentence summary of their overall performance."
}
"""

CODING_SYSTEM_PROMPT = """
You are an elite, fair-minded Senior Engineering Interviewer evaluating a candidate's code.
Your goal is to assess if the candidate's logic solves the core algorithmic problem.

CRITICAL GRADING RULES:
1. Core Logic First: If the algorithmic approach is correct and solves the primary problem, it is a "Pass". Do NOT penalize the candidate for missing input validation unless it is explicitly required.
2. Ignore Formatting: Focus purely on algorithmic correctness; do not penalize for missing type hints, extra print statements, or minor syntax quirks.
3. Explicit Grading Scale:
   - "Pass": Logic is fundamentally correct for standard inputs. (Score: 85-100)
   - "Partial": Approach is promising but contains a minor bug, misses an obvious edge case, or is inefficient when an obvious improvement exists. (Score: 50-84)
   - "Fail": Logic is broken, infinite looping, or fundamentally misunderstands the problem. (Score: 0-49)
4. Output STRICTLY in valid JSON format. Do not wrap the response in markdown blocks like ```json.

JSON SCHEMA:
{
  "execution_status": "Pass" | "Partial" | "Fail",
  "overall_score": integer (0-100),
  "time_complexity": "string (e.g., O(N))",
  "space_complexity": "string (e.g., O(1))",
  "constructive_feedback": "2-3 sentences highlighting what works, and suggesting any optimizations.",
  "missed_edge_cases": ["List ONLY realistic algorithmic edge cases", "Leave empty if the code is solid"],
  "hire_recommendation": "Strong Hire" | "Hire" | "No Hire"
}
"""


async def _call_openrouter(system_prompt: str, user_prompt: str) -> Dict[str, Any]:
    if not _evaluator_client:
        raise RuntimeError("OpenRouter credentials are not configured for the evaluator.")

    response = await _evaluator_client.chat.completions.create(
        model="openai/gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        response_format={"type": "json_object"},
    )

    raw_content = response.choices[0].message.content
    try:
        return json.loads(raw_content)
    except json.JSONDecodeError:
        raise RuntimeError("OpenRouter returned invalid JSON for the evaluation payload.")


async def generate_interview_scorecard(transcript: str, job_title: str, job_description: str) -> Dict[str, Any]:
    prompt = (
        "Use the job description and the transcript below to evaluate the candidate. "
        f"Job description: {job_description}\n"
        f"Transcript:\n{transcript}\n"
        "Focus on the substance of the answers and the candidate's ability to communicate technical ideas clearly."
    )

    return await _call_openrouter(INTERVIEW_SYSTEM_PROMPT, prompt)


async def generate_coding_scorecard(
    code: str,
    language: str,
    problem_title: str,
    problem_description: str,
) -> Dict[str, Any]:
    prompt = f"""
PROBLEM TITLE: {problem_title}
PROBLEM DESCRIPTION: {problem_description}
LANGUAGE USED: {language}

CANDIDATE CODE:
{code}
"""

    return await _call_openrouter(CODING_SYSTEM_PROMPT, prompt)
