package log

import (
	"fmt"
	"runtime"
	"strings"

	"github.com/rs/zerolog"
)

// WithStackTrace adds a formatted stack trace to the zerolog event
func WithStackTrace(e *zerolog.Event) *zerolog.Event {
	// Skip 2 frames to ignore this function and its caller
	stackTrace := captureStackTrace(0)
	return e.Str("stack_trace", stackTrace)
}

// captureStackTrace returns a formatted stack trace string
// skipping the specified number of frames
func captureStackTrace(skip int) string {
	// Capture up to 32 frames
	pc := make([]uintptr, 32)
	n := runtime.Callers(skip+1, pc)

	if n == 0 {
		return ""
	}

	frames := runtime.CallersFrames(pc[:n])
	var builder strings.Builder

	// Process each frame
	for {
		frame, more := frames.Next()

		// Skip runtime internal frames
		if !strings.Contains(frame.File, "runtime/") {
			// Format as "file:line function"
			fmt.Fprintf(&builder, "%s:%d %s\n", frame.File, frame.Line, frame.Function)
		}

		if !more {
			break
		}
	}

	return builder.String()
}
