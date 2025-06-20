An API for financial transaction categorization, insights, and forecasting, structured for production deployment.

## Project Structure

-   **/app**: Contains the main FastAPI application source code.
-   **/data**: Persistent data storage for training and feedback.
-   **/training**: Offline scripts for model training.
-   `Dockerfile`: For building a containerized version of the service.
-   `.env`: Configuration file for the application (not committed to git).
-   `requirements.txt`: Python dependencies.

## Setup & Running

1.  **Create a virtual environment:**
    ```bash
    python -m venv venv
    source venv/bin/activate
    ```

2.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

3.  **Initial Model Training:**
    Before running the API for the first time, you must train an initial model.
    ```bash
    python training/training_pipeline.py
    ```
    This will read `data/initial_training_data.csv`, train the model, and save the artifacts (`category_model.pkl`, `category_vectorizer.pkl`) to the `data/` directory.

4.  **Run the API:**
    ```bash
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    ```
    The API will be available at `http://localhost:8000`.

## Retraining the Model

As users provide feedback via the `/train_feedback` endpoint, it is logged to `data/feedback.csv`. To incorporate this new data, simply re-run the training pipeline:

```bash
python training/training_pipeline.py
