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

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Medical Tabular Data Analysis API", version="1.0.0")

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
        "path": os.path.join(DATASET_PATH, "diabetes.pkl"),
        "features": ['Pregnancies', 'Glucose', 'BloodPressure', 'SkinThickness', 'Insulin', 'BMI', 'DiabetesPedigreeFunction', 'Age'],
        "target": "Outcome",
        "classes": ["Non-Diabetic", "Diabetic"]
    },
    "heart": {
        "path": os.path.join(DATASET_PATH, "heart.pkl"),
        "features": ['age', 'sex', 'cp', 'trestbps', 'chol', 'fbs', 'restecg', 'thalach', 'exang', 'oldpeak', 'slope', 'ca', 'thal'],
        "target": "target",
        "classes": ["No Heart Disease", "Heart Disease"]
    },
    "kidney": {
        "path": os.path.join(DATASET_PATH, "kidney.pkl"),
        "features": ['age', 'bp', 'sg', 'al', 'su', 'rbc', 'pc', 'pcc', 'ba', 'bgr', 'bu', 'sc', 'sod', 'pot', 'hemo', 'pcv', 'wc', 'rc', 'htn', 'dm', 'cad', 'appet', 'pe', 'ane'],
        "target": "classification",
        "classes": ["No CKD", "CKD"]
    },
    "liver": {
        "path": os.path.join(DATASET_PATH, "liver.pkl"),
        "features": ['Age', 'Gender', 'Total_Bilirubin', 'Direct_Bilirubin', 'Alkaline_Phosphotase', 'Alamine_Aminotransferase', 'Aspartate_Aminotransferase', 'Total_Protiens', 'Albumin', 'Albumin_and_Globulin_Ratio'],
        "target": "Dataset",
        "classes": ["No Liver Disease", "Liver Disease"]
    },
    "breast_cancer": {
        "path": os.path.join(DATASET_PATH, "breast_cancer.pkl"),
        "features": ['radius_mean', 'texture_mean', 'perimeter_mean', 'area_mean', 'smoothness_mean', 'compactness_mean', 'concavity_mean', 'concave points_mean', 'symmetry_mean', 'fractal_dimension_mean', 'radius_se', 'texture_se', 'perimeter_se', 'area_se', 'smoothness_se', 'compactness_se', 'concavity_se', 'concave points_se', 'symmetry_se', 'fractal_dimension_se', 'radius_worst', 'texture_worst', 'perimeter_worst', 'area_worst', 'smoothness_worst', 'compactness_worst', 'concavity_worst', 'concave points_worst', 'symmetry_worst', 'fractal_dimension_worst'],
        "target": "target",
        "classes": ["Malignant", "Benign"]
    }
}

MODELS = {}
for name, config in MODEL_CONFIGS.items():
    if os.path.exists(config["path"]):
        try:
            MODELS[name] = joblib.load(config["path"])
            logger.info(f"Loaded model: {name}")
        except Exception as e:
            logger.error(f"Error loading model {name}: {e}")
    else:
        logger.warning(f"Model file not found: {config['path']}")

class PredictionRequest(BaseModel):
    model_name: str
    data: Dict[str, Any]

@app.get("/models")
async def get_models():
    return {name: {"features": config["features"], "classes": config["classes"]} for name, config in MODEL_CONFIGS.items() if name in MODELS}

@app.post("/predict")
async def predict(request: PredictionRequest):
    if request.model_name not in MODELS:
        raise HTTPException(status_code=404, detail="Model not found")
    
    model = MODELS[request.model_name]
    config = MODEL_CONFIGS[request.model_name]
    
    try:
        # Prepare input data
        input_data = []
        for feature in config["features"]:
            if feature not in request.data:
                raise HTTPException(status_code=400, detail=f"Missing feature: {feature}")
            input_data.append(request.data[feature])
        
        # Convert to DataFrame to ensure feature names match if needed
        df = pd.DataFrame([input_data], columns=config["features"])
        
        # Prediction
        prediction = model.predict(df)[0]
        
        # Handle different target formats (some models return 0/1, some return strings)
        if isinstance(prediction, (int, np.integer)):
            # Most models use 0 for healthy, 1 for disease, but breast cancer might be different
            # We'll trust the order in our config classes
            label = config["classes"][int(prediction)]
        else:
            label = str(prediction)
            
        # Confidence if available
        confidence = 1.0
        if hasattr(model, "predict_proba"):
            proba = model.predict_proba(df)[0]
            confidence = float(np.max(proba))
            
        return {
            "model": request.model_name,
            "prediction": label,
            "confidence": round(confidence, 4),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)
