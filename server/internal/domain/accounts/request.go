package accounts

type CreateAccountRequest struct {
	Meta     *[]byte `json:"meta,omitempty" validate:"omitempty"`
	Name     string  `json:"name" validate:"required"`
	Type     string  `json:"type" validate:"required"`
	Currency string  `json:"currency" validate:"required"`
	Colors   string  `json:"color" validate:"required"`
	Balance  float64 `json:"balance" validate:"required"`
}

type UpdateAccountRequest struct {
	Name     *string  `json:"name"`
	Type     *string  `json:"type"`
	Balance  *float64 `json:"balance"`
	Currency *string  `json:"currency"`
	Colors   *string  `json:"color"`
	Meta     *[]byte  `json:"meta,omitempty"`
}
