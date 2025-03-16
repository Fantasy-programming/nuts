package categories

import "github.com/google/uuid"

// Request/response structures
type CreateCategoryRequest struct {
	Name     string     `json:"name"`
	Type     string     `json:"type"`
	ParentID *uuid.UUID `json:"parent_id,omitempty"`
	Color    string     `json:"color"`
	Icon     string     `json:"icon"`
}

type UpdateCategoryRequest struct {
	Name     *string    `json:"name,omitempty"`
	ParentID *uuid.UUID `json:"parent_id,omitempty"`
	Color    *string    `json:"color,omitempty"`
	Icon     *string    `json:"icon,omitempty"`
}
