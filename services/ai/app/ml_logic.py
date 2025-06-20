import pickle
from typing import Dict, Any, Optional
import os
from sklearn.linear_model import LogisticRegression
from sklearn.feature_extraction.text import TfidfVectorizer

from .config import settings, logger

# Global dictionary to hold loaded models
ml_artifacts: Dict[str, Any] = {
    "model": None,
    "vectorizer": None,
}


def load_models():
    """
    Loads the ML model and vectorizer from disk into the global ml_artifacts dictionary.
    This function is called once at application startup.
    """
    logger.info("Attempting to load ML models from disk...")
    try:
        if not os.path.exists(settings.MODEL_PATH) or not os.path.exists(
            settings.VECTORIZER_PATH
        ):
            logger.critical(
                f"Model or vectorizer file not found. Paths: {settings.MODEL_PATH}, {settings.VECTORIZER_PATH}"
            )
            logger.critical(
                "Please run the training pipeline first (training/training_pipeline.py)."
            )
            raise FileNotFoundError("Model assets not found. Application cannot start.")

        with open(settings.MODEL_PATH, "rb") as f:
            ml_artifacts["model"] = pickle.load(f)
        with open(settings.VECTORIZER_PATH, "rb") as f:
            ml_artifacts["vectorizer"] = pickle.load(f)

        logger.info("Successfully loaded categorization model and vectorizer.")

    except Exception as e:
        logger.error(f"Failed to load ML models: {e}")
        # Re-raise the exception to prevent the application from starting in a broken state
        raise e


def predict(description: str) -> str:
    """Makes a category prediction for a given transaction description."""
    model: Optional[LogisticRegression] = ml_artifacts.get("model")
    vectorizer: Optional[TfidfVectorizer] = ml_artifacts.get("vectorizer")

    if not model or not vectorizer:
        logger.error("Prediction failed: model or vectorizer not loaded.")
        # In a real scenario, you might have a default fallback category.
        return "Uncategorized"

    description_vector = vectorizer.transform([description])
    predicted_category = model.predict(description_vector)[0]
    return predicted_category
