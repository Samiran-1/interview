import asyncio
import uuid
from subprocess import PIPE, Popen
from typing import Optional

import edge_tts
import numpy as np
from faster_whisper import WhisperModel
from livekit import rtc
from livekit.agents import stt, tts


TARGET_SAMPLE_RATE = 16000
TARGET_CHANNELS = 1
PCM_SAMPLE_WIDTH = 2
TTS_CHUNK_MS = 20


class LocalSTT(stt.STT):
    def __init__(
        self,
        model: Optional[WhisperModel] = None,
        model_name: str = "base.en",
        compute_type: str = "int8",
    ) -> None:
        super().__init__(
            capabilities=stt.STTCapabilities(streaming=False, interim_results=False)
        )
        self.model = model or WhisperModel(model_name, compute_type=compute_type)

    async def _recognize_impl(
        self,
        buffer,
        *,
        language: str | None,
        conn_options,
    ) -> stt.SpeechEvent:
        frame = rtc.combine_audio_frames(buffer)
        text = await asyncio.to_thread(self._run_whisper, frame)

        speech = stt.SpeechData(
            language=language or "en",
            text=text,
            end_time=frame.samples_per_channel / frame.sample_rate if frame.sample_rate else 0.0,
        )
        return stt.SpeechEvent(
            type=stt.SpeechEventType.FINAL_TRANSCRIPT,
            request_id=uuid.uuid4().hex,
            alternatives=[speech],
        )

    def _run_whisper(self, frame: rtc.AudioFrame) -> str:
        if not frame.data:
            return ""

        pcm = np.frombuffer(frame.data, dtype=np.int16)
        if frame.num_channels > 1:
            pcm = pcm.reshape(-1, frame.num_channels).mean(axis=1)
        else:
            pcm = pcm.astype(np.float32)

        if frame.sample_rate != TARGET_SAMPLE_RATE and len(pcm) > 0:
            source_index = np.linspace(0, len(pcm) - 1, num=len(pcm), dtype=np.float32)
            target_length = max(1, int(len(pcm) * TARGET_SAMPLE_RATE / frame.sample_rate))
            target_index = np.linspace(0, len(pcm) - 1, num=target_length, dtype=np.float32)
            pcm = np.interp(target_index, source_index, pcm)

        audio = np.asarray(pcm, dtype=np.float32) / 32768.0
        segments, _ = self.model.transcribe(audio, beam_size=1, vad_filter=False)
        return " ".join(seg.text.strip() for seg in segments if seg.text).strip()


class LocalTTSChunkedStream(tts.ChunkedStream):
    def __init__(self, *, tts_instance: "LocalTTS", input_text: str, conn_options=None) -> None:
        super().__init__(tts=tts_instance, input_text=input_text, conn_options=conn_options)
        self._tts_instance = tts_instance

    async def _run(self) -> None:
        communicator = edge_tts.Communicate(self.input_text, self._tts_instance.voice)
        mp3_buffer = bytearray()

        async for chunk in communicator.stream():
            if chunk.get("type") == "audio":
                mp3_buffer.extend(chunk["data"])

        pcm_bytes = await asyncio.to_thread(self._tts_instance._decode_to_pcm, bytes(mp3_buffer))
        request_id = uuid.uuid4().hex
        bytes_per_chunk = int(
            TARGET_SAMPLE_RATE
            * TARGET_CHANNELS
            * PCM_SAMPLE_WIDTH
            * (TTS_CHUNK_MS / 1000)
        )

        for offset in range(0, len(pcm_bytes), bytes_per_chunk):
            chunk = pcm_bytes[offset : offset + bytes_per_chunk]
            if not chunk:
                continue

            samples_per_channel = len(chunk) // (PCM_SAMPLE_WIDTH * TARGET_CHANNELS)
            frame = rtc.AudioFrame(
                data=chunk,
                sample_rate=TARGET_SAMPLE_RATE,
                num_channels=TARGET_CHANNELS,
                samples_per_channel=samples_per_channel,
            )
            await self._event_ch.send(
                tts.SynthesizedAudio(
                    frame=frame,
                    request_id=request_id,
                    is_final=offset + bytes_per_chunk >= len(pcm_bytes),
                )
            )


class LocalTTS(tts.TTS):
    def __init__(self, voice: str = "en-US-AriaNeural") -> None:
        super().__init__(
            capabilities=tts.TTSCapabilities(streaming=False),
            sample_rate=TARGET_SAMPLE_RATE,
            num_channels=TARGET_CHANNELS,
        )
        self.voice = voice

    def synthesize(self, text: str, *, conn_options=None) -> LocalTTSChunkedStream:
        return LocalTTSChunkedStream(
            tts_instance=self,
            input_text=text,
            conn_options=conn_options,
        )

    def _decode_to_pcm(self, mp3_bytes: bytes) -> bytes:
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
            str(TARGET_SAMPLE_RATE),
            "-ac",
            str(TARGET_CHANNELS),
            "-f",
            "s16le",
            "pipe:1",
        ]
        process = Popen(command, stdin=PIPE, stdout=PIPE, stderr=PIPE)
        stdout, stderr = process.communicate(mp3_bytes)
        if process.returncode != 0:
            raise RuntimeError(
                f"ffmpeg failed to decode edge-tts output: {stderr.decode('utf-8', errors='replace')}"
            )
        return stdout
