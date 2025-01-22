package auth

type TranslationKey struct {
	Tag     string
	Message string
}

var translations = map[string][]TranslationKey{
	"en": {
		{Tag: "required", Message: "The {0} field is required"},
		{Tag: "email", Message: "Please enter a valid email address"},
		{Tag: "min", Message: "The {0} must be at least {1} characters"},
		{Tag: "max", Message: "The {0} cannot be longer than {1} characters"},
		{Tag: "strong_password", Message: "Password must contain at least one uppercase letter, one number and one special character"},
		{Tag: "unique_email", Message: "This email is already registered"},
	},
	"fr": {
		{Tag: "required", Message: "Le champ {0} est obligatoire"},
		{Tag: "email", Message: "Veuillez saisir une adresse e-mail valide"},
		{Tag: "min", Message: "Le {0} doit contenir au moins {1} caractères"},
		{Tag: "max", Message: "Le {0} ne peut pas dépasser {1} caractères"},
		{Tag: "strong_password", Message: "Le mot de passe doit contenir au moins une lettre majuscule, un chiffre et 8 caractères"},
		{Tag: "unique_email", Message: "Cet e-mail est déjà enregistré"},
	},
	"es": {
		{Tag: "required", Message: "El campo {0} es obligatorio"},
		{Tag: "email", Message: "Por favor, introduce un correo electrónico válido"},
		{Tag: "min", Message: "El {0} debe tener al menos {1} caracteres"},
		{Tag: "max", Message: "El {0} no puede tener más de {1} caracteres"},
		{Tag: "strong_password", Message: "La contraseña debe contener al menos una letra mayúscula, un número y 8 caracteres"},
		{Tag: "unique_email", Message: "Este correo electrónico ya está registrado"},
	},
}
