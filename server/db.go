package main

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/lib/pq"
)

var DB *sql.DB

// InitDB initializes the database pool and creates tables if they don't exist
func InitDB(host string, port int, user, password, dbname, sslmode string) error {
	connStr := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		host, port, user, password, dbname, sslmode)

	var err error
	DB, err = sql.Open("postgres", connStr)
	if err != nil {
		return fmt.Errorf("failed to open database connection: %w", err)
	}

	if err := DB.Ping(); err != nil {
		return fmt.Errorf("failed to ping database: %w", err)
	}

	log.Println("Successfully connected to the database")

	if err := createTables(); err != nil {
		return fmt.Errorf("failed to create tables: %w", err)
	}

	return nil
}

func createTables() error {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS cities (
			geoname_id INTEGER PRIMARY KEY,
			name VARCHAR(255) NOT NULL,
			full_name VARCHAR(255) NOT NULL,
			latitude DOUBLE PRECISION,
			longitude DOUBLE PRECISION,
			population INTEGER,
			timezone VARCHAR(100),
			country VARCHAR(100),
			continent VARCHAR(100),
			urban_area_slug VARCHAR(100) UNIQUE
		);`,
		`CREATE TABLE IF NOT EXISTS scores (
			urban_area_slug VARCHAR(100) PRIMARY KEY REFERENCES cities(urban_area_slug) ON DELETE CASCADE,
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
