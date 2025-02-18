from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import requests
import os

load_dotenv()

class DefinitionRequest(BaseModel):
    user_def: str
    valid_defs: list[str]

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://kotoba-tag.com/", "https://kotoba-tag-app.onrender.com/"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

@app.post("/definition")
def get_prediction(req: DefinitionRequest):
    response = requests.post(
        "https://api-inference.huggingface.co/pipeline/sentence-similarity/nphach/jp-parallel-gloss",
        headers = {
            "Authorization": f"Bearer {os.getenv('HUGGINGFACE_TOKEN')}"
        },
        json = {
            "inputs": {
                "source_sentence": req.user_def,
                "sentences": req.valid_defs
            }
        }
    )

    return {"predictions": response.json()}

@app.get("/tag-word")
def get_jisho(req: str):
    response = requests.get(f"https://jisho.org/api/v1/search/words?keyword={req}")
    return {"jisho": response.json()}