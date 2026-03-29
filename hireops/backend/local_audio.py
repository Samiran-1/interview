import asyncio
import io
import json
from typing import AsyncIterator, Iterable, List

import edge_tts
import numpy as np
from faster_whisper import WhisperModel
from livekit import rtc
from livekit.agents import stt, tts


class LocalSTT(stt.STT):
    def __init__(self, model_name: str = "base.en", compute_type: str = "int8") -> None:
        self.model = WhisperModel(model_name, compute_type=compute_type)
        self.sample_rate = 16000
        self._frame_buffer: List[bytes] = []
        self._lock = asyncio.Lock()

    async def transcribe(self, frames: AsyncIterator[rtc.AudioFrame]) -> AsyncIterator[str]:
        async for frame in frames:
            async with self._lock:
                self._frame_buffer.append(frame.data)

            # when VAD indicates the speech segment completed (silence frame)
            if frame.speech < 0.5:
                async with self._lock:
                    if not self._frame_buffer:
                        continue
                    buffer = b"".join(self._frame_buffer)
                    self._frame_buffer.clear()

                text = await asyncio.to_thread(self._run_whisper, buffer)
                if text:
                    yield text
        if self._frame_buffer:
            buffer = b"".join(self._frame_buffer)
            self._frame_buffer.clear()
            text = await asyncio.to_thread(self._run_whisper, buffer)
            if text:
                yield text

    def _run_whisper(self, pcm_bytes: bytes) -> str:
        if not pcm_bytes:
            return ""
        audio = np.frombuffer(pcm_bytes, dtype=np.int16).astype(np.float32) / 32768.0
        audio = audio.reshape(-1, 1)
        segments, _ = self.model.transcribe(audio, beam_size=1, vad_filter=False)
        return " ".join(seg.text.strip() for seg in segments if seg.text)


class LocalTTS(tts.TTS):
    def __init__(self, voice: str = "en-US-AriaNeural") -> None:
        self.voice = voice
        self._loop = asyncio.get_event_loop()

    async def synthesize(self, text: str) -> AsyncIterator[rtc.AudioFrame]:
        communicator = edge_tts.Communicate(text, self.voice)
        stream = await communicator._get_stream()
        buffer = bytearray()

        async for chunk in stream:
            payload = chunk[1]
            if payload:
                buffer.extend(payload)
        pcm_bytes = await asyncio.to_thread(self._decode_to_pcm, bytes(buffer))
        yield rtc.AudioFrame(data=pcm_bytes, sample_rate=16000, channels=1)

    def _decode_to_pcm(self, mp3_bytes: bytes) -> bytes:
        # Requires ffmpeg/avconv to be installed on the system
        from subprocess import Popen, PIPE

        command = [
            "ffmpeg",
            "-hide_banner",
            "-loglevel",
            "error",
            "-f",
            "mp3",
            "-i",
            "pipe:0",
            "-ar",
            "16000",
            "-ac",
            "1",
            "-f",
            "s16le",
            "pipe:1",
        ]
        process = Popen(command, stdin=PIPE, stdout=PIPE, stderr=PIPE)
        stdout, stderr = process.communicate(mp3_bytes)
        if process.returncode != 0:
            raise RuntimeError(f"ffmpeg failed to decode edge-tts output: {stderr.decode('utf-8', errors='replace')}")
        return stdout
