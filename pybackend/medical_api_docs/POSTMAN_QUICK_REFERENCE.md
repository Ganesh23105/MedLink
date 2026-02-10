# Postman Quick Reference - Medical API

## 🚀 Quick Start

```powershell
# 1. Start API
python medical_api.py

# Access in Postman
http://localhost:8003
```

---

## ✅ Test Cases

### 1️⃣ Health Check
```
GET http://localhost:8003/health
```

### 2️⃣ List All Tasks
```
GET http://localhost:8003/tasks
```

### 3️⃣ Brain Tumor Analysis
```
POST http://localhost:8003/analyze
Content-Type: application/json

{
  "task": "brain_tumor",
  "image": "data:image/jpeg;base64,<BASE64>"
}
```

### 4️⃣ Breast Cancer Analysis
```
POST http://localhost:8003/analyze
Content-Type: application/json

{
  "task": "breast_cancer",
  "image": "data:image/jpeg;base64,<BASE64>"
}
```

### 5️⃣ Diabetic Retinopathy Analysis
```
POST http://localhost:8003/analyze
Content-Type: application/json

{
  "task": "diabetic_retinopathy",
  "image": "data:image/jpeg;base64,<BASE64>"
}
```

### 6️⃣ Skin Cancer Analysis
```
POST http://localhost:8003/analyze
Content-Type: application/json

{
  "task": "skin_cancer",
  "image": "data:image/jpeg;base64,<BASE64>"
}
```

---

## 📷 Get Base64 Image

### PowerShell One-Liner
```powershell
$img = [Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\Users\admin\image.jpg")); Write-Host "data:image/jpeg;base64,$img"
```

### Python One-Liner
```python
import base64; print(f"data:image/jpeg;base64,{base64.b64encode(open('image.jpg', 'rb').read()).decode()}")
```

---

## ❌ Error Testing

### Invalid Task
```json
{
  "task": "invalid_task",
  "image": "data:image/jpeg;base64,..."
}
```
Expected: 400 error

### Empty Image
```json
{
  "task": "brain_tumor",
  "image": ""
}
```
Expected: 400 error

---

## 💾 Variables (Optional)

In Postman, set environment variable:
```
base_url = http://localhost:8003
image_base64 = data:image/jpeg;base64,...
```

Then use:
```
{{base_url}}/health
{{base_url}}/analyze
```

---

## 📊 Response Format

```json
{
  "task": "brain_tumor",
  "prediction": "No Tumor",
  "confidence": 0.9543,
  "all_probabilities": {
    "Glioma": 0.0234,
    "Meningioma": 0.0156,
    "Pituitary Tumor": 0.0067,
    "No Tumor": 0.9543
  },
  "model_used": "image_models/brain_tumor_mri_model.h5",
  "timestamp": "2026-02-09T10:35:22.456789"
}
```

---

## ⚙️ Configuration

| Model | File | Classes | Type |
|-------|------|---------|------|
| Brain Tumor | brain_tumor_mri_model.h5 | Glioma, Meningioma, Pituitary, No Tumor | softmax |
| Breast Cancer | breast_histopathology_model.h5 | Benign, Malignant | softmax |
| Diabetic Retinopathy | diabetic_retinopathy_cnn.h5 | No_DR, Mild, Moderate, Severe, Proliferative | softmax |
| Skin Cancer | skin_cancer_model.h5 | Benign, Malignant | softmax |

