package webhooks

type WebhookRequest struct {
	Name        string   `json:"name" validate:"required,min=1,max=100"`
	URL         string   `json:"url" validate:"required,url"`
	Description string   `json:"description" validate:"max=500"`
	Events      []string `json:"events" validate:"required,min=1,dive,oneof=create update delete"`
	Secret      string   `json:"secret" validate:"required,min=8"`
}

type WebhookUpdateRequest struct {
	Name        *string  `json:"name" validate:"required,min=1,max=100"`
	URL         *string  `json:"url" validate:"required,url"`
	Description *string  `json:"description" validate:"max=500"`
	Events      []string `json:"events" validate:"required,min=1,dive,oneof=create update delete"`
	Active      *bool    `json:"active"`
}
