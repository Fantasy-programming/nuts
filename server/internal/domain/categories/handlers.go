package categories

import (
	"encoding/json"
	"net/http"

	"github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/Fantasy-Programming/nuts/server/internal/utility/message"
	"github.com/Fantasy-Programming/nuts/server/internal/utility/respond"
	"github.com/Fantasy-Programming/nuts/server/internal/utility/validation"
	"github.com/Fantasy-Programming/nuts/server/pkg/jwt"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/rs/zerolog"
)

type Handler struct {
	validator *validation.Validator
	repo      Repository
	log       *zerolog.Logger
}

func NewHandler(validator *validation.Validator, repo Repository, logger *zerolog.Logger) *Handler {
	return &Handler{validator, repo, logger}
}

func (h *Handler) GetCategories(w http.ResponseWriter, r *http.Request) {
	userID, err := jwt.GetUserID(r)
	ctx := r.Context()

	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.log,
			Details:    r.URL.Path,
		})
		return
	}

	categories, err := h.repo.ListCategories(ctx, userID)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.log,
			Details:    userID,
		})
		return
	}

	respond.Json(w, http.StatusOK, categories, h.log)
}

func (h *Handler) CreateCategories(w http.ResponseWriter, r *http.Request) {
	var req CreateCategoryRequest
	ctx := r.Context()

	userID, err := jwt.GetUserID(r)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.log,
			Details:    r.URL.Path,
		})
		return
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.log,
		})
		return
	}

	params := repository.CreateCategoryParams{
		Name:      req.Name,
		ParentID:  req.ParentID,
		IsDefault: nil,
		CreatedBy: userID,
	}

	category, err := h.repo.CreateCategory(ctx, params)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.log,
			Details:    params,
		})
		return
	}

	respond.Json(w, http.StatusCreated, category, h.log)
}

func (h *Handler) UpdateCategory(w http.ResponseWriter, r *http.Request) {
	var req UpdateCategoryRequest
	ctx := r.Context()

	// Get category ID from URL
	categoryID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.log,
		})
		return
	}

	userID, err := jwt.GetUserID(r)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.log,
			Details:    r.URL.Path,
		})
		return
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.log,
		})
		return
	}

	params := repository.UpdateCategoryParams{
		ID:        categoryID,
		Name:      req.Name,
		ParentID:  req.ParentID,
		UpdatedBy: &userID,
	}

	category, err := h.repo.UpdateCategory(ctx, params)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.log,
			Details:    params,
		})
		return
	}

	respond.Json(w, http.StatusOK, category, h.log)
}

func (h *Handler) DeleteCategory(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Get category ID from URL
	categoryID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusBadRequest,
			ClientErr:  message.ErrBadRequest,
			ActualErr:  err,
			Logger:     h.log,
		})
		return
	}

	err = h.repo.DeleteCategory(ctx, categoryID)
	if err != nil {
		respond.Error(respond.ErrorOptions{
			W:          w,
			R:          r,
			StatusCode: http.StatusInternalServerError,
			ClientErr:  message.ErrInternalError,
			ActualErr:  err,
			Logger:     h.log,
			Details:    categoryID,
		})
		return
	}

	respond.Status(w, http.StatusNoContent)
}

func (h *Handler) PredictCategory(w http.ResponseWriter, r *http.Request) {
	// ctx := r.Context()
	//
	// var req struct {
	// 	Description string `json:"description"`
	// }
	//
	// valErr, err := h.validator.ParseAndValidate(ctx, r, &req)
	// if err != nil {
	// 	respond.Error(respond.ErrorOptions{
	// 		W:          w,
	// 		R:          r,
	// 		StatusCode: http.StatusBadRequest,
	// 		ClientErr:  message.ErrBadRequest,
	// 		ActualErr:  err,
	// 		Logger:     h.log,
	// 		Details:    r.Body,
	// 	})
	// 	return
	// }
	//
	// if valErr != nil {
	// 	respond.Errors(respond.ErrorOptions{
	// 		W:          w,
	// 		R:          r,
	// 		StatusCode: http.StatusBadRequest,
	// 		ClientErr:  message.ErrValidation,
	// 		ActualErr:  valErr,
	// 		Logger:     h.log,
	// 		Details:    req,
	// 	})
	// 	return
	// }
	//
	// aiServiceURL := os.Getenv("AI_SERVICE_URL") // Example: http://ai-service:5000/predict_category
	// aiServiceURL = "http://localhost:5000/predict_category"
	// // aiServiceURL = "http://ai-service:5000/predict_category" // Default for docker-compose
	//
	// // Prepare request for AI service
	// aiReqBody, _ := json.Marshal(map[string]string{"description": req.Description})
	// resp, err := http.Post(aiServiceURL, "application/json", bytes.NewBuffer(aiReqBody))
	// if err != nil {
	// 	log.Printf("Error calling AI service: %v", err)
	// 	http.Error(w, "Failed to connect to AI service", http.StatusInternalServerError)
	// 	return
	// }
	//
	// defer resp.Body.Close()
	//
	// if resp.StatusCode != http.StatusOK {
	// 	bodyBytes, _ := io.ReadAll(resp.Body)
	// 	log.Printf("AI service returned non-OK status: %d, body: %s", resp.StatusCode, string(bodyBytes))
	// 	http.Error(w, fmt.Sprintf("AI service error: %s", string(bodyBytes)), http.StatusBadGateway)
	// 	return
	// }
	//
	// var aiResponse map[string]string
	// if err := json.NewDecoder(resp.Body).Decode(&aiResponse); err != nil {
	// 	log.Printf("Error decoding AI service response: %v", err)
	// 	http.Error(w, "Failed to parse AI service response", http.StatusInternalServerError)
	// 	return
	// }
	//
	// // Optionally, fetch Category ID from DB if predicted category name exists
	// predictedCategoryName := aiResponse["predicted_category"]
	// var categoryID sql.NullString
	// query := `SELECT id FROM categories WHERE name = $1 AND (user_id IS NULL OR user_id = $2)`
	// // err = h.repo.GetDB().QueryRow(query, predictedCategoryName, userID).Scan(&categoryID)
	// if err != nil {
	// 	log.Printf("Could not find category ID for '%s': %v", predictedCategoryName, err)
	// 	// If category not found, return just the name, or an error
	// 	json.NewEncoder(w).Encode(map[string]string{"predicted_category_name": predictedCategoryName, "message": "Category ID not found for predicted name"})
	// 	return
	// }
	//
	// // Found category ID, return it along with name
	// json.NewEncoder(w).Encode(map[string]string{
	// 	"predicted_category_name": predictedCategoryName,
	// 	"predicted_category_id":   categoryID.String,
	// })
}
