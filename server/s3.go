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

// VerifyCachedImages checks S3 cache status for all cities in the DB without making external network calls.
func VerifyCachedImages() {
	if s3Client == nil || DB == nil {
		return
	}

	rows, err := DB.Query("SELECT DISTINCT urban_area_slug FROM cities WHERE urban_area_slug IS NOT NULL AND urban_area_slug != ''")
	if err != nil {
		log.Printf("Warning: failed to query cities for S3 verification: %v", err)
		return
	}
	defer rows.Close()

	total := 0
	cached := 0
	for rows.Next() {
		var slug string
		if err := rows.Scan(&slug); err == nil {
			total++
			ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
			if HasCachedImage(ctx, slug) {
				cached++
			}
			cancel()
		}
	}
	log.Printf("MinIO S3 image cache status: %d/%d cities cached locally", cached, total)
}

