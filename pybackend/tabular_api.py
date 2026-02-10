import os
import joblib
import pandas as pd
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List
import logging
from datetime import datetime
import pickle

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Medical Tabular Data Analysis API", version="1.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Model Configuration
DATASET_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "dataset")

MODEL_CONFIGS = {
    "diabetes": {
        "model_path": os.path.join(DATASET_PATH, "diabetes_model.pkl"),
        "scaler_path": os.path.join(DATASET_PATH, "diabetes_scaler.pkl"),
        "features": ['Pregnancies', 'Glucose', 'BloodPressure', 'SkinThickness', 'Insulin', 'BMI', 'DiabetesPedigreeFunction', 'Age'],
        "classes": ["Healthy", "Diabetic"]
    },
    "liver": {
        "model_path": os.path.join(DATASET_PATH, "liver_model.pkl"),
        "scaler_path": os.path.join(DATASET_PATH, "liver_scaler.pkl"),
        "features": ['Age', 'Gender', 'Total_Bilirubin', 'Direct_Bilirubin', 'Alkaline_Phosphotase', 'Alamine_Aminotransferase', 'Aspartate_Aminotransferase', 'Total_Protiens', 'Albumin', 'Albumin_and_Globulin_Ratio'],
        "classes": ["Healthy", "Liver Disease"]
    },
    "kidney": {
        "model_path": os.path.join(DATASET_PATH, "ckd_model.pkl"),
        "scaler_path": os.path.join(DATASET_PATH, "ckd_scaler.pkl"),
        "imputer_path": os.path.join(DATASET_PATH, "ckd_imputer.pkl"),
        "features": ['id', 'age', 'bp', 'sg', 'al', 'su', 'bgr', 'bu', 'sc', 'sod', 'pot', 'hemo', 'pcv', 'wc', 'rc'],
        "classes": ["No CKD", "CKD"]
    }
}

MODELS = {}
SCALERS = {}
IMPUTERS = {}

def load_pkl(path):
    if not os.path.exists(path):
        return None
    try:
        with open(path, "rb") as f:
            return pickle.load(f)
    except:
        try:
            return joblib.load(path)
        except Exception as e:
            logger.error(f"Failed to load {path}: {e}")
            return None

for name, config in MODEL_CONFIGS.items():
    model = load_pkl(config["model_path"])
    if model:
        MODELS[name] = model
        SCALERS[name] = load_pkl(config["scaler_path"])
        if "imputer_path" in config:
            IMPUTERS[name] = load_pkl(config["imputer_path"])
        logger.info(f"✓ Loaded model: {name}")
    else:
        logger.warning(f"✗ Model file not found: {config['model_path']}")

class PredictionRequest(BaseModel):
    model_name: str
    data: Dict[str, Any]

@app.get("/models")
async def get_models():
    return {name: {"features": config["features"], "classes": config["classes"]} for name, config in MODEL_CONFIGS.items() if name in MODELS}

@app.post("/predict")
async def predict(request: PredictionRequest):
    if request.model_name not in MODELS:
        raise HTTPException(status_code=404, detail=f"Model '{request.model_name}' not found or not loaded.")
    
    model = MODELS[request.model_name]
    scaler = SCALERS.get(request.model_name)
    imputer = IMPUTERS.get(request.model_name)
    config = MODEL_CONFIGS[request.model_name]
    
    try:
        # Prepare input data
        input_values = []
        for feature in config["features"]:
            val = request.data.get(feature)
            if val is None:
                # If imputer exists, we can handle missing values later, but for now, let's expect all
                input_values.append(np.nan)
            else:
                input_values.append(float(val))
        
        input_array = np.array([input_values])
        
        # Apply Imputer if exists
        if imputer:
            input_array = imputer.transform(input_array)
            
        # Apply Scaler if exists
        if scaler:
            input_array = scaler.transform(input_array)
        
        # Prediction
        prediction = model.predict(input_array)[0]
        
        # Confidence
        confidence = 1.0
        if hasattr(model, "predict_proba"):
            proba = model.predict_proba(input_array)[0]
            confidence = float(np.max(proba))
            
        # Map prediction to label
        # Note: In the notebook, liver disease is 1, healthy is 2 (renamed to label)
        # CKD is 1, notckd is 0
        # Diabetes is 1, healthy is 0
        label = config["classes"][int(prediction)] if int(prediction) < len(config["classes"]) else str(prediction)
            
        return {
            "model": request.model_name,
            "prediction": label,
            "confidence": round(confidence, 4),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Prediction error for {request.model_name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)
