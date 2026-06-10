from contextlib import asynccontextmanager
import asyncio
import os

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

HF_SIMILARITY_URL = (
    "https://ldiy92o4l2nrl435.us-east-1.aws.endpoints.huggingface.cloud/similarity"
)
WARMUP_PAYLOAD = {
    "inputs": {
        "source_sentence": "warmup",
        "sentences": ["warmup"],
    }
}


class DefinitionRequest(BaseModel):
    user_def: str
    valid_defs: list[str]


def get_hf_token() -> str:
    token = os.environ.get("HUGGINGFACE_TOKEN")
    if not token:
        raise HTTPException(status_code=500, detail="missing HuggingFace credentials")
    return token


async def call_hf_similarity(source_sentence: str, sentences: list[str]) -> list:
    async with httpx.AsyncClient(timeout=90.0) as client:
        response = await client.post(
            HF_SIMILARITY_URL,
            headers={
                "Authorization": f"Bearer {get_hf_token()}",
                "Content-Type": "application/json",
            },
            json={
                "inputs": {
                    "source_sentence": source_sentence,
                    "sentences": sentences,
                }
            },
        )

        if response.status_code == 503:
            raise HTTPException(status_code=503, detail="model loading")

        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=response.text,
            )

        return response.json()


async def warmup_huggingface() -> None:
    try:
        await call_hf_similarity("warmup", ["warmup"])
    except HTTPException as error:
        if error.status_code != 503:
            raise


@asynccontextmanager
async def lifespan(app: FastAPI):
    asyncio.create_task(warmup_huggingface())
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://kotoba-tag.com",
        "https://www.kotoba-tag.com",
        "https://kotoba-tag-app.onrender.com",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/warmup")
async def warmup():
    await call_hf_similarity("warmup", ["warmup"])
    return {"status": "ready"}


@app.post("/definition")
async def get_prediction(req: DefinitionRequest):
    predictions = await call_hf_similarity(req.user_def, req.valid_defs)
    return {"predictions": predictions}


@app.get("/tag-word")
async def get_jisho(req: str):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://jisho.org/api/v1/search/words?keyword={req}"
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as error:
        raise HTTPException(
            status_code=error.response.status_code,
            detail="failed to fetch from Jisho",
        ) from error
