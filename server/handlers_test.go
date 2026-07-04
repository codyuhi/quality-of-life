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
