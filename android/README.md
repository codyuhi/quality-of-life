# Quality of Life — Native Android Client

Native Android client for Cody's homelab **Quality of Life** application, built with Kotlin, Jetpack Compose, Material 3, and styled with the Cedar design language. Designed for Cody's **Samsung Galaxy Z Fold 8 Ultra** (cover and inner unfolded screens) and **Galaxy S26+**, talking to the self-hosted Go REST API backend on the minipc cluster over LAN or Tailscale.

---

## 🏛️ Technology Stack

- **Language**: Kotlin 2.4 (K2 compiler)
- **UI**: Jetpack Compose + Material 3, themed with Cedar Design Tokens (`online.codyuhi.qualityoflife.ui.theme`)
- **Architecture**: Single-activity MVVM + UDF pattern, manual constructor injection via `AppContainer`
- **Navigation**: Navigation Compose with type-safe `@Serializable` routes (`HomeRoute`, `CityDetailRoute`)
- **Local Data & Offline Resilience**:
  - **Room Database**: 266-city preloaded catalog, cached category ratings, cached economic statistics, and search history
  - **DataStore Preferences**: In-app light/dark Cedar theme toggle and sorting preferences
- **Networking**: Retrofit 3 + OkHttp 5 + kotlinx.serialization converter
  - **Sablier Cold-Start Interceptor**: Intercepts HTML scale-to-zero wake responses and automatically retries with exponential backoff while keeping the UI responsive over cached data
  - **Android 17 LAN Protection**: Runtime handling of `android.permission.ACCESS_LOCAL_NETWORK` to reach `192.168.0.95` on home Wi-Fi
- **Image Loading**: Coil 3 for MinIO S3 city cover photography
- **Target SDK**: Android 17 (API 37), minSdk 33

---

## 📱 Supported Devices & Adaptive Layouts

| Device / Screen | Width Window Size | Layout Behavior |
| :--- | :--- | :--- |
| **Galaxy Z Fold 8 Ultra (Unfolded)** | **Medium (752 × 834 dp)** | **Foldable Content-First (≥85% width)**: Slim icon rail (~72dp) on the left, fluid 2–3 column city card grid, and side-by-side metric comparison (scores on left, local costs on right). |
| **Galaxy Z Fold 8 Ultra (Cover)** | **Compact (360 × 840 dp)** | Single-pane vertical scroll, top bar search, single-column city cards, full-width metric score bars. |
| **Galaxy S26+** | **Compact (~410–430 dp)** | Same single-pane layout as cover screen, respecting gesture navigation and camera cutouts. |

---

## 🛠️ Build & Installation

### Local Build & Unit Tests
```bash
cd android
./gradlew testDebugUnitTest
./gradlew assembleDebug
```

### Install onto Connected Phone(s) via USB
```bash
# Sideload the built APK onto all attached phones (e.g. Galaxy Z Fold 8 Ultra):
python3 ~/dev/repos/skills/skills/create-android-app/scripts/install_apk.py --apk app/build/outputs/apk/debug/app-debug.apk

# Or check connected devices:
python3 ~/dev/repos/skills/skills/create-android-app/scripts/install_apk.py --device-info
```

### CI Build & Harbor Release
```bash
# Push changes to git, then trigger Argo Workflow:
argo submit -n argo-workflows \
  --from workflowtemplate/android-build-apk \
  -p repo-name=quality-of-life \
  -p app-name=quality-of-life \
  -p version=1.0.0 \
  -p repo-revision=main \
  -p android-dir=android \
  --watch
```

### Install Release APK from Harbor
```bash
python3 ~/dev/repos/skills/skills/create-android-app/scripts/install_apk.py quality-of-life 1.0.0
```

### Signing Certificate
- **Signer #1 Certificate SHA-256**: `2e17886b27435fc142a0fb0a89b2d6f942ef6ab8f5bcbdd6b19317ce0f803270`

