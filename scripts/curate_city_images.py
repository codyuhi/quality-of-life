#!/usr/bin/env python3
"""
scripts/curate_city_images.py
One-time offline curation script to populate MinIO S3 with authentic, unique photos
for all 266 cities in the quality-of-life database using the Openverse API.
"""

import io
import json
import os
import subprocess
import sys
import time
import urllib.parse
import urllib.request
from PIL import Image

FALLBACK_IMAGE_SIZE = 143044
FALLBACK_ETAG = "501f897c5d573dec27b2aef0575e7d8c"

def get_db_cities():
    cmd = [
        "kubectl", "exec", "-n", "quality-of-life", "deployment/quality-of-life-db",
        "--", "psql", "-U", "postgres", "-d", "quality_of_life", "-t", "-A", "-F,",
        "-c", "SELECT urban_area_slug, name, country FROM cities ORDER BY name;"
    ]
    res = subprocess.run(cmd, check=True, stdout=subprocess.PIPE, text=True)
    cities = []
    for line in res.stdout.strip().splitlines():
        parts = line.strip().split(",")
        if len(parts) >= 3:
            slug = parts[0]
            name = parts[1]
            country = parts[2]
            cities.append({"slug": slug, "name": name, "country": country})
    return cities

def get_minio_stat(slug):
    cmd = [
        "kubectl", "exec", "-n", "minio", "deployment/minio",
        "--", "mc", "stat", "--json", f"local/quality-of-life/cities/{slug}.jpg"
    ]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if res.returncode != 0:
        return None
    try:
        data = json.loads(res.stdout)
        return data
    except Exception:
        return None

def search_openverse_image(name, country):
    queries = [
        f"{name} {country} skyline",
        f"{name} {country} city",
        f"{name} city landmark",
        f"{name} city",
        f"{name} {country}",
    ]

    headers = {"User-Agent": "HomelabCityCuration/1.0 (https://codyuhi.online)"}

    for query in queries:
        q_enc = urllib.parse.quote(query)
        url = f"https://api.openverse.org/v1/images/?q={q_enc}&page_size=3"
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=8) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8"))
                    results = data.get("results", [])
                    if results:
                        # Pick first result with a valid image URL
                        for r in results:
                            img_url = r.get("url")
                            if img_url and (img_url.endswith(".jpg") or img_url.endswith(".jpeg") or img_url.endswith(".png") or "flickr.com" in img_url):
                                return img_url, r.get("title", name)
        except Exception as e:
            time.sleep(0.5)
            continue
    return None, None

def download_and_optimize(image_url):
    headers = {"User-Agent": "HomelabCityCuration/1.0 (https://codyuhi.online)"}
    req = urllib.request.Request(image_url, headers=headers)
    with urllib.request.urlopen(req, timeout=15) as resp:
        img_bytes = resp.read()

    im = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    im.thumbnail((1600, 1200), Image.Resampling.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, format="JPEG", quality=85, optimize=True)
    return buf.getvalue(), im.width, im.height

def upload_to_minio(slug, jpeg_bytes):
    cmd = [
        "kubectl", "exec", "-i", "-n", "minio", "deployment/minio",
        "--", "mc", "pipe", f"local/quality-of-life/cities/{slug}.jpg"
    ]
    subprocess.run(cmd, input=jpeg_bytes, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

def main():
    force = "--force" in sys.argv
    print("Fetching cities from PostgreSQL...")
    cities = get_db_cities()
    print(f"Loaded {len(cities)} cities.")

    success_count = 0
    skipped_count = 0
    error_count = 0

    for idx, c in enumerate(cities, 1):
        slug = c["slug"]
        name = c["name"]
        country = c["country"]

        # Check existing stat in MinIO
        stat = get_minio_stat(slug)
        is_fallback = False
        if stat:
            size = stat.get("size", 0)
            etag = stat.get("etag", "")
            if size == FALLBACK_IMAGE_SIZE or etag == FALLBACK_ETAG:
                is_fallback = True
            elif not force and size > 0:
                print(f"[{idx}/{len(cities)}] SKIP: {name} ({slug}) has authentic image ({size} bytes)")
                skipped_count += 1
                continue

        reason = "missing" if not stat else ("fallback duplicate" if is_fallback else "forced")
        print(f"[{idx}/{len(cities)}] CURATING ({reason}): {name}, {country} ({slug})...")

        img_url, title = search_openverse_image(name, country)
        if not img_url:
            print(f"  ❌ No authentic image found on Openverse for {name}, {country}")
            error_count += 1
            continue

        try:
            jpeg_bytes, w, h = download_and_optimize(img_url)
            upload_to_minio(slug, jpeg_bytes)
            print(f"  ✅ Uploaded: '{title}' ({w}x{h}, {len(jpeg_bytes):,} bytes)")
            success_count += 1
        except Exception as e:
            print(f"  ❌ Failed to download/upload for {name}: {e}")
            error_count += 1

        time.sleep(0.3)

    print("\n" + "="*50)
    print(f"Curation complete: {success_count} uploaded, {skipped_count} skipped, {error_count} errors")
    print("="*50)

if __name__ == "__main__":
    main()
