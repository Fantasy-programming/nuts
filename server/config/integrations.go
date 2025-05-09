package config

import "github.com/kelseyhightower/envconfig"

type Integrations struct {
	BankApiProvider          string `split_words:"true" required:"false"`
	TellerApiEnv             string `split_words:"true" required:"false" default:"sandbox"`
	TellerCertPath           string `split_words:"true" required:"false"`
	TellerCertPrivateKeyPath string `split_words:"true" required:"false"`

	PaymentApiProvider     string `required:"false"`
	PayStackPrivateKeyPath string `required:"false"`
	PayBoxPrivateKey       string `required:"false"`
}

func INTEGRATIONS() Integrations {
	var integrations Integrations
	envconfig.MustProcess("INTEGRATION", &integrations)
	return integrations
}
