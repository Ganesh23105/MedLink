from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import json
import logging
import joblib
import pandas as pd
import numpy as np
import statistics
from langchain_groq import ChatGroq
from dotenv import load_dotenv

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Disease Prediction API", version="2.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load environment variables
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    logger.warning("GROQ_API_KEY environment variable is not set. Gen AI features will be limited.")

# Initialize Groq LLM
try:
    llm = ChatGroq(
        temperature=0.1,
        groq_api_key=GROQ_API_KEY,
        model_name="llama-3.3-70b-versatile"
    )
except Exception as e:
    logger.error(f"Failed to initialize Groq LLM: {e}")
    llm = None

# Load ML Models and Metadata
MODELS_PATH = os.path.join(os.path.dirname(__file__), "models")
try:
    svm_model = joblib.load(os.path.join(MODELS_PATH, "svm_model.pkl"))
    nb_model = joblib.load(os.path.join(MODELS_PATH, "naive_bayes_model.pkl"))
    rf_model = joblib.load(os.path.join(MODELS_PATH, "random_forest_model.pkl"))
    
    with open(os.path.join(MODELS_PATH, "model_metadata.json"), "r") as f:
        metadata = json.load(f)
        symptom_index = metadata["symptom_index"]
        encoder_classes = metadata["encoder_classes"]
    
    logger.info("ML models and metadata loaded successfully.")
except Exception as e:
    logger.error(f"Error loading ML models: {e}")
    svm_model = nb_model = rf_model = None
    symptom_index = {}
    encoder_classes = []

# Pydantic models
class TextSymptomRequest(BaseModel):
    symptoms: str

class SymptomAnalysis(BaseModel):
    conditions: List[str]
    detailed_description: str
    possible_causes: List[str]
    tests: List[str]
    urgency: str
    home_care_tips: Optional[str] = None
    when_to_seek_help: str
    first_aid: Optional[str] = None

def map_symptoms_with_genai(user_input: str) -> List[str]:
    """Use Gen AI to map user's natural language input to the 132 symptoms used by the ML model."""
    if not llm:
        return []
    
    available_symptoms = list(symptom_index.keys())
    
    prompt = f"""
    A patient says: "{user_input}"
    
    From the following list of symptoms, identify which ones the patient is likely experiencing. 
    Return ONLY a comma-separated list of the exact symptom names from the list below. 
    If no symptoms match, return "None".
    
    Available Symptoms:
    {", ".join(available_symptoms)}
    
    Output format: Symptom 1, Symptom 2, ...
    """
    
    try:
        result = llm.invoke(prompt)
        content = result.content.strip() if hasattr(result, 'content') else str(result).strip()
        
        if content.lower() == "none":
            return []
        
        # Split and clean the symptoms
        mapped_symptoms = [s.strip() for s in content.split(",") if s.strip() in symptom_index]
        print(mapped_symptoms)
        return mapped_symptoms
    except Exception as e:
        logger.error(f"Error mapping symptoms with Gen AI: {e}")
        return []

def get_model_confidence(model, input_df):
    """Extract confidence scores from model predictions."""
    try:
        # For Naive Bayes and Random Forest, use predict_proba
        if hasattr(model, 'predict_proba'):
            proba = model.predict_proba(input_df)[0]
            max_confidence = np.max(proba)
            return max_confidence
        # For SVM, use decision_function as proxy for confidence
        elif hasattr(model, 'decision_function'):
            decision = model.decision_function(input_df)[0]
            # Normalize to 0-1 range
            confidence = 1 / (1 + np.exp(-decision))
            return float(confidence)
        else:
            return 0.5  # Default confidence if method unavailable
    except Exception as e:
        logger.warning(f"Error calculating confidence: {e}")
        return 0.5

def resolve_ensemble_consensus(predictions: dict, confidences: dict) -> dict:
    """
    Resolve predictions when models disagree.
    Handles three cases:
    1. Unanimous (all agree) - return prediction
    2. Majority (2 agree) - return majority prediction
    3. All Different (no consensus) - weighted voting by confidence
    """
    pred_list = [predictions["rf"], predictions["nb"], predictions["svm"]]
    conf_list = [confidences["rf"], confidences["nb"], confidences["svm"]]
    model_names = ["Random Forest", "Naive Bayes", "Support Vector"]
    
    # Count occurrences
    from collections import Counter
    vote_counts = Counter(pred_list)
    
    # Case 1: All three same (unanimous)
    if len(vote_counts) == 1:
        return {
            "consensus_type": "UNANIMOUS",
            "final_prediction": pred_list[0],
            "confidence_score": np.mean(conf_list),
            "voting_details": "All 3 models agree"
        }
    
    # Case 2: Two agree (majority)
    if max(vote_counts.values()) == 2:
        majority_pred = vote_counts.most_common(1)[0][0]
        majority_models = [model_names[i] for i, p in enumerate(pred_list) if p == majority_pred]
        avg_conf = np.mean([conf_list[i] for i, p in enumerate(pred_list) if p == majority_pred])
        
        return {
            "consensus_type": "MAJORITY",
            "final_prediction": majority_pred,
            "confidence_score": avg_conf,
            "voting_details": f"2/3 models agree: {', '.join(majority_models)}"
        }
    
    # Case 3: All different - Weighted voting by confidence
    # Assign each vote weighted by model confidence
    weighted_votes = {}
    for pred, conf, model in zip(pred_list, conf_list, model_names):
        if pred not in weighted_votes:
            weighted_votes[pred] = {"score": 0, "models": []}
        weighted_votes[pred]["score"] += conf
        weighted_votes[pred]["models"].append(model)
    
    final_pred = max(weighted_votes.items(), key=lambda x: x[1]["score"])[0]
    winning_conf = weighted_votes[final_pred]["score"] / sum(c for c in conf_list)
    
    return {
        "consensus_type": "WEIGHTED_VOTING",
        "final_prediction": final_pred,
        "confidence_score": winning_conf,
        "voting_details": "All models differ - used confidence-weighted voting",
        "weighted_breakdown": {
            pred: {
                "confidence_sum": score["score"],
                "models": score["models"]
            }
            for pred, score in weighted_votes.items()
        }
    }

def predict_disease_ml(mapped_symptoms: List[str]) -> dict:
    """Predict disease using trained ML models with advanced consensus."""
    if not all([svm_model, nb_model, rf_model, symptom_index, encoder_classes]):
        return {"error": "ML models not loaded"}
    
    if not mapped_symptoms:
        return {"error": "No valid symptoms identified for ML model"}

    # Create input vector with feature names to avoid warnings
    input_dict = {symptom: [0] for symptom in metadata["symptoms_list"]}
    for symptom in mapped_symptoms:
        # Map the capitalized symptom back to the underscore version used in training
        for original_symptom in metadata["symptoms_list"]:
            normalized = " ".join([i.capitalize() for i in original_symptom.split("_")])
            if normalized == symptom:
                input_dict[original_symptom] = [1]
                break
    
    input_df = pd.DataFrame(input_dict)
    
    # Get predictions from each model
    rf_pred = encoder_classes[rf_model.predict(input_df)[0]]
    nb_pred = encoder_classes[nb_model.predict(input_df)[0]]
    svm_pred = encoder_classes[svm_model.predict(input_df)[0]]
    
    # Get confidence scores for each prediction
    rf_conf = get_model_confidence(rf_model, input_df)
    nb_conf = get_model_confidence(nb_model, input_df)
    svm_conf = get_model_confidence(svm_model, input_df)
    
    # Resolve consensus with advanced logic
    predictions = {"rf": rf_pred, "nb": nb_pred, "svm": svm_pred}
    confidences = {"rf": rf_conf, "nb": nb_conf, "svm": svm_conf}
    consensus = resolve_ensemble_consensus(predictions, confidences)
    
    return {
        "rf_model_prediction": rf_pred,
        "rf_confidence": float(rf_conf),
        "naive_bayes_prediction": nb_pred,
        "naive_bayes_confidence": float(nb_conf),
        "svm_model_prediction": svm_pred,
        "svm_confidence": float(svm_conf),
        "final_prediction": consensus["final_prediction"],
        "consensus_type": consensus["consensus_type"],
        "consensus_confidence": float(consensus["confidence_score"]),
        "voting_details": consensus["voting_details"],
        "weighted_breakdown": consensus.get("weighted_breakdown", None),
        "mapped_symptoms": mapped_symptoms
    }

def analyze_symptoms_genai(symptoms: str) -> dict:
    """Enhanced symptom analysis using Gen AI (original functionality)."""
    if not llm:
        return {"error": "Gen AI not available"}
        
    prompt = f"""
    You are an experienced medical AI assistant. A patient describes their symptoms: "{symptoms}"
    
    Provide a thorough analysis in the following JSON format:
    {{
        "conditions": ["list of 3-4 most probable conditions"],
        "detailed_description": "comprehensive explanation",
        "possible_causes": ["list of 4-6 potential causes"],
        "tests": ["list of recommended medical tests"],
        "urgency": "Emergency/High/Moderate/Low",
        "home_care_tips": "practical self-care measures",
        "when_to_seek_help": "warning signs",
        "first_aid": "immediate steps if urgent, else null"
    }}
    
    Return ONLY valid JSON.
    """
    
    try:
        result = llm.invoke(prompt)
        response_text = result.content.strip() if hasattr(result, 'content') else str(result).strip()
        
        # Clean JSON response
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0]
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0]
        
        return json.loads(response_text.strip())
    except Exception as e:
        logger.error(f"Gen AI analysis error: {e}")
        return {"error": "Failed to generate AI analysis"}

@app.get("/")
async def root():
    return {"message": "Disease Prediction API with ML and Gen AI is running"}

@app.post("/api/process-text")
async def process_text_symptoms(request: TextSymptomRequest):
    """Process symptoms using both ML models and Gen AI."""
    try:
        logger.info(f"Processing symptoms: {request.symptoms}")
        
        # 1. Map symptoms using Gen AI for ML model
        mapped_symptoms = map_symptoms_with_genai(request.symptoms)
        
        # 2. Get ML Model Predictions
        ml_results = predict_disease_ml(mapped_symptoms)
        
        # 3. Get Gen AI Detailed Analysis
        gen_ai_analysis = analyze_symptoms_genai(request.symptoms)
        
        # Ensure the response structure matches what the frontend expects
        return {
            "ml_predictions": ml_results,
            "gen_ai_analysis": gen_ai_analysis,
            "analysis": gen_ai_analysis, # Fallback for older frontend versions
            "input_symptoms": request.symptoms
        }
    
    except Exception as e:
        logger.error(f"Error processing symptoms: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
