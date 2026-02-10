# Medical Image Analysis API - Postman Testing Guide

## Quick Start

### 1. **Start the API Server**

```powershell
# In PowerShell at the project directory
python medical_api.py
# Server will start at http://localhost:8003
```

---

## API Endpoints

### **1. Health Check Endpoint**

**Method:** `GET`  
**URL:** `http://localhost:8003/health`  
**Purpose:** Verify API is running and models are loaded

**Example Response:**
```json
{
    "status": "healthy",
    "models_loaded": ["brain_tumor", "breast_cancer", "diabetic_retinopathy", "skin_cancer"],
    "timestamp": "2026-02-09T10:30:45.123456"
}
```

---

### **2. Analyze Medical Image Endpoint (PRIMARY)**

**Method:** `POST`  
**URL:** `http://localhost:8003/analyze`  
**Content-Type:** `application/json`

### **Request Body:**

```json
{
  "task": "brain_tumor",
  "image": "data:image/jpeg;base64,<BASE64_ENCODED_IMAGE>"
}
```

### **Supported Tasks:**
- `brain_tumor` - Brain MRI tumor detection
- `breast_cancer` - Breast histopathology analysis
- `diabetic_retinopathy` - Diabetic retinopathy detection
- `skin_cancer` - Skin cancer classification

---

## How to Test in Postman

### **Setup (One-time)**

1. **Open Postman**
2. **Create a new Collection** named "Medical API Tests"
3. **Create a new Environment** named "Local Development" with:
   ```
   base_url = http://localhost:8003
   ```

---

### **Test 1: Health Check**

1. Create a new request: `GET Health Check`
2. Set URL: `{{base_url}}/health`
3. Click **Send**

**Expected Status:** `200 OK`

---

### **Test 2: Medical Image Analysis**

#### **Option A: Using Base64 Image (Recommended for Postman)**

1. Create new request: `POST Analyze Image`
2. Set URL: `{{base_url}}/analyze`
3. Set Method: `POST`
4. Set Headers:
   ```
   Content-Type: application/json
   ```

5. **To convert an image to Base64:**
   - **Online:** Use https://www.base64-image.de/ (upload image, copy base64)
   - **PowerShell:** 
     ```powershell
     [Convert]::ToBase64String([System.IO.File]::ReadAllBytes("C:\path\to\image.jpg"))
     ```

6. Create Body (raw JSON):
   ```json
   {
     "task": "brain_tumor",
     "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwwUAxUIDAwUAwwUBxwVBh0aFBwYHBodHh4eHx8eHx4eHR0eHx8eHR8eHh4eHR//2wBDAQICAgICAwUDAwwUCBcIDBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHR//wAARCABQAFADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWm5ybnJ2eoaKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9/KKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD/2Q=="
   }
   ```

---

### **Test Cases by Image Type**

#### **Brain Tumor Detection**
```json
{
  "task": "brain_tumor",
  "image": "data:image/jpeg;base64,<YOUR_BRAIN_MRI_IMAGE>"
}
```

#### **Breast Cancer Classification**
```json
{
  "task": "breast_cancer",
  "image": "data:image/jpeg;base64,<YOUR_HISTOPATHOLOGY_IMAGE>"
}
```

#### **Diabetic Retinopathy Detection**
```json
{
  "task": "diabetic_retinopathy",
  "image": "data:image/jpeg;base64,<YOUR_RETINA_IMAGE>"
}
```

#### **Skin Cancer Classification**
```json
{
  "task": "skin_cancer",
  "image": "data:image/jpeg;base64,<YOUR_SKIN_IMAGE>"
}
```

---

## Expected Response Format

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

## Error Responses

### **Invalid Task:**
```json
{
  "detail": "Invalid task. Supported: ['brain_tumor', 'breast_cancer', 'diabetic_retinopathy', 'skin_cancer']"
}
```

### **Missing Image:**
```json
{
  "detail": "Field required"
}
```

### **Image Processing Error:**
```json
{
  "detail": "Error processing image"
}
```

---

## Postman Collection Template

Save this as a JSON file and import to Postman:

```json
{
  "info": {
    "name": "Medical Image Analysis API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "url": {
          "raw": "{{base_url}}/health",
          "host": ["{{base_url}}"],
          "path": ["health"]
        }
      }
    },
    {
      "name": "Analyze Brain Tumor",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"task\": \"brain_tumor\", \"image\": \"data:image/jpeg;base64,\"}"
        },
        "url": {
          "raw": "{{base_url}}/analyze",
          "host": ["{{base_url}}"],
          "path": ["analyze"]
        }
      }
    },
    {
      "name": "Analyze Skin Cancer",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"task\": \"skin_cancer\", \"image\": \"data:image/jpeg;base64,\"}"
        },
        "url": {
          "raw": "{{base_url}}/analyze",
          "host": ["{{base_url}}"],
          "path": ["analyze"]
        }
      }
    }
  ]
}
```

---

## Code Quality Analysis

### ✅ **GOOD DESIGN ASPECTS:**
- **Clean Architecture:** Separated concerns (config, utils, API routes)
- **Consistent Response Format:** All responses return structured JSON
- **Error Handling:** Proper HTTP status codes and error messages
- **CORS Enabled:** Allows frontend integration
- **Type Hints:** Uses Pydantic for request validation
- **Multiple Models:** Supports 4 different medical imaging tasks

### ⚠️ **IMPROVEMENTS TO CONSIDER:**

1. **Add Input Validation:**
   ```python
   from pydantic import validator
   
   class AnalyzeRequest(BaseModel):
       task: str
       image: str
       
       @validator('task')
       def task_must_be_valid(cls, v):
           valid_tasks = ["brain_tumor", "breast_cancer", "diabetic_retinopathy", "skin_cancer"]
           if v.lower() not in valid_tasks:
               raise ValueError(f"Task must be one of {valid_tasks}")
           return v.lower()
   ```

2. **Add Logging:**
   ```python
   import logging
   logging.basicConfig(level=logging.INFO)
   logger = logging.getLogger(__name__)
   ```

3. **Add Documentation Endpoint:**
   ```python
   @app.get("/docs/models")
   def get_model_info():
       return MODEL_CONFIG
   ```

---

## Testing Checklist

- [ ] Start API server successfully
- [ ] Health check endpoint returns 200
- [ ] Brain tumor analysis works
- [ ] Breast cancer analysis works
- [ ] Diabetic retinopathy analysis works
- [ ] Skin cancer analysis works
- [ ] Invalid task returns 400 error
- [ ] Response includes all probability scores
- [ ] Timestamp is in ISO format

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Models cannot be found" | Check image_models/ directory paths in MODEL_CONFIG |
| "CORS error" | CORS middleware is enabled for all origins |
| "Connection refused" | Ensure server is running on port 8003 |
| "Invalid base64" | Use proper image format, ensure no formatting issues |
| "Out of memory" | Reduce image size or close other applications |

