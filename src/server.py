from contextlib import asynccontextmanager
import asyncio
import logging
import os
from pathlib import Path

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env")

logger = logging.getLogger(__name__)

HF_SIMILARITY_URL = os.environ.get("HF_SIMILARITY_URL")


def validate_config() -> None:
    missing = [
        name
        for name, value in (
            ("HUGGINGFACE_TOKEN", os.environ.get("HUGGINGFACE_TOKEN")),
            ("HF_SIMILARITY_URL", HF_SIMILARITY_URL),
        )
        if not value
    ]
    if missing:
        joined = ", ".join(missing)
        raise RuntimeError(
            f"Missing required environment variables: {joined}. "
            "Copy .env.example to .env and set them before starting the server."
        )

HF_PERMISSION_HINT = (
    "the definition model isn't available right now — please try again later"
)

MODEL_STARTING_MESSAGE = (
    "the definition model is still starting up — try again in a moment"
)

MODEL_UNREACHABLE_MESSAGE = (
    "couldn't reach the definition model — try again in a moment"
)

PRODUCTION_CORS_ORIGINS = [
    "https://kotoba-tag.com",
    "https://www.kotoba-tag.com",
    "https://kotoba-tag-app.onrender.com",
]

LOCAL_DEV_ORIGIN_REGEX = r"https?://(localhost|127\.0\.0\.1)(:\d+)?$"


def allow_localhost_cors() -> bool:
    flag = os.environ.get("ALLOW_LOCALHOST_CORS", "").lower()
    if flag in {"1", "true", "yes"}:
        return True
    if flag in {"0", "false", "no"}:
        return False
    return not os.environ.get("RENDER")


def cors_middleware_kwargs() -> dict:
    if allow_localhost_cors():
        return {
            "allow_origins": PRODUCTION_CORS_ORIGINS,
            "allow_origin_regex": LOCAL_DEV_ORIGIN_REGEX,
        }
    return {"allow_origins": PRODUCTION_CORS_ORIGINS}


class DefinitionRequest(BaseModel):
    user_def: str
    valid_defs: list[str]


def get_hf_token() -> str:
    token = os.environ.get("HUGGINGFACE_TOKEN")
    if not token:
        raise HTTPException(status_code=500, detail="server configuration error")
    return token


def hf_error_detail(status_code: int, response_text: str) -> str:
    if status_code == 503:
        return MODEL_STARTING_MESSAGE
    if status_code == 403:
        return HF_PERMISSION_HINT
    if status_code in {502, 504}:
        return MODEL_UNREACHABLE_MESSAGE
    if status_code >= 500:
        return "the definition model had a problem — please try again later"
    return "definition check failed — please try again"


async def call_hf_similarity(source_sentence: str, sentences: list[str]) -> list:
    try:
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
    except httpx.RequestError as error:
        logger.warning("HuggingFace request failed: %s", error)
        raise HTTPException(
            status_code=503,
            detail=MODEL_UNREACHABLE_MESSAGE,
        ) from error

    if response.status_code == 503:
        raise HTTPException(status_code=503, detail=MODEL_STARTING_MESSAGE)

    if response.status_code == 403:
        raise HTTPException(status_code=403, detail=HF_PERMISSION_HINT)

    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail=hf_error_detail(response.status_code, response.text),
        )

    return response.json()


async def warmup_huggingface() -> None:
    if os.environ.get("SKIP_HF_WARMUP", "").lower() in {"1", "true", "yes"}:
        return

    try:
        await call_hf_similarity("warmup", ["warmup"])
    except HTTPException as error:
        if error.status_code == 503:
            return
        logger.warning("HuggingFace warmup failed (%s): %s", error.status_code, error.detail)


@asynccontextmanager
async def lifespan(app: FastAPI):
    validate_config()
    if os.environ.get("SKIP_HF_WARMUP", "").lower() not in {"1", "true", "yes"}:
        asyncio.create_task(warmup_huggingface())
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    **cors_middleware_kwargs(),
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
            detail="dictionary lookup failed — try again",
        ) from error
    except httpx.RequestError as error:
        raise HTTPException(
            status_code=503,
            detail="couldn't reach the dictionary — check your connection and try again",
        ) from error
