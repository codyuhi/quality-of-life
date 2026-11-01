package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strconv"
	"strings"
	"testing"
)

func initTestDB(t *testing.T) {
	if DB != nil {
		return
	}

	dbPath := filepath.Join(t.TempDir(), "test-qol.db")
	if err := InitDB(dbPath); err != nil {
		t.Fatalf("Failed to initialize test SQLite DB: %v", err)
	}

	_, err := DB.Exec(`
		INSERT INTO cities (geoname_id, name, full_name, latitude, longitude, population, timezone, country, continent, urban_area_slug)
		VALUES 
			(5391959, 'San Francisco', 'San Francisco, United States', 37.7749, -122.4194, 883305, 'America/Los_Angeles', 'United States', 'North America', 'san-francisco-bay-area'),
			(5128581, 'New York', 'New York, United States', 40.7128, -74.0060, 8419000, 'America/New_York', 'United States', 'North America', 'new-york')
		ON CONFLICT (geoname_id) DO NOTHING;
	`)
	if err != nil {
		t.Fatalf("Failed to seed test cities: %v", err)
	}

	_, err = DB.Exec(`
		INSERT INTO scores (
			urban_area_slug, housing, cost_of_living, startups, venture_capital,
			travel_connectivity, commute, business_freedom, safety, healthcare,
			education, environmental_quality, economy, taxation, internet_access,
			leisure_and_culture, tolerance, outdoors, summary, teleport_city_score
		) VALUES 
			('san-francisco-bay-area', 2.5, 3.0, 9.8, 9.9, 7.5, 4.5, 8.5, 6.0, 8.0, 8.2, 7.8, 8.5, 5.0, 9.0, 8.5, 8.0, 8.0, '<p>SF summary</p>', 70.5),
			('new-york', 2.0, 2.5, 9.5, 9.2, 8.5, 4.0, 8.0, 6.5, 8.2, 8.5, 7.0, 8.8, 4.5, 9.2, 9.5, 7.8, 7.5, '<p>NY summary</p>', 72.0)
		ON CONFLICT (urban_area_slug) DO NOTHING;
	`)
	if err != nil {
		t.Fatalf("Failed to seed test scores: %v", err)
	}
}

func getFirstGeonameIDAndSlug(t *testing.T) (int, string) {
	initTestDB(t)
	var id int
	var slug string
	err := DB.QueryRow("SELECT geoname_id, urban_area_slug FROM cities LIMIT 1").Scan(&id, &slug)
	if err != nil {
		t.Fatalf("no cities in test database: %v", err)
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

	req, err := http.NewRequest("GET", "/api/cities/?search=San", nil)
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

	req, err := http.NewRequest("GET", "/api/urban_areas/slug:"+slug+"/scores/", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(UrbanAreaScoresHandler)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned unexpected status: got %v", status)
	}
}

func TestUrbanAreaDetailsHandler(t *testing.T) {
	_, slug := getFirstGeonameIDAndSlug(t)

	req, err := http.NewRequest("GET", "/api/urban_areas/slug:"+slug+"/details/", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(UrbanAreaDetailsHandler)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned unexpected status: got %v", status)
	}
}

func TestUrbanAreaImagesHandler(t *testing.T) {
	_, slug := getFirstGeonameIDAndSlug(t)

	req, err := http.NewRequest("GET", "/api/urban_areas/slug:"+slug+"/images/", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(UrbanAreaImagesHandler)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
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

func TestHealthzHandler(t *testing.T) {
	initTestDB(t)

	req, _ := http.NewRequest("GET", "/healthz", nil)
	rr := httptest.NewRecorder()
	HealthzHandler(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("expected 200 for connected DB, got %d", rr.Code)
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

func TestCityCountHandler(t *testing.T) {
	initTestDB(t)

	req, _ := http.NewRequest("GET", "/api/cities/count", nil)
	rr := httptest.NewRecorder()
	CityCountHandler(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rr.Code)
	}
}

func TestCityCountHandlerNilDB(t *testing.T) {
	origDB := DB
	DB = nil
	defer func() { DB = origDB }()

	req, _ := http.NewRequest("GET", "/api/cities/count", nil)
	rr := httptest.NewRecorder()
	CityCountHandler(rr, req)

	if rr.Code != http.StatusInternalServerError && rr.Code != http.StatusServiceUnavailable {
		t.Errorf("expected 500 or 503 for nil DB, got %d", rr.Code)
	}
}

func TestListCitiesHandlerNilDB(t *testing.T) {
	origDB := DB
	DB = nil
	defer func() { DB = origDB }()

	req, _ := http.NewRequest("GET", "/api/cities", nil)
	rr := httptest.NewRecorder()
	ListCitiesHandler(rr, req)

	if rr.Code != http.StatusServiceUnavailable {
		t.Errorf("expected 503 for nil DB, got %d", rr.Code)
	}
}

func TestListCitiesHandler(t *testing.T) {
	initTestDB(t)

	// Test default population sorting
	req, err := http.NewRequest("GET", "/api/cities?page=1&limit=5", nil)
	if err != nil {
		t.Fatal(err)
	}
	rr := httptest.NewRecorder()
	ListCitiesHandler(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var resp map[string]interface{}
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}

	cities, ok := resp["cities"].([]interface{})
	if !ok || len(cities) == 0 {
		t.Errorf("expected non-empty cities array in response")
	}
	pagination, ok := resp["pagination"].(map[string]interface{})
	if !ok {
		t.Errorf("expected pagination object in response")
	} else {
		if sortBy, ok := pagination["sort_by"].(string); !ok || sortBy != "population" {
			t.Errorf("expected sort_by population, got %v", pagination["sort_by"])
		}
	}

	// Test distance sorting with lat/lon
	reqGeo, err := http.NewRequest("GET", "/api/cities?page=1&limit=5&lat=40.7128&lon=-74.0060", nil)
	if err != nil {
		t.Fatal(err)
	}
	rrGeo := httptest.NewRecorder()
	ListCitiesHandler(rrGeo, reqGeo)

	if status := rrGeo.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var respGeo map[string]interface{}
	if err := json.NewDecoder(rrGeo.Body).Decode(&respGeo); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}
	paginationGeo, ok := respGeo["pagination"].(map[string]interface{})
	if ok {
		if sortBy, ok := paginationGeo["sort_by"].(string); !ok || sortBy != "distance" {
			t.Errorf("expected sort_by distance, got %v", paginationGeo["sort_by"])
		}
	}
}

func TestUrbanAreaImageFileHandlerMissingSlug(t *testing.T) {
	req, _ := http.NewRequest("GET", "/api/urban_areas/image-file", nil)
	rr := httptest.NewRecorder()
	UrbanAreaImageFileHandler(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for missing slug, got %d", rr.Code)
	}
}

func TestUrbanAreaImagesHandlerFormatting(t *testing.T) {
	initTestDB(t)

	req, _ := http.NewRequest("GET", "/api/urban_areas/slug:san-francisco-bay-area/images/", nil)
	rr := httptest.NewRecorder()
	UrbanAreaImagesHandler(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("expected 200 OK, got %d", rr.Code)
	}

	var resp CityImageResponse
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if len(resp.Photos) == 0 {
		t.Errorf("expected photos array in response")
	} else {
		if !strings.Contains(resp.Photos[0].Image.Mobile, "/api/urban_areas/slug:san-francisco-bay-area/image-file") {
			t.Errorf("expected mobile image URL to point to image-file endpoint, got %s", resp.Photos[0].Image.Mobile)
		}
	}
}
