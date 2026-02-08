import numpy as np
from collections import Counter

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


# Test Case 1: All Different
print("=" * 60)
print("TEST CASE 1: ALL MODELS PREDICT DIFFERENTLY")
print("=" * 60)
predictions = {'rf': 'Hepatitis A', 'nb': 'Gastroenteritis', 'svm': 'Jaundice'}
confidences = {'rf': 0.92, 'nb': 0.85, 'svm': 0.80}
result = resolve_ensemble_consensus(predictions, confidences)
print(f"Random Forest: Hepatitis A (92% confidence)")
print(f"Naive Bayes: Gastroenteritis (85% confidence)")
print(f"SVM: Jaundice (80% confidence)")
print(f"\n✅ Final Prediction: {result['final_prediction']}")
print(f"Consensus Type: {result['consensus_type']}")
print(f"Confidence: {result['confidence_score']:.2%}")
print(f"Explanation: {result['voting_details']}")
if result.get('weighted_breakdown'):
    print("\nWeighted Breakdown:")
    for disease, details in result['weighted_breakdown'].items():
        print(f"  {disease}: {details['confidence_sum']:.2f}")

print("\n" + "=" * 60)
print("TEST CASE 2: ALL MODELS AGREE (UNANIMOUS)")
print("=" * 60)
predictions2 = {'rf': 'Hepatitis A', 'nb': 'Hepatitis A', 'svm': 'Hepatitis A'}
confidences2 = {'rf': 0.95, 'nb': 0.92, 'svm': 0.88}
result2 = resolve_ensemble_consensus(predictions2, confidences2)
print(f"Random Forest: Hepatitis A (95% confidence)")
print(f"Naive Bayes: Hepatitis A (92% confidence)")
print(f"SVM: Hepatitis A (88% confidence)")
print(f"\n✅ Final Prediction: {result2['final_prediction']}")
print(f"Consensus Type: {result2['consensus_type']}")
print(f"Confidence: {result2['confidence_score']:.2%}")
print(f"Explanation: {result2['voting_details']}")

print("\n" + "=" * 60)
print("TEST CASE 3: MAJORITY VOTING (2 AGREE, 1 DIFFERS)")
print("=" * 60)
predictions3 = {'rf': 'Hepatitis A', 'nb': 'Hepatitis A', 'svm': 'Gastroenteritis'}
confidences3 = {'rf': 0.92, 'nb': 0.88, 'svm': 0.75}
result3 = resolve_ensemble_consensus(predictions3, confidences3)
print(f"Random Forest: Hepatitis A (92% confidence)")
print(f"Naive Bayes: Hepatitis A (88% confidence)")
print(f"SVM: Gastroenteritis (75% confidence)")
print(f"\n✅ Final Prediction: {result3['final_prediction']}")
print(f"Consensus Type: {result3['consensus_type']}")
print(f"Confidence: {result3['confidence_score']:.2%}")
print(f"Explanation: {result3['voting_details']}")
