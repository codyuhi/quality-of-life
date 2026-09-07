package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

func main() {
	// Load .env file if it exists
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Read database config
	dbHost := requireEnv("DB_HOST")
	dbPortStr := requireEnv("DB_PORT")
	dbUser := requireEnv("DB_USER")
	dbPass := requireEnv("DB_PASSWORD")
	dbName := requireEnv("DB_NAME")
	dbSSL := getEnv("DB_SSLMODE", "disable")

	dbPort, err := strconv.Atoi(dbPortStr)
	if err != nil {
		log.Fatalf("Invalid DB_PORT: %s", dbPortStr)
	}

	// Initialize database
	if err := InitDB(dbHost, dbPort, dbUser, dbPass, dbName, dbSSL); err != nil {
		log.Fatalf("Database initialization failed: %v", err)
	}
	defer DB.Close()

	// Seed database if empty in the background
	go func() {
		if err := SeedDatabase(); err != nil {
			log.Printf("Seeder warnings or errors: %v", err)
		}
	}()

	// Bind handlers
	http.HandleFunc("/healthz", withCORS(HealthzHandler))

	http.HandleFunc("/api/cities/", withCORS(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Query().Get("search") != "" {
			SearchCitiesHandler(w, r)
		} else {
			CityDetailsHandler(w, r)
		}
	}))

	http.HandleFunc("/api/urban_areas/", withCORS(func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path
		if strings.Contains(path, "/scores") {
			UrbanAreaScoresHandler(w, r)
		} else if strings.Contains(path, "/details") {
			UrbanAreaDetailsHandler(w, r)
		} else if strings.Contains(path, "/images") {
			UrbanAreaImagesHandler(w, r)
		} else {
			writeError(w, http.StatusNotFound, "Endpoint not found")
		}
	}))

	// Start server
	port := getEnv("PORT", "5001")
	log.Printf("Starting backend server on port %s...", port)
	if err := http.ListenAndServe(fmt.Sprintf(":%s", port), nil); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}

func getEnv(key, defaultVal string) string {
	if val, ok := os.LookupEnv(key); ok {
		return val
	}
	return defaultVal
}

func requireEnv(key string) string {
	val := os.Getenv(key)
	if val == "" {
		log.Fatalf("Required environment variable %s is not set", key)
	}
	return val
}
