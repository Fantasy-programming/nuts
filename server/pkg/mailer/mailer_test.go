package mailer

import (
	"context"
	"testing"
)

func TestNewService(t *testing.T) {
	config := Config{
		Host:      "localhost",
		Port:      587,
		Username:  "test@example.com",
		Password:  "password",
		FromEmail: "noreply@nuts.app",
		FromName:  "Nuts App",
	}
	
	service := NewService(config)
	if service == nil {
		t.Fatal("Expected service to be created, got nil")
	}
}

func TestEmailStructure(t *testing.T) {
	email := &Email{
		To:      []string{"test@example.com"},
		Subject: "Test Subject",
		Body:    "Test body",
		IsHTML:  false,
	}
	
	if len(email.To) != 1 {
		t.Errorf("Expected 1 recipient, got %d", len(email.To))
	}
	
	if email.To[0] != "test@example.com" {
		t.Errorf("Expected recipient to be test@example.com, got %s", email.To[0])
	}
}

func TestSendTemplateEmail(t *testing.T) {
	config := Config{
		Host:      "localhost",
		Port:      587,
		Username:  "test@example.com",
		Password:  "password",
		FromEmail: "noreply@nuts.app",
		FromName:  "Nuts App",
	}
	
	service := NewService(config)
	ctx := context.Background()
	
	// This test will not actually send email, just test the method structure
	// In a real environment, you'd mock the dialer or use a test SMTP server
	err := service.SendTemplateEmail(ctx, []string{"test@example.com"}, "welcome", map[string]interface{}{
		"name": "John Doe",
	})
	
	// We expect this to fail since we don't have a real SMTP server
	// but we want to ensure the method doesn't panic
	if err == nil {
		t.Log("SendTemplateEmail executed without error (unexpected in test environment)")
	} else {
		t.Logf("SendTemplateEmail failed as expected in test environment: %v", err)
	}
}