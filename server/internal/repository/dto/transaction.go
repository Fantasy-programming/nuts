package dto

type Details struct {
	PaymentMedium *string `json:"payment_medium"`
	Location      *string `json:"location"`
	Note          *string `json:"note"`
	PaymentStatus *string `json:"payment_status"`
}
