package utils

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"strings"
)

type Messages map[string]interface{}

var localeMessages = make(map[string]Messages)

// LoadLocales loads all locale files
func LoadLocales() error {
	locales := []string{"en", "ko"}

	for _, locale := range locales {
		filename := fmt.Sprintf("locales/%s.json", locale)
		data, err := ioutil.ReadFile(filename)
		if err != nil {
			return fmt.Errorf("failed to read locale file %s: %v", filename, err)
		}

		var messages Messages
		if err := json.Unmarshal(data, &messages); err != nil {
			return fmt.Errorf("failed to parse locale file %s: %v", filename, err)
		}

		localeMessages[locale] = messages
	}

	return nil
}

// GetMessage retrieves a localized message
func GetMessage(locale, key string, fallback ...string) string {
	if locale == "" {
		locale = "ko" // default to Korean
	}

	messages, exists := localeMessages[locale]
	if !exists {
		messages = localeMessages["ko"] // fallback to Korean
	}

	// Navigate through nested keys (e.g., "auth.login_successful")
	keys := strings.Split(key, ".")
	current := messages

	for _, k := range keys {
		if next, ok := current[k]; ok {
			switch v := next.(type) {
			case string:
				return v
			case map[string]interface{}:
				current = v
			default:
				break
			}
		} else {
			break
		}
	}

	// Return fallback if provided, otherwise return the key
	if len(fallback) > 0 {
		return fallback[0]
	}
	return key
}

// GetLocaleFromHeader extracts locale from Accept-Language header
func GetLocaleFromHeader(acceptLanguage string) string {
	if acceptLanguage == "" {
		return "ko" // Default: Korean
	}

	acceptLanguageLower := strings.ToLower(acceptLanguage)

	// Use Korean if Korean is included
	if strings.Contains(acceptLanguageLower, "ko") {
		return "ko"
	}

	// Use English if Korean is not present
	return "en"
}
