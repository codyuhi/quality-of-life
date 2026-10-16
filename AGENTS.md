# Quality of Life — Developer & Agent Guide

## Overview
Quality of Life is a self-hosted full-stack homelab application enabling exploration and comparison of global city statistics across 14 quality-of-life categories (housing, cost of living, safety, healthcare, economy, commute, etc.).

- **Web Frontend**: `/app` — React 18 SPA built with Vite, themed with Cedar (`cdr-theme-light` / `cdr-theme-dark`).
- **Backend API**: `/server` — High-performance Go REST API backed by PostgreSQL and MinIO S3 for city cover images.
- **Native Android Client**: `/android` — Jetpack Compose + Material 3 client styled with Cedar, supporting Galaxy Z Fold 8 Ultra and Galaxy S26+.

---

## Android Client (`/android`)

### Commands
- **Unit Tests**: `cd android && ./gradlew testDebugUnitTest`
- **Lint Check**: `cd android && ./gradlew lint`
- **Build Debug APK**: `cd android && ./gradlew assembleDebug`
- **Install on USB Phone**: `python3 ~/dev/repos/skills/skills/create-android-app/scripts/install_apk.py --apk android/app/build/outputs/apk/debug/app-debug.apk`
- **Check Connected Devices**: `python3 ~/dev/repos/skills/skills/create-android-app/scripts/install_apk.py --device-info`

### Multi-Agent Safety Rules
1. **Screenshots**: Only capture using `python3 ~/dev/repos/skills/skills/create-android-app/scripts/screenshot.py --out <path>.png`. Never run bare `adb exec-out screencap -p`.
2. **Binary Files**: Do not use `view_file` on binary files (`.apk`, `.aar`, `.ttf`, `.class`, `.jar`).
3. **Keep Output Small**: Pipe gradle and adb commands through head/tail/grep.
4. **Single Application ID**: All variants share `online.codyuhi.qualityoflife` (Golden Rule 8).
