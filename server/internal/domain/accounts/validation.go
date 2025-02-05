package accounts

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/internal/repository"
	"github.com/Fantasy-Programming/nuts/internal/utility/message"
	ut "github.com/go-playground/universal-translator"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
)

type CreateAccountRequest struct {
	Meta     *[]byte `json:"meta,omitempty" validate:"omitempty"`
	Name     string  `json:"name" validate:"required"`
	Type     string  `json:"type" validate:"required"`
	Currency string  `json:"currency" validate:"required"`
	Colors   string  `json:"color" validate:"required"`
	Balance  float64 `json:"balance" validate:"gte=0"`
}

type UpdateAccountRequest struct {
	Name     *string  `json:"name" validate:"required"`
	Type     *string  `json:"type" validate:"required"`
	Balance  *float64 `json:"balance" validate:"required"`
	Currency *string  `json:"currency" validate:"required"`
	Colors   *string  `json:"color" validate:"required"`
	Meta     *[]byte  `json:"meta,omitempty" validate:"omitempty"`
}

// Extract pathParam & parse into uuid
func parseUUID(r *http.Request, paramName string) (uuid.UUID, error) {
	idStr := r.URL.Query().Get(paramName)
	if idStr == "" {
		return uuid.Nil, message.ErrMissingParams
	}
	return uuid.Parse(idStr)
}

func validateAccountType(input string) (repository.ACCOUNTTYPE, error) {
	var act repository.ACCOUNTTYPE
	if err := act.Scan(input); err != nil || !act.Valid() {
		return act, message.ErrBadRequest
	}
	return act, nil
}

func validateNullableAccountType(input string) (repository.NullACCOUNTTYPE, error) {
	var act repository.NullACCOUNTTYPE
	if err := act.Scan(input); err != nil || !act.ACCOUNTTYPE.Valid() {
		return act, message.ErrBadRequest
	}
	return act, nil
}

func validateColor(input string) (repository.COLORENUM, error) {
	var color repository.COLORENUM
	if err := color.Scan(input); err != nil || !color.Valid() {
		return color, message.ErrBadRequest
	}
	return color, nil
}

func validateNullableColor(input string) (repository.NullCOLORENUM, error) {
	var color repository.NullCOLORENUM
	if err := color.Scan(input); err != nil || !color.COLORENUM.Valid() {
		return color, message.ErrBadRequest
	}
	return color, nil
}

func parseMeta(meta *[]byte) []byte {
	if meta != nil {
		return []byte(*meta)
	}
	return nil
}

// Register translations for all supported languages
func (a *Account) registerValidations() {
	// nil checks
	if a.validate == nil || a.validate.Validator == nil {
		return
	}

	for lang, trans := range translations {
		translator, _ := a.validate.GetTranslator(lang)
		registerTranslations(a.validate.Validator, translator, trans)
	}
}

func registerTranslations(v *validator.Validate, trans ut.Translator, translations []TranslationKey) {
	for _, t := range translations {
		v.RegisterTranslation(t.Tag, trans,
			func(ut ut.Translator) error {
				return ut.Add(t.Tag, t.Message, true)
			},
			func(ut ut.Translator, fe validator.FieldError) string {
				t, _ := ut.T(fe.Tag(), fe.Field())
				return t
			},
		)
	}
}
