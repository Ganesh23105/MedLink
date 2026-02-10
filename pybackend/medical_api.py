import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
# Import necessary libraries
from fastapi import FastAPI, HTTPException
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, validator
import tensorflow as tf
from tensorflow.keras.models import load_model
import numpy as np
import base64
import io
from PIL import Image
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------------- APP ----------------

app = FastAPI(
    title="Medical Multi-Model Image Analysis API",
    version="2.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- REQUEST ----------------

class AnalyzeRequest(BaseModel):
    task: str
    image: str
    
    @validator('task')
    def validate_task(cls, v):
        """Validate that task is one of the supported tasks."""
        valid_tasks = ["brain_tumor", "breast_cancer", "diabetic_retinopathy", "skin_cancer"]
        if v.lower() not in valid_tasks:
            raise ValueError(f"Task must be one of {valid_tasks}")
        return v.lower()
    
    @validator('image')
    def validate_image(cls, v):
        """Validate that image is not empty."""
        if not v or len(v.strip()) == 0:
            raise ValueError("Image data cannot be empty")
        return v

# ---------------- MODEL CONFIG ----------------

MODEL_CONFIG = {
    "brain_tumor": {
        "path": "image_models/brain_tumor_mri_model.h5",
        "classes": ["Glioma", "Meningioma", "Pituitary Tumor", "No Tumor"],
        "type": "softmax"
    },
    "breast_cancer": {
        "path": "image_models/breast_histopathology_model.h5",
        "classes": ["Benign", "Malignant"],
        "type": "softmax"
    },
    "diabetic_retinopathy": {
        "path": "image_models/diabetic_retinopathy_cnn.h5",
        "classes": ["No_DR", "Mild", "Moderate", "Severe", "Proliferative_DR"],
        "type": "softmax"
    },
    "skin_cancer": {
        "path": "image_models/skin_cancer_model.h5",
        "classes": ["Benign", "Malignant"],
        "type": "softmax"
    }
}

MODELS = {}

# ---------------- LOAD MODELS ----------------

MODELS_LOADED = []

for task, cfg in MODEL_CONFIG.items():
    try:
        if os.path.exists(cfg["path"]):
            MODELS[task] = load_model(cfg["path"], compile=False)
            MODELS_LOADED.append(task)
            logger.info(f"✓ Loaded model: {task} from {cfg['path']}")
        else:
            logger.warning(f"✗ Model file not found: {cfg['path']}")
    except Exception as e:
        logger.error(f"✗ Failed to load model {task}: {str(e)}")

if not MODELS_LOADED:
    logger.warning("⚠ WARNING: No models were loaded successfully!")

# ---------------- UTILS ----------------

def decode_base64_image(data: str) -> Image.Image:
    """Decode base64 image data into PIL Image object."""
    try:
        if data.startswith("data:image"):
            data = data.split(",")[1]
        img_bytes = base64.b64decode(data)
        image = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        logger.info(f"✓ Image decoded successfully: {image.size}")
        return image
    except Exception as e:
        logger.error(f"✗ Failed to decode image: {str(e)}")
        raise ValueError(f"Invalid image data: {str(e)}")

def preprocess(image: Image.Image, model):
    """Preprocess image for model inference."""
    try:
        _, h, w, _ = model.input_shape
        image = image.resize((w, h))
        arr = np.array(image) / 255.0
        logger.info(f"✓ Image preprocessed: {arr.shape}")
        return np.expand_dims(arr, axis=0)
    except Exception as e:
        logger.error(f"✗ Preprocessing failed: {str(e)}")
        raise ValueError(f"Image preprocessing error: {str(e)}")

# ---------------- API ----------------

@app.post("/analyze")
async def analyze(request: AnalyzeRequest):
    """
    Analyze medical image for disease detection.
    
    Args:
        request: AnalyzeRequest with task name and base64 image
        
    Returns:
        JSON with prediction, confidence, and all probabilities
    """
    try:
        task = request.task.lower()
        
        # Check if model is loaded
        if task not in MODELS:
            available_models = list(MODELS.keys())
            logger.warning(f"Requested task '{task}' not in loaded models: {available_models}")
            raise HTTPException(
                status_code=400,
                detail=f"Invalid task '{task}'. Supported: {available_models}"
            )
        
        logger.info(f"Processing analysis request for task: {task}")
        
        model = MODELS[task]
        cfg = MODEL_CONFIG[task]
        
        # Decode and preprocess image
        image = decode_base64_image(request.image)
        input_tensor = preprocess(image, model)
        
        # Run prediction
        logger.info(f"Running inference on {cfg['path']}")
        preds = model.predict(input_tensor)[0]
        
        # Process results based on output type
        if cfg["type"] == "sigmoid":
            confidence = float(preds[0])
            label = cfg["classes"][1] if confidence >= 0.5 else cfg["classes"][0]
            all_probs = {
                cfg["classes"][0]: float(1 - confidence),
                cfg["classes"][1]: confidence
            }
        else:  # softmax
            idx = int(np.argmax(preds))
            confidence = float(preds[idx])
            label = cfg["classes"][idx]
            all_probs = {
                cfg["classes"][i]: float(preds[i])
                for i in range(len(cfg["classes"]))
            }
        
        logger.info(f"✓ Analysis complete. Prediction: {label} ({confidence:.4f})")
        
        return JSONResponse(
            content={
                "task": task,
                "prediction": label,
                "confidence": round(confidence, 4),
                "all_probabilities": all_probs,
                "model_used": cfg["path"],
                "timestamp": datetime.now().isoformat()
            }
        )
        
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error during analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.get("/health")
def health():
    """Health check endpoint showing API status and loaded models."""
    status = "healthy" if MODELS_LOADED else "degraded"
    return JSONResponse(
        content={
            "status": status,
            "models_loaded": MODELS_LOADED,
            "models_total": len(MODEL_CONFIG),
            "available_tasks": list(MODELS.keys()),
            "timestamp": datetime.now().isoformat()
        }
    )

@app.get("/tasks")
def get_tasks():
    """Get all available medical analysis tasks with their details."""
    tasks_info = {}
    for task, cfg in MODEL_CONFIG.items():
        tasks_info[task] = {
            "classes": cfg["classes"],
            "type": cfg["type"],
            "model_path": cfg["path"],
            "is_loaded": task in MODELS_LOADED
        }
    return JSONResponse(content=tasks_info)

if __name__ == "__main__":
    logger.info("=" * 60)
    logger.info("Starting Medical Image Analysis Server...")
    logger.info("=" * 60)
    logger.info(f"Models Loaded: {len(MODELS_LOADED)}/{len(MODEL_CONFIG)}")
    logger.info(f"Available Tasks: {MODELS_LOADED}")
    logger.info("Server will be available at: http://localhost:8003")
    logger.info("API Documentation: http://localhost:8003/docs")
    logger.info("=" * 60)
    
    uvicorn.run(
        "__main__:app",
        host="0.0.0.0",
        port=8003,
        reload=True
    )