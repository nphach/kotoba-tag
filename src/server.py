from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

class DefinitionRequest(BaseModel):
    user_def: str
    valid_defs: list[str]

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://kotoba-tag.com", "https://kotoba-tag-app.onrender.com"],
    # allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.post("/definition")
async def get_prediction(req: DefinitionRequest):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api-inference.huggingface.co/pipeline/sentence-similarity/nphach/jp-parallel-gloss",
                headers = {
                    "Authorization": f"Bearer {os.environ.get('HUGGINGFACE_TOKEN')}"
                },
                json = {
                    "inputs": {
                        "source_sentence": req.user_def,
                        "sentences": req.valid_defs
                    }
                }
            )
            response.raise_for_status()
            return {"predictions": response.json()}
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 503:
            raise HTTPException(
                status_code=503,
                detail="model loading, try again in 60 seconds"
            )
        raise HTTPException(
            status_code=e.response.status_code,
            detail="failed to fetch from HuggingFace"
            )

@app.get("/tag-word")
async def get_jisho(req: str):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"https://jisho.org/api/v1/search/words?keyword={req}")
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=e.response.status_code,
            detail="failed to fetch from Jisho"
            )