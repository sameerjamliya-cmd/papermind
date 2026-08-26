"""
Kokoro-82M TTS Microservice for Papermind Audio Overview.
Run: conda run -n kokoro-tts python main.py (defaults to port 8001)
"""

from kokoro import KPipeline
from fastapi import FastAPI, Query, Response, HTTPException
import soundfile as sf
import io
import numpy as np

app = FastAPI(title="Papermind TTS", version="1.0.0")

print("[kokoro-tts] Loading Kokoro-82M pipeline...")
pipeline = KPipeline(lang_code="a")
print("[kokoro-tts] Pipeline loaded. Ready on :8001")


@app.post("/tts")
async def text_to_speech(
    text: str = Query(..., min_length=1, max_length=4096),
    voice: str = Query(default="af_heart"),
    speed: float = Query(default=1.0, ge=0.5, le=2.0),
):
    try:
        generator = pipeline(text, voice=voice, speed=speed)
        for _, _, audio in generator:
            import torch
            if isinstance(audio, torch.Tensor):
                audio = audio.cpu().numpy()
            if audio.dtype != np.float32:
                audio = audio.astype(np.float32)
            buf = io.BytesIO()
            sf.write(buf, audio, 24000, format="WAV")
            return Response(
                content=buf.getvalue(),
                media_type="audio/wav",
                headers={"X-Audio-Duration": str(len(audio) / 24000)},
            )
        raise HTTPException(status_code=500, detail="No audio generated")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid voice: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    return {"status": "ok", "model": "Kokoro-82M"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8001)
