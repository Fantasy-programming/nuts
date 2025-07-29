# Nuts AI Service

An API for financial transaction categorization, insights, and forecasting, structured for production deployment.

## 🔬 Overview

The AI service provides machine learning capabilities for Nuts, including:

- **Transaction Categorization**: Automatically categorize transactions based on description and amount
- **Financial Insights**: Generate personalized insights from spending patterns
- **Expense Forecasting**: Predict future expenses based on historical data
- **Feedback Learning**: Continuously improve through user feedback

## 📁 Project Structure

```
services/ai/
├── app/                    # FastAPI application source code
│   ├── main.py            # FastAPI app entry point
│   ├── models/            # ML model definitions
│   ├── services/          # Business logic services
│   └── utils/             # Utility functions
├── data/                  # Persistent data storage
│   ├── initial_training_data.csv  # Initial training dataset
│   ├── feedback.csv       # User feedback for retraining
│   └── models/            # Trained model artifacts
├── training/              # Offline model training scripts
│   ├── training_pipeline.py      # Main training pipeline
│   └── data_processing.py        # Data preprocessing utilities
├── Dockerfile             # Container configuration
├── requirements.txt       # Python dependencies
└── .env                   # Configuration (not in git)
```

## 🚀 Setup & Running

### Prerequisites
- **Python 3.9+**
- **pip** or **conda** for package management
- **scikit-learn**, **pandas**, **fastapi** (see requirements.txt)

### Development Setup

1. **Create a virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Initial Model Training:**
   Before running the API for the first time, train an initial model:
   ```bash
   python training/training_pipeline.py
   ```
   This will:
   - Read `data/initial_training_data.csv`
   - Train the categorization model
   - Save model artifacts (`category_model.pkl`, `category_vectorizer.pkl`) to `data/`

4. **Run the API:**
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   The API will be available at `http://localhost:8000`

### Docker Setup

```bash
# Build the container
docker build -t nuts-ai-service .

# Run with environment variables
docker run -d \
  --name nuts-ai \
  -p 8000:8000 \
  -v $(pwd)/data:/app/data \
  nuts-ai-service
```

## 📚 API Endpoints

### Health Check
```http
GET /health
```
Returns service health status.

### Transaction Categorization
```http
POST /categorize
Content-Type: application/json

{
  "transactions": [
    {
      "description": "STARBUCKS STORE #123",
      "amount": -4.50,
      "account_type": "checking"
    }
  ]
}
```

**Response:**
```json
{
  "predictions": [
    {
      "category": "Food & Dining",
      "confidence": 0.92,
      "subcategory": "Coffee Shops"
    }
  ]
}
```

### Financial Insights
```http
POST /insights
Content-Type: application/json

{
  "user_id": "uuid",
  "transactions": [...],
  "time_period": "last_30_days"
}
```

### Expense Forecasting
```http
POST /forecast
Content-Type: application/json

{
  "user_id": "uuid",
  "historical_data": [...],
  "forecast_period": "next_30_days"
}
```

### Training Feedback
```http
POST /train_feedback
Content-Type: application/json

{
  "transaction_id": "uuid",
  "description": "STARBUCKS STORE #123",
  "amount": -4.50,
  "actual_category": "Food & Dining",
  "predicted_category": "Shopping"
}
```

## 🔄 Retraining the Model

As users provide feedback via the `/train_feedback` endpoint, it's logged to `data/feedback.csv`. To incorporate new data:

```bash
python training/training_pipeline.py
```

This will:
1. Load existing training data
2. Merge with feedback data
3. Retrain the model with updated dataset
4. Save new model artifacts
5. The API will automatically use the updated model

### Automated Retraining

For production, set up automated retraining:

```python
from celery import Celery
from training.training_pipeline import retrain_model

app = Celery('ai_service')

@app.task
def scheduled_retrain():
    """Retrain model weekly with new feedback data"""
    retrain_model()
```

## 🧠 Model Details

### Categorization Model
- **Algorithm**: Random Forest Classifier
- **Features**: TF-IDF vectorized transaction descriptions + amount ranges
- **Categories**: 20+ financial categories (Food, Transport, Shopping, etc.)
- **Performance**: ~85-90% accuracy on test data

### Feature Engineering
- **Text Processing**: Lowercasing, punctuation removal, stemming
- **Amount Binning**: Transactions grouped by amount ranges
- **Merchant Recognition**: Known merchant patterns
- **Time Features**: Day of week, month effects

### Training Data Format
```csv
description,amount,category,subcategory,account_type
"STARBUCKS STORE #123",-4.50,"Food & Dining","Coffee Shops","checking"
"SHELL GAS STATION",-35.00,"Transportation","Gas Stations","credit"
"AMAZON.COM PURCHASE",-29.99,"Shopping","Online","checking"
```

## 📊 Performance Monitoring

### Metrics Tracked
- **Prediction Accuracy**: Track correct vs incorrect predictions
- **Confidence Scores**: Monitor model confidence levels
- **Category Distribution**: Ensure balanced predictions
- **Feedback Volume**: Track user feedback frequency

### Model Evaluation
```python
from sklearn.metrics import classification_report, confusion_matrix

# Generate evaluation report
report = classification_report(y_true, y_pred)
matrix = confusion_matrix(y_true, y_pred)
```

## 🔧 Configuration

### Environment Variables
```bash
# Model settings
MODEL_PATH=./data/models/
MODEL_RETRAIN_THRESHOLD=100  # Retrain after N new feedback items
PREDICTION_CONFIDENCE_THRESHOLD=0.7

# API settings
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=false

# Database (if using)
DATABASE_URL=postgresql://user:pass@localhost/nuts_ai
```

### Model Hyperparameters
```python
# In training/training_pipeline.py
RF_PARAMS = {
    'n_estimators': 100,
    'max_depth': 10,
    'min_samples_split': 5,
    'min_samples_leaf': 2,
    'random_state': 42
}
```

## 🚀 Production Deployment

### Docker Compose Integration
```yaml
ai-service:
  build: ./services/ai
  ports:
    - "8000:8000"
  environment:
    - MODEL_PATH=/app/data/models/
  volumes:
    - ai_data:/app/data
  depends_on:
    - postgres
```

### Health Checks
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

### Scaling Considerations
- **Model Loading**: Cache models in memory for faster predictions
- **Batch Processing**: Process multiple transactions simultaneously
- **Async Processing**: Use background tasks for model retraining
- **Model Versioning**: Keep track of model versions and rollback capability

## 🧪 Testing

Run the test suite:

```bash
# Unit tests
python -m pytest tests/ -v

# Integration tests
python -m pytest tests/integration/ -v

# Load tests
python -m pytest tests/load/ -v
```

### Test Categories
- **Model Performance**: Accuracy, precision, recall tests
- **API Endpoints**: Request/response validation
- **Data Processing**: Feature engineering validation
- **Edge Cases**: Unusual transaction formats

## 🔐 Security

### Data Privacy
- **No PII Storage**: Only transaction amounts and anonymized descriptions
- **Data Encryption**: Sensitive data encrypted at rest
- **Access Logs**: All API access logged for audit

### API Security
- **Rate Limiting**: Prevent abuse with request limits
- **Input Validation**: Sanitize all input data
- **Authentication**: API key or JWT token validation
- **HTTPS Only**: Encrypt all data in transit

## 🤝 Contributing

### Adding New Categories
1. Update training data with new category examples
2. Retrain the model with `python training/training_pipeline.py`
3. Test predictions with new category
4. Update API documentation

### Improving Model Performance
1. Analyze prediction errors in feedback data
2. Add more training examples for low-performing categories
3. Experiment with feature engineering
4. Consider ensemble methods or deep learning models

### Code Style
- **Python**: Follow PEP 8 standards
- **Type Hints**: Use type annotations
- **Documentation**: Docstrings for all functions
- **Testing**: Maintain >80% test coverage

## 📈 Future Enhancements

- **Deep Learning Models**: Implement transformer-based models for better text understanding
- **Multi-language Support**: Support transaction descriptions in multiple languages
- **Real-time Learning**: Online learning capabilities for immediate feedback incorporation
- **Advanced Insights**: Spending behavior analysis, budget recommendations
- **Anomaly Detection**: Identify unusual transactions or spending patterns

## 📞 Support

For AI service specific issues:
- **GitHub Issues**: [Report bugs](https://github.com/Fantasy-Programming/nuts/issues)
- **Documentation**: Check the main [docs](../../docs/)
- **Email**: ai-support@nuts.app
