package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"

	_ "modernc.org/sqlite"
)

var DB *sql.DB

// InitDB initializes the SQLite database and creates tables if they don't exist
func InitDB(dbPath string) error {
	if dbPath == "" {
		dbPath = os.Getenv("DB_PATH")
		if dbPath == "" {
			dbPath = "/app/data/quality-of-life.db"
		}
	}

	// Ensure parent directory exists for file-based database
	if dir := filepath.Dir(dbPath); dir != "." && dir != "" {
		if err := os.MkdirAll(dir, 0755); err != nil {
			return fmt.Errorf("failed to create db directory %s: %w", dir, err)
		}
	}

	var err error
	DB, err = sql.Open("sqlite", dbPath)
	if err != nil {
		return fmt.Errorf("failed to open sqlite database: %w", err)
	}

	pragmas := []string{
		"PRAGMA journal_mode = WAL;",
		"PRAGMA synchronous = NORMAL;",
		"PRAGMA foreign_keys = ON;",
		"PRAGMA busy_timeout = 5000;",
	}

	for _, pragma := range pragmas {
		if _, err := DB.Exec(pragma); err != nil {
			log.Printf("Warning: failed to execute pragma %s: %v", pragma, err)
		}
	}

	if err := DB.Ping(); err != nil {
		return fmt.Errorf("failed to ping database: %w", err)
	}

	log.Printf("Successfully connected to SQLite database at %s", dbPath)

	if err := createTables(); err != nil {
		return fmt.Errorf("failed to create tables: %w", err)
	}

	return nil
}

// EnsureTables ensures cities and scores tables exist in the database
func EnsureTables() error {
	if DB == nil {
		return fmt.Errorf("database connection is nil")
	}
	return createTables()
}

func createTables() error {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS cities (
			geoname_id INTEGER PRIMARY KEY,
			name TEXT NOT NULL,
			full_name TEXT NOT NULL,
			latitude REAL,
			longitude REAL,
			population INTEGER,
			timezone TEXT,
			country TEXT,
			continent TEXT,
			urban_area_slug TEXT UNIQUE
		);`,
		`CREATE INDEX IF NOT EXISTS idx_cities_name ON cities(name);`,
		`CREATE INDEX IF NOT EXISTS idx_cities_country ON cities(country);`,
		`CREATE INDEX IF NOT EXISTS idx_cities_full_name ON cities(full_name);`,
		`CREATE INDEX IF NOT EXISTS idx_cities_slug ON cities(urban_area_slug);`,
		`CREATE TABLE IF NOT EXISTS scores (
			urban_area_slug TEXT PRIMARY KEY REFERENCES cities(urban_area_slug) ON DELETE CASCADE,
			housing REAL,
			cost_of_living REAL,
			startups REAL,
			venture_capital REAL,
			travel_connectivity REAL,
			commute REAL,
			business_freedom REAL,
			safety REAL,
			healthcare REAL,
			education REAL,
			environmental_quality REAL,
			economy REAL,
			taxation REAL,
			internet_access REAL,
			leisure_and_culture REAL,
			tolerance REAL,
			outdoors REAL,
			summary TEXT,
			teleport_city_score REAL
		);`,
	}

	for _, query := range queries {
		if _, err := DB.Exec(query); err != nil {
			return err
		}
	}

	log.Println("Database tables initialized successfully")
	return nil
}
