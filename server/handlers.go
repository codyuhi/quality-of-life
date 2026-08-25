package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"
)

// Helper to write JSON error
func writeError(w http.ResponseWriter, code int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": msg})
}

// Helper to extract base URL from request, respecting reverse proxy headers
func getBaseURL(r *http.Request) string {
	scheme := "http"
	if proto := r.Header.Get("X-Forwarded-Proto"); proto != "" {
		scheme = proto
	} else if r.TLS != nil {
		scheme = "https"
	}
	host := r.Host
	if fHost := r.Header.Get("X-Forwarded-Host"); fHost != "" {
		host = fHost
	}
	return fmt.Sprintf("%s://%s", scheme, host)
}

// Enable CORS and common headers
func withCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next(w, r)
	}
}

// SearchCitiesHandler handles GET /api/cities/?search=:searchTerm
func SearchCitiesHandler(w http.ResponseWriter, r *http.Request) {
	searchTerm := r.URL.Query().Get("search")
	if searchTerm == "" {
		writeError(w, http.StatusBadRequest, "Missing search query parameter")
		return
	}

	query := `
		SELECT geoname_id, name, full_name
		FROM cities
		WHERE name ILIKE $1 OR country ILIKE $1 OR full_name ILIKE $1
		LIMIT 10
	`
	rows, err := DB.Query(query, "%"+searchTerm+"%")
	if err != nil {
		log.Printf("Error searching cities: %v", err)
		writeError(w, http.StatusInternalServerError, "Database search failed")
		return
	}
	defer rows.Close()

	type SearchResultItem struct {
		Links struct {
			CityItem struct {
				Href string `json:"href"`
			} `json:"city:item"`
		} `json:"_links"`
		MatchingAlternateNames []map[string]string `json:"matching_alternate_names"`
		MatchingFullName       string              `json:"matching_full_name"`
	}

	var results []SearchResultItem
	baseURL := getBaseURL(r)

	for rows.Next() {
		var id int
		var name, fullName string
		if err := rows.Scan(&id, &name, &fullName); err != nil {
			continue
		}

		item := SearchResultItem{
			MatchingFullName: fullName,
			MatchingAlternateNames: []map[string]string{},
		}
		item.Links.CityItem.Href = fmt.Sprintf("%s/api/cities/geonameid:%d/", baseURL, id)
		results = append(results, item)
	}

	response := map[string]interface{}{
		"_embedded": map[string]interface{}{
			"city:search-results": results,
		},
		"_links": map[string]interface{}{
			"self": map[string]interface{}{
				"href": fmt.Sprintf("%s/api/cities/?search=%s", baseURL, url.QueryEscape(searchTerm)),
			},
		},
		"count": len(results),
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(response)
}

// CityDetailsHandler handles GET /api/cities/geonameid::id/
func CityDetailsHandler(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Path
	// Expect /api/cities/geonameid:ID/ or /api/cities/geonameid:ID
	parts := strings.Split(path, ":")
	if len(parts) < 2 {
		writeError(w, http.StatusBadRequest, "Invalid URL format")
		return
	}
	idStr := strings.TrimSuffix(parts[len(parts)-1], "/")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid city ID")
		return
	}

	var name, fullName, timezone, country, continent, slug string
	var lat, lon float64
	var population int

	query := `
		SELECT name, full_name, latitude, longitude, population, timezone, country, continent, urban_area_slug
		FROM cities
		WHERE geoname_id = $1
	`
	err = DB.QueryRow(query, id).Scan(&name, &fullName, &lat, &lon, &population, &timezone, &country, &continent, &slug)
	if err == sql.ErrNoRows {
		writeError(w, http.StatusNotFound, "City not found")
		return
	} else if err != nil {
		log.Printf("Error fetching city details: %v", err)
		writeError(w, http.StatusInternalServerError, "Database error")
		return
	}

	baseURL := getBaseURL(r)

	response := map[string]interface{}{
		"geoname_id": id,
		"name":       name,
		"full_name":  fullName,
		"location": map[string]interface{}{
			"latlon": map[string]interface{}{
				"latitude":  lat,
				"longitude": lon,
			},
		},
		"population": population,
		"_links": map[string]interface{}{
			"self": map[string]interface{}{
				"href": fmt.Sprintf("%s/api/cities/geonameid:%d/", baseURL, id),
			},
			"city:timezone": map[string]interface{}{
				"name": timezone,
			},
			"city:country": map[string]interface{}{
				"name": country,
			},
			"city:urban_area": map[string]interface{}{
				"href": fmt.Sprintf("%s/api/urban_areas/slug:%s/", baseURL, slug),
				"name": name,
			},
		},
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(response)
}

// UrbanAreaScoresHandler handles GET /api/urban_areas/slug::slug/scores/ and GET /api/urban_areas/slug::slug/scores
func UrbanAreaScoresHandler(w http.ResponseWriter, r *http.Request) {
	slug := extractSlugFromPath(r.URL.Path)
	if slug == "" {
		writeError(w, http.StatusBadRequest, "Missing slug")
		return
	}

	var housing, costOfLiving, startups, ventureCapital, travelConnectivity, commute, businessFreedom, safety, healthcare, education, environmentalQuality, economy, taxation, internetAccess, leisureCulture, tolerance, outdoors float32
	var summary string
	var cityScore float32

	query := `
		SELECT housing, cost_of_living, startups, venture_capital, travel_connectivity, commute,
		       business_freedom, safety, healthcare, education, environmental_quality, economy,
		       taxation, internet_access, leisure_and_culture, tolerance, outdoors, summary, teleport_city_score
		FROM scores
		WHERE urban_area_slug = $1
	`
	err := DB.QueryRow(query, slug).Scan(
		&housing, &costOfLiving, &startups, &ventureCapital, &travelConnectivity, &commute,
		&businessFreedom, &safety, &healthcare, &education, &environmentalQuality, &economy,
		&taxation, &internetAccess, &leisureCulture, &tolerance, &outdoors, &summary, &cityScore,
	)

	if err == sql.ErrNoRows {
		writeError(w, http.StatusNotFound, "Scores not found for this slug")
		return
	} else if err != nil {
		log.Printf("Error fetching scores: %v", err)
		writeError(w, http.StatusInternalServerError, "Database error")
		return
	}

	categories := []map[string]interface{}{
		{"color": "#f3c32c", "name": "Housing", "score_out_of_10": housing},
		{"color": "#f3d630", "name": "Cost of Living", "score_out_of_10": costOfLiving},
		{"color": "#f4eb33", "name": "Startups", "score_out_of_10": startups},
		{"color": "#d2ed31", "name": "Venture Capital", "score_out_of_10": ventureCapital},
		{"color": "#7adc29", "name": "Travel Connectivity", "score_out_of_10": travelConnectivity},
		{"color": "#36cc24", "name": "Commute", "score_out_of_10": commute},
		{"color": "#19ad51", "name": "Business Freedom", "score_out_of_10": businessFreedom},
		{"color": "#0d6999", "name": "Safety", "score_out_of_10": safety},
		{"color": "#051fa5", "name": "Healthcare", "score_out_of_10": healthcare},
		{"color": "#150e78", "name": "Education", "score_out_of_10": education},
		{"color": "#3d14a4", "name": "Environmental Quality", "score_out_of_10": environmentalQuality},
		{"color": "#5c14a1", "name": "Economy", "score_out_of_10": economy},
		{"color": "#88149f", "name": "Taxation", "score_out_of_10": taxation},
		{"color": "#b9117d", "name": "Internet Access", "score_out_of_10": internetAccess},
		{"color": "#d10d54", "name": "Leisure & Culture", "score_out_of_10": leisureCulture},
		{"color": "#e70c26", "name": "Tolerance", "score_out_of_10": tolerance},
		{"color": "#f1351b", "name": "Outdoors", "score_out_of_10": outdoors},
	}

	response := map[string]interface{}{
		"categories":          categories,
		"summary":             summary,
		"teleport_city_score": cityScore,
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(response)
}

// UrbanAreaDetailsHandler handles GET /api/urban_areas/slug::slug/details/ and GET /api/urban_areas/slug::slug/details
func UrbanAreaDetailsHandler(w http.ResponseWriter, r *http.Request) {
	slug := extractSlugFromPath(r.URL.Path)
	if slug == "" {
		writeError(w, http.StatusBadRequest, "Missing slug")
		return
	}

	// Fetch scores for this city to procedurally generate detailed indices
	var housing, costOfLiving, safety, healthcare, education, environmentalQuality, economy, businessFreedom float32
	query := `
		SELECT housing, cost_of_living, safety, healthcare, education, environmental_quality, economy, business_freedom
		FROM scores
		WHERE urban_area_slug = $1
	`
	err := DB.QueryRow(query, slug).Scan(
		&housing, &costOfLiving, &safety, &healthcare, &education, &environmentalQuality, &economy, &businessFreedom,
	)

	if err == sql.ErrNoRows {
		writeError(w, http.StatusNotFound, "City scores not found for details")
		return
	} else if err != nil {
		log.Printf("Error fetching scores for details: %v", err)
		writeError(w, http.StatusInternalServerError, "Database error")
		return
	}

	// Procedurally generate category data
	categories := []map[string]interface{}{
		{
			"id":    "COST-OF-LIVING",
			"label": "Cost of Living",
			"data": []map[string]interface{}{
				{"id": "RENT-INDEX", "label": "Rent Index", "type": "float", "float_value": (10 - housing) * 10},
				{"id": "CPI-INDEX", "label": "Consumer Price Index", "type": "float", "float_value": (10 - costOfLiving) * 10},
			},
		},
		{
			"id":    "HEALTHCARE",
			"label": "Healthcare",
			"data": []map[string]interface{}{
				{"id": "QUALITY-OF-CARE", "label": "Healthcare Quality Index", "type": "float", "float_value": healthcare * 10},
			},
		},
		{
			"id":    "SAFETY",
			"label": "Safety",
			"data": []map[string]interface{}{
				{"id": "SAFETY-INDEX", "label": "Safety Index", "type": "float", "float_value": safety * 10},
				{"id": "CRIME-INDEX", "label": "Crime Index", "type": "float", "float_value": (10 - safety) * 10},
			},
		},
		{
			"id":    "BUSINESS-FREEDOM",
			"label": "Business Freedom",
			"data": []map[string]interface{}{
				{"id": "BUSINESS-FREEDOM-SCORE", "label": "Business Freedom Index", "type": "float", "float_value": businessFreedom * 10},
			},
		},
		{
			"id":    "EDUCATION",
			"label": "Education",
			"data": []map[string]interface{}{
				{"id": "QUALITY-OF-EDUCATION", "label": "Education Quality Index", "type": "float", "float_value": education * 10},
			},
		},
		{
			"id":    "ENVIRONMENT",
			"label": "Environmental Quality",
			"data": []map[string]interface{}{
				{"id": "ENVIRONMENT-INDEX", "label": "Environmental Quality Index", "type": "float", "float_value": environmentalQuality * 10},
			},
		},
		{
			"id":    "ECONOMY",
			"label": "Economy",
			"data": []map[string]interface{}{
				{"id": "ECONOMIC-HEALTH", "label": "Economic Health Index", "type": "float", "float_value": economy * 10},
			},
		},
	}

	response := map[string]interface{}{
		"categories": categories,
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(response)
}

// UrbanAreaImagesHandler handles GET /api/urban_areas/slug::slug/images/ and GET /api/urban_areas/slug::slug/images
func UrbanAreaImagesHandler(w http.ResponseWriter, r *http.Request) {
	slug := extractSlugFromPath(r.URL.Path)
	if slug == "" {
		writeError(w, http.StatusBadRequest, "Missing slug")
		return
	}

	// Fetch city's official name to query Wikipedia correctly
	var name string
	err := DB.QueryRow("SELECT name FROM cities WHERE urban_area_slug = $1", slug).Scan(&name)
	if err == sql.ErrNoRows {
		writeError(w, http.StatusNotFound, "City slug not found")
		return
	} else if err != nil {
		log.Printf("Error fetching city name for image: %v", err)
		writeError(w, http.StatusInternalServerError, "Database error")
		return
	}

	img := getCityWikipediaImage(name)

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(img)
}

// Extract slug from URL paths like /api/urban_areas/slug:san-francisco-bay-area/scores/
func extractSlugFromPath(path string) string {
	parts := strings.Split(path, "slug:")
	if len(parts) < 2 {
		return ""
	}
	slugPart := parts[1]
	// Remove anything trailing, e.g. /scores/ or /images/
	endIdx := strings.Index(slugPart, "/")
	if endIdx != -1 {
		return slugPart[:endIdx]
	}
	return slugPart
}

type WikipediaImageResponse struct {
	Photos []struct {
		Image struct {
			Mobile string `json:"mobile"`
			Web    string `json:"web"`
		} `json:"image"`
		Attribution struct {
			Photographer string `json:"photographer"`
			Site         string `json:"site"`
			Source       string `json:"source"`
			License      string `json:"license"`
		} `json:"attribution"`
	} `json:"photos"`
}

func getCityWikipediaImage(cityName string) WikipediaImageResponse {
	// Query Wikipedia API for page image
	wikiURL := fmt.Sprintf("https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=%s&origin=*", url.QueryEscape(cityName))
	
	req, err := http.NewRequest("GET", wikiURL, nil)
	if err != nil {
		log.Printf("Wikipedia image request creation failed for %s: %v", cityName, err)
		return getFallbackImage()
	}
	req.Header.Set("User-Agent", "QualityOfLifeApp/1.0")

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Wikipedia image request failed for %s: %v", cityName, err)
	} else {
		defer resp.Body.Close()
		if resp.StatusCode != http.StatusOK {
			log.Printf("Wikipedia image request returned status: %d", resp.StatusCode)
		} else {
			var wikiResult struct {
				Query struct {
					Pages map[string]struct {
						Original struct {
							Source string `json:"source"`
						} `json:"original"`
					} `json:"pages"`
				} `json:"query"`
			}
			if err := json.NewDecoder(resp.Body).Decode(&wikiResult); err != nil {
				log.Printf("Wikipedia image response decoding failed: %v", err)
			} else {
				for _, page := range wikiResult.Query.Pages {
					if page.Original.Source != "" {
						res := WikipediaImageResponse{}
						res.Photos = append(res.Photos, struct {
							Image struct {
								Mobile string `json:"mobile"`
								Web    string `json:"web"`
							} `json:"image"`
							Attribution struct {
								Photographer string `json:"photographer"`
								Site         string `json:"site"`
								Source       string `json:"source"`
								License      string `json:"license"`
							} `json:"attribution"`
						}{})
						res.Photos[0].Image.Mobile = page.Original.Source
						res.Photos[0].Image.Web = page.Original.Source
						res.Photos[0].Attribution.Photographer = "Wikimedia Contributor"
						res.Photos[0].Attribution.Site = "Wikipedia"
						res.Photos[0].Attribution.Source = fmt.Sprintf("https://en.wikipedia.org/wiki/%s", url.QueryEscape(cityName))
						res.Photos[0].Attribution.License = "Creative Commons / Public Domain"
						return res
					}
				}
			}
		}
	}

	return getFallbackImage()
}

func getFallbackImage() WikipediaImageResponse {
	res := WikipediaImageResponse{}
	res.Photos = append(res.Photos, struct {
		Image struct {
			Mobile string `json:"mobile"`
			Web    string `json:"web"`
		} `json:"image"`
		Attribution struct {
			Photographer string `json:"photographer"`
			Site         string `json:"site"`
			Source       string `json:"source"`
			License      string `json:"license"`
		} `json:"attribution"`
	}{})
	res.Photos[0].Image.Mobile = "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800"
	res.Photos[0].Image.Web = "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1200"
	res.Photos[0].Attribution.Photographer = "Unknown"
	res.Photos[0].Attribution.Site = "Unsplash"
	res.Photos[0].Attribution.Source = "https://unsplash.com"
	res.Photos[0].Attribution.License = "Unsplash License"
	return res
}
