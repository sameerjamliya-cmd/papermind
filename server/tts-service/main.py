"""
Kokoro-82M TTS Microservice for Papermind Audio Overview.
Local: conda run -n kokoro-tts python main.py (defaults to port 8001)
Deployed (e.g. Cloud Run): reads PORT from the environment and binds 0.0.0.0.
"""

import os
from kokoro import KPipeline
from fastapi import FastAPI, Query, Response, HTTPException, Header
import soundfile as sf
import io
import numpy as np

app = FastAPI(title="Papermind TTS", version="1.0.0")

# When set, /tts requires a matching X-API-Key header. Leave unset for local
# dev; always set it for any publicly reachable deployment (e.g. Cloud Run),
# since this service has no other access control.
TTS_API_KEY = os.environ.get("TTS_API_KEY")

print("[kokoro-tts] Loading Kokoro-82M pipeline...")
pipeline = KPipeline(lang_code="a")
print("[kokoro-tts] Pipeline loaded. Ready.")


@app.post("/tts")
async def text_to_speech(
    text: str = Query(..., min_length=1, max_length=4096),
    voice: str = Query(default="af_heart"),
    speed: float = Query(default=1.0, ge=0.5, le=2.0),
    x_api_key: str | None = Header(default=None),
):
    if TTS_API_KEY and x_api_key != TTS_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")
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

    port = int(os.environ.get("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
