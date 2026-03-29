import asyncio
import json
import os
from typing import Dict, Any

from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli, rtc
from livekit.agents.llm import ChatContext
from livekit.agents.pipeline import VoicePipelineAgent
from livekit.plugins import openai

from local_audio import LocalSTT, LocalTTS

async def entrypoint(ctx: JobContext) -> None:
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    # Wait for the candidate to join so we can read their metadata
    while not ctx.room.remote_participants:
        await asyncio.sleep(0.5)

    participant = next(iter(ctx.room.remote_participants.values()))
    metadata: Dict[str, Any] = {}
    if participant.metadata:
        try:
            metadata = json.loads(participant.metadata)
        except json.JSONDecodeError:
            metadata = {}

    candidate_name = metadata.get("candidate_name", "Candidate")
    job_title = metadata.get("job_title", "Open Role")
    job_skills = metadata.get("job_skills", [])
    resume_summary = metadata.get("resume_summary", "")
    recent_experience = metadata.get("recent_experience", [])

    if isinstance(job_skills, list):
        job_skills = ", ".join(job_skills)
    if isinstance(recent_experience, list):
        recent_experience = json.dumps(recent_experience)

    system_prompt = f"""
You are a friendly, professional technical recruiter for HireOps.
You are interviewing {candidate_name} for the position of {job_title}.

JOB REQUIREMENTS:
{job_skills}

CANDIDATE BACKGROUND:
Summary: {resume_summary}
Recent Work: {recent_experience}

YOUR INSTRUCTIONS:
1. Start by welcoming {candidate_name} by name to the interview for the {job_title} role.
2. Ask 3-4 technical questions based on how their background aligns with the job requirements.
3. Keep your responses concise (1-2 sentences). Do not give long monologues.
4. If they give a good answer, acknowledge it before moving to the next question.
"""

    chat_ctx = ChatContext().append(role="system", text=system_prompt)

    agent = VoicePipelineAgent(
        vad=ctx.proc.userdata["vad"],
        stt=LocalSTT(),
        llm=openai.LLM(
            model="meta-llama/llama-3.1-8b-instruct:free",
            base_url="https://openrouter.ai/api/v1",
            api_key=os.getenv("OPENROUTER_API_KEY"),
        ),
        tts=LocalTTS(),
        chat_ctx=chat_ctx,
    )

    agent.start(ctx.room)

    await agent.say(
        "Hello! I'm ready when you are.",
        allow_interruptions=True,
    )


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
