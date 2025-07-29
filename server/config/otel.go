package config

import (
	"github.com/kelseyhightower/envconfig"
)

type Otel struct {
	Enabled                                  bool    `split_words:"true" default:"false"`
	OtlpEndpoint                             string  `split_words:"true"`
	OtlpEnvironment                          string  `split_words:"true" default:"development"`
	OtlpServiceName                          string  `split_words:"true" default:"nuts_server"`
	OtlpServiceVersion                       string  `split_words:"true" default:"0.1.0"`
	OtlpMeterName                            string  `split_words:"true" default:"nuts_count"`
	OtlpSamplerRatio                         float32 `split_words:"true" default:"0.1"`
	ResourceAttributes                       string  `split_words:"true"`
	ExporterOtlpEndpoint                     string  `split_words:"true"`
	ExporterOtlpHeaders                      string  `split_words:"true" default:"api-key=<your_license_key>"`
	AttributeValueLengthLimit                int     `split_words:"true" default:"4095"`
	ExporterOtlpCompression                  string  `split_words:"true" default:"gzip"`
	ExporterOtlpProtocol                     string  `split_words:"true" default:"http/protobuf"`
	ExporterOtlpMetricsTemporalityPreference string  `split_words:"true" default:"delta"`
}

func OTEL() Otel {
	var otel Otel
	envconfig.MustProcess("OTEL", &otel)

	return otel
}
