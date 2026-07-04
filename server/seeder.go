package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"regexp"
	"strconv"
	"strings"
	"time"
)

// SeedDatabase checks if database is seeded, if not downloads and populates data
func SeedDatabase() error {
	var count int
	err := DB.QueryRow("SELECT COUNT(*) FROM cities").Scan(&count)
	if err != nil {
		return fmt.Errorf("failed to query cities count: %w", err)
	}

	if count > 0 {
		log.Println("Database already seeded. Skipping seeder.")
		return nil
	}

	log.Println("Database is empty. Starting database seeding process...")

	// 1. Download ARFF file
	url := "https://www.openml.org/data/v1/download/22102652/City-Quality-of-Life-Dataset.arff"
	log.Printf("Downloading OpenML dataset from %s...", url)
	resp, err := http.Get(url)
	if err != nil {
		return fmt.Errorf("failed to download ARFF: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("bad status code: %d", resp.StatusCode)
	}

	// 2. Parse ARFF file
	citiesData, err := parseARFF(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to parse ARFF: %w", err)
	}
	log.Printf("Successfully parsed %d cities from ARFF file", len(citiesData))

	// 3. Resolve metadata and scores
	for i, city := range citiesData {
		log.Printf("[Seeder] [%d/%d] Resolving details for city: %s, %s", i+1, len(citiesData), city.Name, city.Country)
		
		// Query GeoDB API
		metadata, err := resolveCityMetadata(city.Name, city.Country)
		if err != nil {
			log.Printf("[Seeder] Warning: could not resolve metadata for %s: %v. Using fallbacks.", city.Name, err)
			metadata = getDefaultMetadata(city.Name, city.Country, city.Continent, i)
		}

		city.GeonameID = metadata.GeonameID
		city.Latitude = metadata.Latitude
		city.Longitude = metadata.Longitude
		city.Population = metadata.Population
		city.Timezone = metadata.Timezone
		city.Country = metadata.Country // Normalized country
		city.Slug = generateSlug(city.Name + "-" + city.Country)

		// Insert into DB
		if err := insertCityData(city); err != nil {
			log.Printf("[Seeder] Error inserting city %s: %v", city.Name, err)
		}

		// Wait 1.2 seconds between requests to respect GeoDB free tier rate limits (1 request/sec)
		time.Sleep(1200 * time.Millisecond)
	}

	log.Println("Database seeding completed successfully!")
	return nil
}

type ParsedCity struct {
	GeonameID      int
	Name           string
	Country        string
	Continent      string
	Latitude       float64
	Longitude      float64
	Population     int
	Timezone       string
	Slug           string
	Scores         [17]float32
}

func parseARFF(r io.Reader) ([]*ParsedCity, error) {
	var cities []*ParsedCity
	scanner := bufio.NewScanner(r)
	inDataSection := false

	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "%") {
			continue
		}

		if strings.HasPrefix(strings.ToUpper(line), "@DATA") {
			inDataSection = true
			continue
		}

		if !inDataSection {
			continue
		}

		// Parse data row
		parts, err := parseCSVLine(line)
		if err != nil || len(parts) < 21 {
			continue
		}

		city := &ParsedCity{
			Name:      cleanStr(parts[1]),
			Country:   cleanStr(parts[2]),
			Continent: cleanStr(parts[3]),
		}

		for idx := 0; idx < 17; idx++ {
			score, err := strconv.ParseFloat(parts[4+idx], 32)
			if err != nil {
				score = 0.0
			}
			city.Scores[idx] = float32(score)
		}

		cities = append(cities, city)
	}

	return cities, scanner.Err()
}

func parseCSVLine(line string) ([]string, error) {
	var result []string
	var current bytes.Buffer
	inQuotes := false

	for i := 0; i < len(line); i++ {
		char := line[i]
		if char == '\'' {
			inQuotes = !inQuotes
		} else if char == ',' && !inQuotes {
			result = append(result, current.String())
			current.Reset()
		} else {
			current.WriteByte(char)
		}
	}
	result = append(result, current.String())

	return result, nil
}

func cleanStr(s string) string {
	s = strings.TrimSpace(s)
	s = strings.Trim(s, "'")
	return strings.TrimSpace(s)
}

type GeoDBMetadata struct {
	GeonameID  int
	Latitude   float64
	Longitude  float64
	Population int
	Timezone   string
	Country    string
}

func resolveCityMetadata(cityName, countryName string) (*GeoDBMetadata, error) {
	// 1. Search city to get ID
	searchURL := fmt.Sprintf("http://geodb-free-service.wirefreethought.com/v1/geo/cities?namePrefix=%s&limit=1", url.QueryEscape(cityName))
	
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(searchURL)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("search failed with status: %d", resp.StatusCode)
	}

	var searchResult struct {
		Data []struct {
			ID          int     `json:"id"`
			City        string  `json:"city"`
			Country     string  `json:"country"`
			Latitude    float64 `json:"latitude"`
			Longitude   float64 `json:"longitude"`
			Population  int     `json:"population"`
		} `json:"data"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&searchResult); err != nil {
		return nil, err
	}

	if len(searchResult.Data) == 0 {
		return nil, fmt.Errorf("city not found in GeoDB")
	}

	cityID := searchResult.Data[0].ID

	// Wait a moment between search and detail query to respect rate limits
	time.Sleep(500 * time.Millisecond)

	// 2. Fetch full city details (for timezone)
	detailURL := fmt.Sprintf("http://geodb-free-service.wirefreethought.com/v1/geo/cities/%d", cityID)
	respDetail, err := client.Get(detailURL)
	if err != nil {
		return nil, err
	}
	defer respDetail.Body.Close()

	if respDetail.StatusCode != http.StatusOK {
		// If details query fails, return what we have from search
		return &GeoDBMetadata{
			GeonameID:  cityID,
			Latitude:   searchResult.Data[0].Latitude,
			Longitude:  searchResult.Data[0].Longitude,
			Population: searchResult.Data[0].Population,
			Timezone:   "UTC",
			Country:    searchResult.Data[0].Country,
		}, nil
	}

	var detailResult struct {
		Data struct {
			Timezone string `json:"timezone"`
		} `json:"data"`
	}

	if err := json.NewDecoder(respDetail.Body).Decode(&detailResult); err != nil {
		return nil, err
	}

	tz := strings.ReplaceAll(detailResult.Data.Timezone, "__", "/")

	return &GeoDBMetadata{
		GeonameID:  cityID,
		Latitude:   searchResult.Data[0].Latitude,
		Longitude:  searchResult.Data[0].Longitude,
		Population: searchResult.Data[0].Population,
		Timezone:   tz,
		Country:    searchResult.Data[0].Country,
	}, nil
}

func getDefaultMetadata(cityName, countryName, continent string, index int) *GeoDBMetadata {
	// Generates a completely unique fallback geoname_id based on the loop index to prevent conflicts
	id := 1000000 + index
	return &GeoDBMetadata{
		GeonameID:  id,
		Latitude:   37.0, // default generic lat
		Longitude:  -122.0, // default generic lon
		Population: 500000,
		Timezone:   "UTC",
		Country:    countryName,
	}
}

func generateSlug(name string) string {
	name = strings.ToLower(name)
	// Replace non-alphanumeric characters with "-"
	reg, _ := regexp.Compile("[^a-z0-9]+")
	slug := reg.ReplaceAllString(name, "-")
	// Trim leading/trailing dashes
	slug = strings.Trim(slug, "-")
	return slug
}

func insertCityData(city *ParsedCity) error {
	tx, err := DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// 1. Insert into cities
	_, err = tx.Exec(`
		INSERT INTO cities (geoname_id, name, full_name, latitude, longitude, population, timezone, country, continent, urban_area_slug)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		ON CONFLICT (geoname_id) DO UPDATE SET
			population = EXCLUDED.population,
			latitude = EXCLUDED.latitude,
			longitude = EXCLUDED.longitude,
			timezone = EXCLUDED.timezone
	`, city.GeonameID, city.Name, fmt.Sprintf("%s, %s", city.Name, city.Country), city.Latitude, city.Longitude, city.Population, city.Timezone, city.Country, city.Continent, city.Slug)
	if err != nil {
		return fmt.Errorf("failed to insert city record: %w", err)
	}

	// Calculate teleport_city_score as average of scores
	var total float32 = 0
	for _, score := range city.Scores {
		total += score
	}
	avgScore := (total / 17.0) * 10.0 // Teleport score is typically out of 100

	summary := fmt.Sprintf("<p>%s, %s, is a major urban area on the %s continent. According to our quality of life index, it ranks with a composite score of %.2f out of 100.</p>",
		city.Name, city.Country, city.Continent, avgScore)

	// 2. Insert into scores
	_, err = tx.Exec(`
		INSERT INTO scores (
			urban_area_slug, housing, cost_of_living, startups, venture_capital,
			travel_connectivity, commute, business_freedom, safety, healthcare,
			education, environmental_quality, economy, taxation, internet_access,
			leisure_and_culture, tolerance, outdoors, summary, teleport_city_score
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
		) ON CONFLICT (urban_area_slug) DO UPDATE SET
			housing = EXCLUDED.housing,
			cost_of_living = EXCLUDED.cost_of_living,
			summary = EXCLUDED.summary,
			teleport_city_score = EXCLUDED.teleport_city_score
	`, city.Slug, city.Scores[0], city.Scores[1], city.Scores[2], city.Scores[3],
		city.Scores[4], city.Scores[5], city.Scores[6], city.Scores[7], city.Scores[8],
		city.Scores[9], city.Scores[10], city.Scores[11], city.Scores[12], city.Scores[13],
		city.Scores[14], city.Scores[15], city.Scores[16], summary, avgScore)
	if err != nil {
		return fmt.Errorf("failed to insert scores: %w", err)
	}

	return tx.Commit()
}
