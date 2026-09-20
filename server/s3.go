package main

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

var (
	s3Client   *minio.Client
	s3Bucket   string
	s3InitOnce sync.Once
)

// InitS3 initializes the S3/MinIO client if credentials and endpoint are provided.
func InitS3(endpoint, accessKey, secretKey, bucket string, useSSL bool) error {
	if endpoint == "" || accessKey == "" || secretKey == "" {
		log.Println("S3/MinIO endpoint or credentials not provided; MinIO image caching disabled")
		return nil
	}

	// Remove http:// or https:// prefix if user passed full URL
	cleanEndpoint := strings.TrimPrefix(strings.TrimPrefix(endpoint, "http://"), "https://")

	client, err := minio.New(cleanEndpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure: useSSL,
	})
	if err != nil {
		return fmt.Errorf("failed to create MinIO client: %w", err)
	}

	s3Client = client
	s3Bucket = bucket
	if s3Bucket == "" {
		s3Bucket = "quality-of-life"
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	exists, err := s3Client.BucketExists(ctx, s3Bucket)
	if err != nil {
		log.Printf("Warning: failed to check if S3 bucket '%s' exists: %v", s3Bucket, err)
	} else if !exists {
		err = s3Client.MakeBucket(ctx, s3Bucket, minio.MakeBucketOptions{})
		if err != nil {
			log.Printf("Warning: failed to create S3 bucket '%s': %v", s3Bucket, err)
		} else {
			log.Printf("Created S3 bucket: %s", s3Bucket)
		}
	}

	log.Printf("S3/MinIO client initialized successfully for bucket '%s' at '%s'", s3Bucket, cleanEndpoint)
	return nil
}

// HasCachedImage checks if an image for the given slug is stored in S3.
func HasCachedImage(ctx context.Context, slug string) bool {
	if s3Client == nil {
		return false
	}
	objectKey := fmt.Sprintf("cities/%s.jpg", slug)
	_, err := s3Client.StatObject(ctx, s3Bucket, objectKey, minio.StatObjectOptions{})
	return err == nil
}

// GetCachedImage retrieves the image object and content type from S3.
func GetCachedImage(ctx context.Context, slug string) (io.ReadCloser, string, error) {
	if s3Client == nil {
		return nil, "", fmt.Errorf("s3 client not initialized")
	}
	objectKey := fmt.Sprintf("cities/%s.jpg", slug)
	obj, err := s3Client.GetObject(ctx, s3Bucket, objectKey, minio.GetObjectOptions{})
	if err != nil {
		return nil, "", err
	}

	stat, err := obj.Stat()
	if err != nil {
		obj.Close()
		return nil, "", err
	}

	contentType := stat.ContentType
	if contentType == "" {
		contentType = "image/jpeg"
	}

	return obj, contentType, nil
}

// PutCachedImage stores an image byte slice into S3.
func PutCachedImage(ctx context.Context, slug string, data []byte, contentType string) error {
	if s3Client == nil {
		return fmt.Errorf("s3 client not initialized")
	}
	if contentType == "" {
		contentType = http.DetectContentType(data)
		if contentType == "application/octet-stream" {
			contentType = "image/jpeg"
		}
	}

	objectKey := fmt.Sprintf("cities/%s.jpg", slug)
	_, err := s3Client.PutObject(ctx, s3Bucket, objectKey, bytes.NewReader(data), int64(len(data)), minio.PutObjectOptions{
		ContentType: contentType,
	})
	if err != nil {
		return fmt.Errorf("failed to put object %s into s3: %w", objectKey, err)
	}

	log.Printf("Successfully cached city image to S3: %s (%d bytes)", objectKey, len(data))
	return nil
}

// FetchRemoteImageBytes downloads an image from a remote URL.
func FetchRemoteImageBytes(imageURL string) ([]byte, string, error) {
	req, err := http.NewRequest("GET", imageURL, nil)
	if err != nil {
		return nil, "", err
	}
	req.Header.Set("User-Agent", "QualityOfLifeApp/1.0")

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, "", fmt.Errorf("remote image server returned HTTP %d", resp.StatusCode)
	}

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, "", err
	}

	contentType := resp.Header.Get("Content-Type")
	if contentType == "" {
		contentType = http.DetectContentType(data)
	}

	return data, contentType, nil
}

// FetchAndCacheCityImage fetches the image for a city from Wikipedia (or fallback) and caches it in S3.
func FetchAndCacheCityImage(slug, cityName string) ([]byte, string, error) {
	wikiImg := getCityWikipediaImage(cityName)
	if len(wikiImg.Photos) == 0 || wikiImg.Photos[0].Image.Mobile == "" {
		return nil, "", fmt.Errorf("no image found for city %s", cityName)
	}

	remoteURL := wikiImg.Photos[0].Image.Mobile
	data, contentType, err := FetchRemoteImageBytes(remoteURL)
	if err != nil {
		log.Printf("Failed to fetch remote image bytes for %s from %s: %v", cityName, remoteURL, err)
		// Fallback image
		fb := getFallbackImage()
		data, contentType, err = FetchRemoteImageBytes(fb.Photos[0].Image.Mobile)
		if err != nil {
			return nil, "", err
		}
	}

	if s3Client != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		_ = PutCachedImage(ctx, slug, data, contentType)
	}

	return data, contentType, nil
}

// WarmImageCacheBackground asynchronously loops through all cities and caches missing images in MinIO.
func WarmImageCacheBackground() {
	if s3Client == nil || DB == nil {
		return
	}

	log.Println("Starting background S3 image cache warming for all cities...")
	rows, err := DB.Query("SELECT DISTINCT urban_area_slug, name FROM cities WHERE urban_area_slug IS NOT NULL AND urban_area_slug != '' ORDER BY urban_area_slug")
	if err != nil {
		log.Printf("Warning: failed to query cities for S3 warming: %v", err)
		return
	}
	defer rows.Close()

	type CitySlugName struct {
		slug string
		name string
	}
	var cities []CitySlugName

	for rows.Next() {
		var c CitySlugName
		if err := rows.Scan(&c.slug, &c.name); err == nil {
			cities = append(cities, c)
		}
	}

	cachedCount := 0
	newlyCached := 0

	for _, c := range cities {
		ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
		hasCached := HasCachedImage(ctx, c.slug)
		cancel()

		if hasCached {
			cachedCount++
			continue
		}

		// Download and cache
		_, _, err := FetchAndCacheCityImage(c.slug, c.name)
		if err == nil {
			newlyCached++
		} else {
			log.Printf("Warning: could not cache image for %s (%s): %v", c.name, c.slug, err)
		}

		// Gentle delay between requests to respect Wikipedia CDN
		time.Sleep(300 * time.Millisecond)
	}

	log.Printf("Completed S3 image cache warming: %d already cached, %d newly cached, total %d cities",
		cachedCount, newlyCached, len(cities))
}
