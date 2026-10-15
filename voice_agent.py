"""Speech-to-speech voice agent using Gemini Live.

Gemini Live consumes user audio and emits agent audio directly. There is no
separate STT or TTS stage - just configure `VoiceAgent` with `llm=` only.

Requirements:
    pip install "piopiy-ai[google,silero]"

Environment variables:
    AGENT_ID, AGENT_TOKEN
    GOOGLE_API_KEY
    VOICE_AGENT_ENABLED=1
    VOICE_AGENT_MODEL=models/gemini-2.0-flash-exp
    VOICE_AGENT_GREETING=Hi there! This is Gemini Live. How can I help you today?
"""

import asyncio
import os

from dotenv import load_dotenv

from piopiy.agent import Agent
from piopiy.services.google.gemini_live.llm import (
    GeminiLiveLLMService,
    GeminiModalities,
    InputParams,
)
from piopiy.voice_agent import VoiceAgent

load_dotenv()

DEFAULT_AGENT_ID = "id-test-101"
DEFAULT_AGENT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmdfaWQiOiJjMzkyYTE5MS01OGZiLTRhOWUtOWZlMS1jNDIyYThkYjAyMzQiLCJlbWFpbF9pZCI6ImtoYW5mYXJlZXowMDdAZ21haWwuY29tIiwiaWF0IjoxNzgwNzM0MjAwfQ.LtiTaE7NoxqZMD6ZkOWixTAVfAHKYMPaRNn5q7f_iIA"
DEFAULT_GOOGLE_API_KEY = "AIzaSyBU7cHDJBWjfFqOpY6-lYlPqpvs21GjJsk"


def env_bool(name: str, default: bool = True) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() not in {"0", "false", "no", "off"}


async def create_session(agent_id, call_id, from_number, to_number, metadata=None, **_):
    print(f"📞 Incoming call: {from_number} → {to_number}")
    print(f"🆔 Call ID: {call_id}")

    if not env_bool("VOICE_AGENT_ENABLED", True):
        print("⏸️  Voice agent disabled by VOICE_AGENT_ENABLED")
        return

    google_api_key = os.getenv("GOOGLE_API_KEY", DEFAULT_GOOGLE_API_KEY)
    if not google_api_key:
        raise RuntimeError("GOOGLE_API_KEY is not set")

    # Realtime multimodal model. Documentation:
    # https://ai.google.dev/gemini-api/docs/multimodal-live
    gemini_live = GeminiLiveLLMService(
        api_key=google_api_key,
        model=os.getenv("VOICE_AGENT_MODEL", "models/gemini-2.0-flash-exp"),
        params=InputParams(
            modalities=GeminiModalities.AUDIO,
            temperature=float(os.getenv("VOICE_AGENT_TEMPERATURE", "0.7")),
            system_instruction=(
                os.getenv(
                    "VOICE_AGENT_INSTRUCTIONS",
                    "You are a helpful and energetic voice assistant. "
                    "Keep your responses concise and conversational.",
                )
            ),
        ),
    )

    voice_agent = VoiceAgent(
        instructions=os.getenv(
            "VOICE_AGENT_AGENT_INSTRUCTIONS",
            "You are a professional assistant.",
        ),
        greeting=os.getenv(
            "VOICE_AGENT_GREETING",
            "Hi there! This is Gemini Live. How can I help you today?",
        ),
    )

    # No `stt`, no `tts` - Gemini Live owns audio in and audio out.
    await voice_agent.configure(
        llm=gemini_live,
        allow_interruptions=True,
    )

    print("🎙️  Agent ready and listening...")
    await voice_agent.start()
    print(f"🏁 Session ended: {call_id}")


async def main():
    agent_id = os.getenv("AGENT_ID", DEFAULT_AGENT_ID)
    agent_token = os.getenv("AGENT_TOKEN", DEFAULT_AGENT_TOKEN)
    google_api_key = os.getenv("GOOGLE_API_KEY", DEFAULT_GOOGLE_API_KEY)

    missing = [
        name
        for name, value in (
            ("AGENT_ID", agent_id),
            ("AGENT_TOKEN", agent_token),
            ("GOOGLE_API_KEY", google_api_key),
        )
        if not value
    ]
    if missing:
        print(f"❌ Missing environment variables: {', '.join(missing)}")
        return

    agent = Agent(
        agent_id=agent_id,
        agent_token=agent_token,
        create_session=create_session,
        debug=True,
    )

    print("🚀 Gemini Live voice agent")
    print("   Waiting for incoming calls...")

    try:
        await agent.connect()
    except KeyboardInterrupt:
        await agent.shutdown()


if __name__ == "__main__":
    asyncio.run(main())
