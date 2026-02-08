from symptoms import resolve_ensemble_consensus

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
