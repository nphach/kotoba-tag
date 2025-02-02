from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from contextlib import asynccontextmanager
from sentence_transformers import CrossEncoder
from torch.nn import Sigmoid
import numpy as np
import httpx
import sys
import pkg_resources

class AnalyzeRequest(BaseModel):
    user_def: str
    valid_defs: list[str]

model = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global model
    print("loading model...")
    model = CrossEncoder("nphach/jp-parallel-gloss", default_activation_function=Sigmoid())
    print("model loaded!")
    yield

app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://kotoba-tag-app.onrender.com", "https://kotoba-tag.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/analyze")
def verify_def(request: AnalyzeRequest):
    try:
        print(f"received request - user_def: {request.user_def}, valid_defs: {request.valid_defs}")
        if model is None:
            raise HTTPException(status_code=500, detail="model is not loaded")
        predictions = model.predict([[request.user_def, d] for d in request.valid_defs])
        print(predictions.tolist())
        return {"predictions": predictions.tolist()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/lookup")
async def jisho_proxy(tag: str):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"https://jisho.org/api/v1/search/words?keyword={tag}")
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail="Jisho API request failed")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/debug-env")
def debug_env():
    try:
        python_path = sys.path
        installed_packages = [pkg.key for pkg in pkg_resources.working_set]
        return {
            "python_path": python_path,
            "installed_packages": installed_packages,
        }
    except Exception as e:
        return {"error": str(e)}
    
@app.get("/test-numpy")
def test_numpy():
    try:
        array = np.array([1, 2, 3])
        blas_info = np.__config__.get_info("blas_opt")
        lapack_info = np.__config__.get_info("lapack_opt")
        return {
            "message": "numpy is available",
            "array": array.tolist(),
            "blas_info": blas_info,
            "lapack_info": lapack_info,
        }
    except Exception as e:
        return {"error": str(e)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)