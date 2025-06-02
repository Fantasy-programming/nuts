package config

import "github.com/kelseyhightower/envconfig"

type Integrations struct {
	EnabledFinancialProviders []string `split_words:"true" required:"false"`

	// Teller.io
	TellerEnvironment        string `split_words:"true" required:"false" default:"sandbox"`
	TellerBaseUri            string `split_words:"true" required:"false" default:"https://api.teller.io"`
	TellerCertPath           string `split_words:"true" required:"false"`
	TellerCertPrivateKeyPath string `split_words:"true" required:"false"`

	// Plaid
	PlaidEnvironment string `split_words:"true" required:"false" default:"sandbox"`
	PlaidClientId    string `split_words:"true" required:"false"`
	PlaidSecret      string `split_words:"true" required:"false"`
	PlaidBaseUri     string `split_words:"true" required:"false" default:"https://production.plaid.com"`
	PlaidWebhookUri  string `split_words:"true" required:"false"`

	// GoCardless
	GoCardlessSecretId  string `split_words:"true" required:"false"`
	GoCardlessSecretKey string `split_words:"true" required:"false"`
	GoCardlessBaseUri   string `split_words:"true" required:"false" default:"https://ob.gocardless.com"`

	// Mono.co
	MonoSecretKey string `split_words:"true" required:"false"`
	MonoBaseUri   string `split_words:"true" required:"false" default:"https://api.mono.co"`

	// Brankas
	BrankasApiKey  string `split_words:"true" required:"false"`
	BrankasBaseUri string `split_words:"true" required:"false" default:"https://api.brankas.com"`

	// Payments
	PaymentApiProvider     string `required:"false"`
	PayStackPrivateKeyPath string `required:"false"`
	PayBoxPrivateKey       string `required:"false"`
}

func INTEGRATIONS() Integrations {
	var integrations Integrations
	envconfig.MustProcess("INTEGRATION", &integrations)
	return integrations
}
