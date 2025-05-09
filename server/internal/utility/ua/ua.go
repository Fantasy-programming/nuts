package ua

import (
	"sync"

	"github.com/medama-io/go-useragent"
)

var (
	parser *useragent.Parser
	once   sync.Once
)

// Get returns a singleton user-agent parser.
func Get() *useragent.Parser {
	once.Do(func() {
		parser = useragent.NewParser()
	})
	return parser
}
