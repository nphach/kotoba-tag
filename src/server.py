from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import os
from dotenv import load_dotenv
# from contextlib import asynccontextmanager
# from sentence_transformers import SentenceTransformer

load_dotenv()

class DefinitionRequest(BaseModel):
    user_def: str
    valid_defs: list[str]

# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     global model
#     model = SentenceTransformer("nphach/jp-parallel-gloss", device="mps" if torch.backends.mps.is_available() else "cpu")
#     yield

app = FastAPI()
# app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://kotoba-tag.com", "https://kotoba-tag-app.onrender.com"],
    # allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.post("/definition")
def get_prediction(req: DefinitionRequest):
    response = requests.post(
        "https://api-inference.huggingface.co/pipeline/sentence-similarity/nphach/jp-parallel-gloss",
        headers = {
            # you can use your own HF token here
            "Authorization": f"Bearer {os.environ.get('HUGGINGFACE_TOKEN')}"
        },
        json = {
            "inputs": {
                "source_sentence": req.user_def,
                "sentences": req.valid_defs
            }
        }
    )
    data = response.json()
    if "estimated time" in data:
        raise HTTPException(status_code=500, detail="model loading, try again in 60 seconds!")

    return {"predictions": response.json()}

# @app.post("/definition")
# def get_prediction(req: DefinitionRequest):
#     embed1 = model.encode(req.user_def)
#     embed2 = model.encode(req.valid_defs)
#     res = model.similarity(embed1, embed2)

#     return {"predictions": res.numpy().flatten()}

@app.get("/tag-word")
def get_jisho(req: str):
    response = requests.get(f"https://jisho.org/api/v1/search/words?keyword={req}")
    return {"jisho": response.json()}