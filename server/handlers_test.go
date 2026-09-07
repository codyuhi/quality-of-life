package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"strconv"
	"testing"

	"github.com/joho/godotenv"
)

func initTestDB(t *testing.T) {
	if DB != nil {
		return
	}
	// Load .env if it exists
	_ = godotenv.Load()

	dbHost := os.Getenv("DB_HOST")
	dbPortStr := os.Getenv("DB_PORT")
	dbUser := os.Getenv("DB_USER")
	dbPass := os.Getenv("DB_PASSWORD")
	dbName := os.Getenv("DB_NAME")

	if dbHost == "" || dbPortStr == "" || dbUser == "" || dbPass == "" || dbName == "" {
		t.Skip("Skipping database integration tests: missing DB env variables")
		return
	}

	dbPort, err := strconv.Atoi(dbPortStr)
	if err != nil {
		t.Fatalf("Invalid DB_PORT: %v", err)
	}

	if err := InitDB(dbHost, dbPort, dbUser, dbPass, dbName, "disable"); err != nil {
		t.Fatalf("Failed to initialize test DB: %v", err)
	}
}

func getFirstGeonameIDAndSlug(t *testing.T) (int, string) {
	initTestDB(t)
	var id int
	var slug string
	err := DB.QueryRow("SELECT geoname_id, urban_area_slug FROM cities LIMIT 1").Scan(&id, &slug)
	if err != nil {
		t.Skip("Skipping details test: no cities in test database")
	}
	return id, slug
}

func TestGetBaseURL(t *testing.T) {
	// Standard HTTP request
	req1, _ := http.NewRequest("GET", "http://localhost:5001/api/cities/", nil)
	if url := getBaseURL(req1); url != "http://localhost:5001" {
		t.Errorf("expected http://localhost:5001, got %s", url)
	}

	// Reverse proxy with X-Forwarded-Proto and X-Forwarded-Host
	req2, _ := http.NewRequest("GET", "http://backend-svc:5001/api/cities/", nil)
	req2.Header.Set("X-Forwarded-Proto", "https")
	req2.Header.Set("X-Forwarded-Host", "quality-of-life.minipc.local")
	if url := getBaseURL(req2); url != "https://quality-of-life.minipc.local" {
		t.Errorf("expected https://quality-of-life.minipc.local, got %s", url)
	}
}

func TestSearchCitiesHandler(t *testing.T) {
	initTestDB(t)

	req, err := http.NewRequest("GET", "/api/cities/?search=a", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(SearchCitiesHandler)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var resp map[string]interface{}
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}

	if _, ok := resp["_embedded"]; !ok {
		t.Errorf("Response missing _embedded key")
	}
	if _, ok := resp["count"]; !ok {
		t.Errorf("Response missing count key")
	}
}

func TestSearchCitiesMissingParam(t *testing.T) {
	req, err := http.NewRequest("GET", "/api/cities/", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(SearchCitiesHandler)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusBadRequest {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusBadRequest)
	}
}

func TestCityDetailsHandler(t *testing.T) {
	id, _ := getFirstGeonameIDAndSlug(t)

	req, err := http.NewRequest("GET", "/api/cities/geonameid:"+strconv.Itoa(id)+"/", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(CityDetailsHandler)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var resp map[string]interface{}
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}

	if name, ok := resp["name"].(string); !ok || name == "" {
		t.Errorf("Response name is missing or invalid")
	}
}

func TestCityDetailsNotFound(t *testing.T) {
	initTestDB(t)

	req, err := http.NewRequest("GET", "/api/cities/geonameid:9999999/", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(CityDetailsHandler)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusNotFound {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusNotFound)
	}
}

func TestUrbanAreaScoresHandler(t *testing.T) {
	_, slug := getFirstGeonameIDAndSlug(t)
	if slug == "" {
		t.Skip("Skipping scores test: city has no urban area slug")
	}

	req, err := http.NewRequest("GET", "/api/urban_areas/slug:"+slug+"/scores/", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(UrbanAreaScoresHandler)
	handler.ServeHTTP(rr, req)

	// Since mock database might not have the score record, we accept OK or NotFound
	if status := rr.Code; status != http.StatusOK && status != http.StatusNotFound {
		t.Errorf("handler returned unexpected status: got %v", status)
	}
}

func TestUrbanAreaDetailsHandler(t *testing.T) {
	_, slug := getFirstGeonameIDAndSlug(t)
	if slug == "" {
		t.Skip("Skipping details test: city has no urban area slug")
	}

	req, err := http.NewRequest("GET", "/api/urban_areas/slug:"+slug+"/details/", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(UrbanAreaDetailsHandler)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK && status != http.StatusNotFound {
		t.Errorf("handler returned unexpected status: got %v", status)
	}
}

func TestUrbanAreaImagesHandler(t *testing.T) {
	_, slug := getFirstGeonameIDAndSlug(t)
	if slug == "" {
		t.Skip("Skipping images test: city has no urban area slug")
	}

	req, err := http.NewRequest("GET", "/api/urban_areas/slug:"+slug+"/images/", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(UrbanAreaImagesHandler)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK && status != http.StatusNotFound {
		t.Errorf("handler returned unexpected status: got %v", status)
	}
}

func TestGenerateSlug(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"Portland-Maine", "portland-maine"},
		{"San Francisco Bay Area-California", "san-francisco-bay-area-california"},
		{"Tel Aviv-Israel", "tel-aviv-israel"},
		{"St. Louis-Missouri", "st-louis-missouri"},
	}

	for _, tt := range tests {
		got := generateSlug(tt.input)
		if got != tt.expected {
			t.Errorf("generateSlug(%q) = %q; want %q", tt.input, got, tt.expected)
		}
	}
}

func TestHealthzHandlerNilDB(t *testing.T) {
	origDB := DB
	DB = nil
	defer func() { DB = origDB }()

	req, _ := http.NewRequest("GET", "/healthz", nil)
	rr := httptest.NewRecorder()
	HealthzHandler(rr, req)

	if rr.Code != http.StatusServiceUnavailable {
		t.Errorf("expected 503 for nil DB, got %d", rr.Code)
	}
}
