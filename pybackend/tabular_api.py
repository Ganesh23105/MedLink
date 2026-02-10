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
    # Prefer a saved feature list produced at training time if available
    features_list = config.get("features", [])
    try:
        features_file = os.path.splitext(config["model_path"])[0] + "_features.json"
        if os.path.exists(features_file):
            import json
            with open(features_file, "r", encoding="utf-8") as fh:
                loaded = json.load(fh)
            if isinstance(loaded, list) and loaded:
                features_list = loaded
                logger.info(f"Using saved feature list for model {request.model_name} from {features_file} (len={len(features_list)})")
    except Exception as e:
        logger.warning(f"Could not load features file for {request.model_name}: {e}")
    
    try:
        # Prepare input data
        input_values = []
        def to_float_safe(val):
            # Handle None
            if val is None:
                return np.nan
            # If already numeric
            if isinstance(val, (int, float, np.floating, np.integer)):
                try:
                    return float(val)
                except:
                    return np.nan
            # Strip strings
            if isinstance(val, str):
                s = val.strip()
                if s == "":
                    return np.nan
                # Replace common comma decimal
                s2 = s.replace(",", ".")
                try:
                    return float(s2)
                except:
                    low = s2.lower()
                    # basic categorical mappings (gender, yes/no)
                    if low in ("male", "m"):
                        return 1.0
                    if low in ("female", "f"):
                        return 0.0
                    if low in ("yes", "y", "true", "t"):
                        return 1.0
                    if low in ("no", "n", "false", "f"):
                        return 0.0
                    return np.nan
            # Unknown type
            return np.nan

        for feature in features_list:
            raw_val = request.data.get(feature)
            parsed = to_float_safe(raw_val)
            input_values.append(parsed)

        # Log any fields that were coerced to NaN for debugging
        nan_fields = [f for f, v in zip(config["features"], input_values) if pd.isna(v)]
        if nan_fields:
            raw_map = {f: request.data.get(f) for f in nan_fields}
            logger.info(f"Fields coerced to NaN for model {request.model_name}: {nan_fields}. Raw values: {raw_map}")
        
        input_array = np.array([input_values])
        
        # Helper to align input array columns to transformer expectations
        def _align_to_transformer(arr, transformer, transformer_name):
            if not hasattr(transformer, "n_features_in_"):
                return arr
            expected = int(getattr(transformer, "n_features_in_"))
            current = arr.shape[1]
            if current == expected:
                return arr
            if current < expected:
                # pad with NaNs on the right
                pad = np.full((arr.shape[0], expected - current), np.nan)
                logger.warning(f"{transformer_name} expects {expected} features but input has {current}. Padding with NaN columns.")
                return np.concatenate([arr, pad], axis=1)
            # current > expected: trim extra columns
            logger.warning(f"{transformer_name} expects {expected} features but input has {current}. Trimming extra columns.")
            return arr[:, :expected]

        # Apply Imputer if exists (align first)
        if imputer:
            try:
                input_array = _align_to_transformer(input_array, imputer, "Imputer")
                input_array = imputer.transform(input_array)
            except Exception as ex:
                logger.error(f"Imputer transform failed for {request.model_name}: {ex}")
                raise
            
        # Apply Scaler if exists (align to scaler expectations)
        if scaler:
            try:
                input_array = _align_to_transformer(input_array, scaler, "Scaler")
                input_array = scaler.transform(input_array)
            except Exception as ex:
                logger.error(f"Scaler transform failed for {request.model_name}: {ex}")
                raise
        
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
