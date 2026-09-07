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
	"sync"
	"time"
)

var (
	seederMutex sync.Mutex
	isSeeding   bool
)

// SeedDatabase checks if database is seeded, if not downloads and populates data
func SeedDatabase() error {
	seederMutex.Lock()
	if isSeeding {
		seederMutex.Unlock()
		log.Println("[Seeder] Seeding already in progress, skipping duplicate call.")
		return nil
	}
	isSeeding = true
	seederMutex.Unlock()

	defer func() {
		seederMutex.Lock()
		isSeeding = false
		seederMutex.Unlock()
	}()

	if err := createTables(); err != nil {
		return fmt.Errorf("failed to ensure tables exist: %w", err)
	}

	var count int
	err := DB.QueryRow("SELECT COUNT(*) FROM cities").Scan(&count)
	if err != nil {
		return fmt.Errorf("failed to query cities count: %w", err)
	}

	if count >= 266 {
		log.Printf("Database already fully seeded with %d cities. Skipping seeder.", count)
		return nil
	}

	log.Printf("Database has %d cities (expected 266). Starting database seeding process...", count)

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
		slug := generateSlug(city.Name + "-" + city.Country)
		var existingCount int
		_ = DB.QueryRow("SELECT COUNT(*) FROM cities WHERE urban_area_slug = $1", slug).Scan(&existingCount)
		if existingCount > 0 {
			continue
		}

		log.Printf("[Seeder] [%d/%d] Resolving details for city: %s, %s", i+1, len(citiesData), city.Name, city.Country)

		// Query GeoDB API
		metadata, err := resolveCityMetadata(city.Name, city.Country)
		if err != nil {
			log.Printf("[Seeder] Warning: could not resolve metadata for %s: %v. Using fallbacks.", city.Name, err)
			metadata = getDefaultMetadata(city.Name, city.Country, city.Continent, i)
		} else {
			// Wait between successful requests to respect GeoDB free tier rate limits (1 request/sec)
			time.Sleep(1200 * time.Millisecond)
		}

		city.GeonameID = metadata.GeonameID
		city.Latitude = metadata.Latitude
		city.Longitude = metadata.Longitude
		city.Population = metadata.Population
		city.Timezone = metadata.Timezone
		city.Country = metadata.Country // Normalized country
		city.Slug = slug

		// Insert into DB
		if err := insertCityData(city); err != nil {
			log.Printf("[Seeder] Error inserting city %s: %v", city.Name, err)
		}
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
	isoCode := getCountryISO(countryName, cityName)
	var searchURL string
	if isoCode != "" {
		searchURL = fmt.Sprintf("https://geodb-free-service.wirefreethought.com/v1/geo/cities?namePrefix=%s&countryIds=%s&limit=5", url.QueryEscape(cityName), isoCode)
	} else {
		searchURL = fmt.Sprintf("https://geodb-free-service.wirefreethought.com/v1/geo/cities?namePrefix=%s&limit=5", url.QueryEscape(cityName))
	}
	
	client := &http.Client{Timeout: 5 * time.Second}
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
			ID         int     `json:"id"`
			City       string  `json:"city"`
			Country    string  `json:"country"`
			Region     string  `json:"region"`
			RegionCode string  `json:"regionCode"`
			Latitude   float64 `json:"latitude"`
			Longitude  float64 `json:"longitude"`
			Population int     `json:"population"`
		} `json:"data"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&searchResult); err != nil {
		return nil, err
	}

	if len(searchResult.Data) == 0 {
		return nil, fmt.Errorf("city not found in GeoDB")
	}

	selectedIdx := 0
	targetRegion := strings.TrimSpace(countryName)
	for idx, item := range searchResult.Data {
		if strings.EqualFold(item.Region, targetRegion) || strings.EqualFold(item.RegionCode, targetRegion) {
			selectedIdx = idx
			break
		}
	}

	match := searchResult.Data[selectedIdx]
	cityID := match.ID

	// Wait a moment between search and detail query to respect rate limits
	time.Sleep(300 * time.Millisecond)

	// 2. Fetch full city details (for timezone)
	detailURL := fmt.Sprintf("https://geodb-free-service.wirefreethought.com/v1/geo/cities/%d", cityID)
	respDetail, err := client.Get(detailURL)
	if err != nil {
		return nil, err
	}
	defer respDetail.Body.Close()

	if respDetail.StatusCode != http.StatusOK {
		// If details query fails, return what we have from search
		return &GeoDBMetadata{
			GeonameID:  cityID,
			Latitude:   match.Latitude,
			Longitude:  match.Longitude,
			Population: match.Population,
			Timezone:   "UTC",
			Country:    match.Country,
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
		Latitude:   match.Latitude,
		Longitude:  match.Longitude,
		Population: match.Population,
		Timezone:   tz,
		Country:    match.Country,
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
	// If this geoname_id is already used by a DIFFERENT urban_area_slug, generate a fallback ID
	var existingSlug string
	err := DB.QueryRow("SELECT urban_area_slug FROM cities WHERE geoname_id = $1", city.GeonameID).Scan(&existingSlug)
	if err == nil && existingSlug != "" && existingSlug != city.Slug {
		var maxID int
		_ = DB.QueryRow("SELECT COALESCE(MAX(geoname_id), 2000000) FROM cities").Scan(&maxID)
		if maxID < 2000000 {
			maxID = 2000000
		}
		city.GeonameID = maxID + 1
	}

	// If this urban_area_slug already exists in cities with another geoname_id, reuse that geoname_id
	var existingID int
	err = DB.QueryRow("SELECT geoname_id FROM cities WHERE urban_area_slug = $1", city.Slug).Scan(&existingID)
	if err == nil && existingID > 0 {
		city.GeonameID = existingID
	}

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
			name = EXCLUDED.name,
			full_name = EXCLUDED.full_name,
			population = EXCLUDED.population,
			latitude = EXCLUDED.latitude,
			longitude = EXCLUDED.longitude,
			timezone = EXCLUDED.timezone,
			country = EXCLUDED.country,
			continent = EXCLUDED.continent,
			urban_area_slug = EXCLUDED.urban_area_slug
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
			startups = EXCLUDED.startups,
			venture_capital = EXCLUDED.venture_capital,
			travel_connectivity = EXCLUDED.travel_connectivity,
			commute = EXCLUDED.commute,
			business_freedom = EXCLUDED.business_freedom,
			safety = EXCLUDED.safety,
			healthcare = EXCLUDED.healthcare,
			education = EXCLUDED.education,
			environmental_quality = EXCLUDED.environmental_quality,
			economy = EXCLUDED.economy,
			taxation = EXCLUDED.taxation,
			internet_access = EXCLUDED.internet_access,
			leisure_and_culture = EXCLUDED.leisure_and_culture,
			tolerance = EXCLUDED.tolerance,
			outdoors = EXCLUDED.outdoors,
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

func getCountryISO(countryOrState, cityName string) string {
	name := strings.TrimSpace(strings.ToLower(countryOrState))
	
	// Map US States to US
	usStates := map[string]bool{
		"alabama": true, "alaska": true, "arizona": true, "arkansas": true, "california": true,
		"colorado": true, "connecticut": true, "delaware": true, "district of columbia": true,
		"florida": true, "hawaii": true, "idaho": true, "illinois": true, "indiana": true,
		"iowa": true, "kansas": true, "kentucky": true, "louisiana": true, "maine": true,
		"maryland": true, "massachusetts": true, "michigan": true, "minnesota": true,
		"mississippi": true, "missouri": true, "montana": true, "nebraska": true,
		"nevada": true, "new hampshire": true, "new jersey": true, "new mexico": true,
		"new york": true, "north carolina": true, "north dakota": true, "ohio": true,
		"oklahoma": true, "oregon": true, "pennsylvania": true, "rhode island": true,
		"south carolina": true, "south dakota": true, "tennessee": true, "texas": true,
		"utah": true, "vermont": true, "virginia": true, "washington": true,
		"west virginia": true, "wisconsin": true, "wyoming": true,
	}
	
	if name == "georgia" {
		// Differentiate country Georgia (Tbilisi) from US State Georgia (Atlanta)
		if strings.ToLower(cityName) == "tbilisi" {
			return "GE"
		}
		return "US"
	}
	
	if usStates[name] {
		return "US"
	}

	// Map country names to 2-letter ISO codes
	countries := map[string]string{
		"argentina": "AR",
		"armenia": "AM",
		"australia": "AU",
		"austria": "AT",
		"azerbaijan": "AZ",
		"belarus": "BY",
		"belgium": "BE",
		"belize": "BZ",
		"bolivia": "BO",
		"bosnia and herzegovina": "BA",
		"brazil": "BR",
		"bulgaria": "BG",
		"cambodia": "KH",
		"canada": "CA",
		"chile": "CL",
		"china": "CN",
		"colombia": "CO",
		"costa rica": "CR",
		"croatia": "HR",
		"cuba": "CU",
		"cyprus": "CY",
		"czechia": "CZ",
		"denmark": "DK",
		"dominican republic": "DO",
		"ecuador": "EC",
		"egypt": "EG",
		"el salvador": "SV",
		"estonia": "EE",
		"finland": "FI",
		"france": "FR",
		"germany": "DE",
		"gibraltar": "GI",
		"greece": "GR",
		"guatemala": "GT",
		"hong kong": "HK",
		"hungary": "HU",
		"iceland": "IS",
		"india": "IN",
		"indonesia": "ID",
		"iran": "IR",
		"ireland": "IE",
		"israel": "IL",
		"italy": "IT",
		"jamaica": "JM",
		"japan": "JP",
		"kazakhstan": "KZ",
		"kenya": "KE",
		"latvia": "LV",
		"lebanon": "LB",
		"lithuania": "LT",
		"luxembourg": "LU",
		"macedonia": "MK",
		"malaysia": "MY",
		"malta": "MT",
		"mexico": "MX",
		"moldova": "MD",
		"morocco": "MA",
		"nepal": "NP",
		"netherlands": "NL",
		"new zealand": "NZ",
		"nicaragua": "NI",
		"nigeria": "NG",
		"norway": "NO",
		"panama": "PA",
		"paraguay": "PY",
		"peru": "PE",
		"philippines": "PH",
		"poland": "PL",
		"portugal": "PT",
		"puerto rico": "PR",
		"qatar": "QA",
		"romania": "RO",
		"russia": "RU",
		"saudi arabia": "SA",
		"serbia": "RS",
		"singapore": "SG",
		"slovakia": "SK",
		"slovenia": "SI",
		"south africa": "ZA",
		"south korea": "KR",
		"spain": "ES",
		"sweden": "SE",
		"switzerland": "CH",
		"taiwan": "TW",
		"tanzania": "TZ",
		"thailand": "TH",
		"tunisia": "TN",
		"turkey": "TR",
		"ukraine": "UA",
		"united  arab emirates": "AE",
		"united arab emirates": "AE",
		"united kingdom": "GB",
		"uruguay": "UY",
		"uzbekistan": "UZ",
		"venezuela": "VE",
		"vietnam": "VN",
		"andorra": "AD",
	}

	if code, ok := countries[name]; ok {
		return code
	}
	return ""
}
