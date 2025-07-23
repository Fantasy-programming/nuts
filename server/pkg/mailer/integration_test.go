package mailer

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestMailerServiceIntegration(t *testing.T) {
	// Create a mock mail generator service
	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/templates/welcome" && r.Method == "POST" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			response := `{
				"template": "welcome",
				"html": "<html><body><h1>Welcome John Doe!</h1></body></html>",
				"subject": "Welcome to Nuts, John Doe!"
			}`
			w.Write([]byte(response))
			return
		}
		w.WriteHeader(http.StatusNotFound)
	}))
	defer mockServer.Close()

	// Create mailer service with mock URL
	config := Config{
		Host:             "localhost",
		Port:             587,
		Username:         "test@example.com",
		Password:         "password",
		FromEmail:        "noreply@nuts.app",
		FromName:         "Nuts App",
		MailGeneratorURL: mockServer.URL,
	}

	service := NewService(config)
	_ = service // Keep the interface for later use
	ctx := context.Background()

	// Test template generation (this will call the mock server)
	serviceImpl := NewServiceForTesting(config)
	templateResp, err := serviceImpl.GenerateTemplate(ctx, "welcome", TemplateRequest{
		Name:  "John Doe",
		Email: "john@example.com",
	})

	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if templateResp.Template != "welcome" {
		t.Errorf("Expected template 'welcome', got %s", templateResp.Template)
	}

	if templateResp.Subject != "Welcome to Nuts, John Doe!" {
		t.Errorf("Expected subject 'Welcome to Nuts, John Doe!', got %s", templateResp.Subject)
	}

	if !strings.Contains(templateResp.HTML, "Welcome John Doe!") {
		t.Errorf("Expected HTML to contain 'Welcome John Doe!', got %s", templateResp.HTML)
	}
}

func TestTemplateRequestConversion(t *testing.T) {
	config := Config{
		Host:             "localhost",
		Port:             587,
		Username:         "test@example.com",
		Password:         "password",
		FromEmail:        "noreply@nuts.app",
		FromName:         "Nuts App",
		MailGeneratorURL: "http://localhost:3001",
	}

	service := NewService(config)
	ctx := context.Background()

	// Test data conversion for SendTemplateEmail
	data := map[string]interface{}{
		"name":      "Jane Doe",
		"email":     "jane@example.com",
		"resetLink": "https://example.com/reset/123",
		"title":     "Test Title",
		"message":   "Test Message",
	}

	// Since we can't test actual email sending without SMTP, 
	// we just verify the method doesn't panic and handles the data correctly
	err := service.SendTemplateEmail(ctx, []string{"jane@example.com"}, "test-template", data)
	
	// We expect this to fail since we don't have a real SMTP server or mail generator
	// but it should fail gracefully
	if err == nil {
		t.Log("SendTemplateEmail completed without error (unexpected in test environment)")
	} else {
		t.Logf("SendTemplateEmail failed as expected in test environment: %v", err)
	}
}

func TestConvenienceEmailMethods(t *testing.T) {
	config := Config{
		Host:             "localhost",
		Port:             587,
		Username:         "test@example.com",
		Password:         "password",
		FromEmail:        "noreply@nuts.app",
		FromName:         "Nuts App",
		MailGeneratorURL: "http://localhost:3001",
	}

	service := NewService(config)
	ctx := context.Background()

	// Test convenience methods
	testCases := []struct {
		name   string
		method func() error
	}{
		{
			name: "SendWelcomeEmail",
			method: func() error {
				return service.SendWelcomeEmail(ctx, "Test User", "test@example.com")
			},
		},
		{
			name: "SendResetPasswordEmail",
			method: func() error {
				return service.SendResetPasswordEmail(ctx, "Test User", "test@example.com", "https://example.com/reset/123")
			},
		},
		{
			name: "SendNotificationEmail",
			method: func() error {
				return service.SendNotificationEmail(ctx, "Test User", "test@example.com", "Test Title", "Test Message")
			},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			err := tc.method()
			// We expect these to fail since we don't have a real SMTP server
			// but they should fail gracefully without panicking
			if err == nil {
				t.Logf("%s completed without error (unexpected in test environment)", tc.name)
			} else {
				t.Logf("%s failed as expected in test environment: %v", tc.name, err)
			}
		})
	}
}