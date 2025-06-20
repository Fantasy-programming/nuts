import os
import pickle
import pandas as pd
import logging
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

# Setup logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Define paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
INITIAL_DATA_PATH = os.path.join(DATA_DIR, "initial_training_data.csv")
FEEDBACK_DATA_PATH = os.path.join(DATA_DIR, "feedback.csv")
MODEL_PATH = os.path.join(DATA_DIR, "category_model.pkl")
VECTORIZER_PATH = os.path.join(DATA_DIR, "category_vectorizer.pkl")


def load_data():
    """Loads initial training data and any collected feedback."""
    abs_initial_data_path = os.path.abspath(INITIAL_DATA_PATH)
    abs_feedback_data_path = os.path.abspath(FEEDBACK_DATA_PATH)

    logger.info(f"Loading initial data from {abs_initial_data_path}")
    if not os.path.exists(INITIAL_DATA_PATH):
        logger.error(
            f"Initial training data not found at {abs_initial_data_path}. Exiting."
        )
        return None

    df_initial = pd.read_csv(INITIAL_DATA_PATH)
    all_data = [df_initial]

    if os.path.exists(FEEDBACK_DATA_PATH):
        try:
            logger.info(f"Loading feedback data from {abs_feedback_data_path}")
            df_feedback = pd.read_csv(FEEDBACK_DATA_PATH)
            if not df_feedback.empty:
                expected_cols = ["description", "category"]
                if all(col in df_feedback.columns for col in expected_cols):
                    df_feedback = df_feedback[expected_cols]
                    all_data.append(df_feedback)
                else:
                    logger.warning(
                        f"Feedback data from {abs_feedback_data_path} does not have the expected columns (description, category). Skipping."
                    )
            # Use a more specific check for empty file, as pandas might read an empty file with no headers as EmptyDataError
            # or as an empty DataFrame depending on the content (e.g. if it only has headers).
            elif (
                df_feedback.empty
            ):  # Explicitly check if DataFrame is empty after read_csv
                logger.info(
                    f"Feedback file at {abs_feedback_data_path} is empty. Skipping."
                )

        except (
            pd.errors.EmptyDataError
        ):  # This catches truly empty files or files pandas cannot parse into a DF
            logger.warning(
                f"Feedback file at {abs_feedback_data_path} is empty or unreadable (pandas EmptyDataError). Skipping."
            )
        except Exception as e:
            logger.error(
                f"Error loading feedback data from {abs_feedback_data_path}: {e}"
            )
    else:
        logger.info(f"Feedback file not found at {abs_feedback_data_path}. Skipping.")

    df_combined = pd.concat(all_data, ignore_index=True)
    df_combined.dropna(subset=["description", "category"], inplace=True)
    df_combined.drop_duplicates(subset=["description", "category"], inplace=True)

    logger.info(
        f"Total training samples after combining and cleaning: {len(df_combined)}"
    )
    return df_combined


def train_model(df: pd.DataFrame):
    """Trains the TF-IDF vectorizer and Logistic Regression model."""
    if df.empty:
        logger.error("Training dataframe is empty. Cannot train model.")
        return

    X = df["description"]
    y = df["category"]

    if len(y.unique()) < 2:
        logger.error(
            f"The dataset must contain at least two unique classes for training. Found {len(y.unique())} class(es)."
        )
        if not y.empty and len(y.unique()) == 1:
            logger.error(
                f"Only one class present: {y.unique()[0]}. Model training aborted."
            )
        elif y.empty:  # Should be caught by df.empty earlier, but good for completeness
            logger.error("No class labels (y) found. Model training aborted.")
        else:  # 0 classes if y.unique() is empty but y itself is not (edge case)
            logger.error("No classes found in the data. Model training aborted.")
        return

    # Attempt stratified split, fall back to non-stratified if too few samples in a class
    stratify_option = y
    try:
        X_train, X_test, y_train, y_test = train_test_split(
            X,
            y,
            test_size=0.2,
            random_state=42,
            stratify=stratify_option,  # Attempt to stratify
        )
        logger.info("Successfully performed stratified train-test split.")
    except ValueError as e:
        if "The least populated class in y has only 1 member" in str(
            e
        ) or "The least populated class in y has fewer members than n_splits" in str(
            e
        ):  # More general check
            logger.warning(
                f"Stratified split failed: {e}. "
                "Falling back to non-stratified split. This might lead to "
                "uneven class distribution in train/test sets."
            )
            X_train, X_test, y_train, y_test = train_test_split(
                X,
                y,
                test_size=0.2,
                random_state=42,
                stratify=None,  # Fallback
            )
        else:
            logger.error(f"Error during train_test_split: {e}")
            raise  # Re-raise other ValueErrors or unexpected errors

    logger.info(
        f"Training on {len(X_train)} samples, validating on {len(X_test)} samples."
    )

    # Create a pipeline
    pipeline = Pipeline(
        [
            # For very small datasets, min_df=1 might be more appropriate initially,
            # but min_df=2 helps avoid overfitting to very rare words.
            # Keep min_df=2 as per original, but be aware of its impact.
            ("vectorizer", TfidfVectorizer(ngram_range=(1, 2), min_df=2)),
            (
                "classifier",
                LogisticRegression(
                    max_iter=1000, random_state=42, class_weight="balanced"
                ),
            ),
        ]
    )

    # Train the model
    pipeline.fit(X_train, y_train)

    # Evaluate the model
    y_pred = pipeline.predict(X_test)
    logger.info("Model Performance on Test Set:")
    try:
        # Ensure all unique labels from the original dataset are considered in the report
        all_labels = sorted(list(y.unique()))
        report = classification_report(
            y_test, y_pred, labels=all_labels, zero_division=0
        )
        logger.info(f"\n{report}")
    except ValueError as ve:
        logger.warning(
            f"Could not generate classification report due to ValueError: {ve}"
        )
        logger.info(
            f"y_test unique values: {y_test.unique() if not y_test.empty else 'empty'}"
        )
        logger.info(
            f"y_pred unique values: {pd.Series(y_pred).unique() if len(y_pred) > 0 else 'empty'}"
        )
    except Exception as e:
        logger.warning(f"Could not generate classification report: {e}")

    abs_vectorizer_path = os.path.abspath(VECTORIZER_PATH)
    abs_model_path = os.path.abspath(MODEL_PATH)

    logger.info(f"Saving vectorizer to {abs_vectorizer_path}")
    os.makedirs(
        os.path.dirname(VECTORIZER_PATH), exist_ok=True
    )  # Ensure directory exists
    with open(VECTORIZER_PATH, "wb") as f:
        pickle.dump(pipeline.named_steps["vectorizer"], f)

    logger.info(f"Saving model to {abs_model_path}")
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)  # Ensure directory exists
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(pipeline.named_steps["classifier"], f)

    logger.info("Training and saving complete.")


if __name__ == "__main__":
    # Ensure data directory exists (good practice, though your paths suggest it's part of the repo)
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)
        logger.info(f"Created data directory at {os.path.abspath(DATA_DIR)}")

    # Create dummy feedback file if it doesn't exist, as the script expects it
    # This part should ideally be handled by ensuring the file exists before running,
    # or the load_data function could be more robust to its absence.
    # The current load_data checks os.path.exists(FEEDBACK_DATA_PATH)
    # so creating it here if it doesn't exist is fine.
    if not os.path.exists(FEEDBACK_DATA_PATH):
        logger.info(
            f"Feedback file not found at {os.path.abspath(FEEDBACK_DATA_PATH)}. Creating an empty one."
        )
        # Create an empty file, or one with headers if your load_data expects them
        with open(FEEDBACK_DATA_PATH, "w") as f:
            # f.write("description,category\n") # If headers are expected for an "empty but valid" CSV
            pass  # Creates a truly empty file

    training_data = load_data()
    if training_data is not None and not training_data.empty:
        train_model(training_data)
    elif training_data is None:
        logger.error("Failed to load training data. Model training aborted.")
    else:  # training_data is not None but is empty
        logger.error("Loaded training data is empty. Model training aborted.")
