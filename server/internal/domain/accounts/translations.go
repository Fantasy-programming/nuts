package accounts

type TranslationKey struct {
	Tag     string
	Message string
}

var translations = map[string][]TranslationKey{
	"en": {
		{Tag: "name.required", Message: "The name is required"},
		{Tag: "type.required", Message: "The account type is required"},
		{Tag: "currency.required", Message: "The currency is required"},
		{Tag: "color.required", Message: "The color is required"},
		{Tag: "balance.required", Message: "The balance is required"},
	},
	"fr": {
		{Tag: "name.required", Message: "Le nom est obligatoire"},
		{Tag: "type.required", Message: "Le type de compte est obligatoire"},
		{Tag: "currency.required", Message: "La devise est obligatoire"},
		{Tag: "color.required", Message: "La couleur est obligatoire"},
		{Tag: "balance.required", Message: "Le solde est obligatoire"},
	},
	"es": {
		{Tag: "name.required", Message: "El nombre es obligatorio"},
		{Tag: "type.required", Message: "El tipo de cuenta es obligatorio"},
		{Tag: "currency.required", Message: "La moneda es obligatoria"},
		{Tag: "color.required", Message: "El color es obligatorio"},
		{Tag: "balance.required", Message: "El saldo es obligatorio"},
	},
}
