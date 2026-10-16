# Native Capability Evaluation: quality-of-life

- **Date**: 2026-10-15
- **Web app**: https://quality-of-life.lan.codyuhi.online (backend-backed: Go REST API + PostgreSQL + MinIO S3 image storage; Sablier scale-to-zero enabled)
- **Primary users / devices**: Cody (Galaxy Z Fold 8 Ultra), Lena (Galaxy S26+)

## How the app is used today
Quality of Life is used to explore, search, and compare global cities across 14 comprehensive quality-of-life categories (Housing, Cost of Living, Startups, Venture Capital, Travel Connectivity, Commute, Business Freedom, Safety, Healthcare, Education, Environmental Quality, Economy, Taxation, Internet Access, Leisure & Culture, Tolerance, Outdoors), view granular local expenses (rent, meals, groceries, transit, gym), and browse cities ordered by proximity or population. It is used casually when researching relocations, travel destinations, or exploring world city statistics.

## Web limitations that hurt
- **Sablier Cold Starts**: Scaled-to-zero backend takes 10–20s to wake up; in a browser this can show a generic loading screen or network timeout rather than a smooth, resilient background retry over cached data.
- **No True Offline Capability**: Without an active connection or Tailscale tunnel, the web app cannot open or search cached cities, scores, or details.
- **Foldable Experience on Galaxy Z Fold 8 Ultra**: On the 752dp unfolded inner screen, the web layout stretches cards and controls rather than dedicating ≥85% of screen width to fluid multi-column city grids and side-by-side metric comparisons with a slim icon rail.
- **Mobile Browser Overhead**: Browser address bars and navigation chrome consume vertical screen space crucial for reading 14-category rating bars and multi-item economic statistics.
- **Sharing Friction**: Sharing a city's quality-of-life breakdown with friends or family requires copying URLs manually instead of invoking the native Android sharesheet.

## Capability scores
| Capability | Value (0–3) | Cost (S/M/L) | Verdict | Notes |
| :--- | :---: | :---: | :---: | :--- |
| Offline Room Cache + Preloaded City Catalog + Sablier Retries | 3 | M | `v1` | Preload 266 cities with coordinates, population, and slugs in Room. Cache loaded scores and local details. Automatically detect Sablier HTML wake pages and retry with exponential backoff. |
| Foldable Content-First (Galaxy Z Fold 8 Ultra) | 3 | M | `v1` | Slim navigation rail (~72dp) on unfolded 752dp inner screen dedicating ≥85% width to fluid multi-column city grid (2–3 columns) and wide two-column metric breakdown. Compact bottom navigation on cover screen (360dp) and Galaxy S26+. |
| Device Location ("Cities Near You") | 3 | S | `v1` | Android FusedLocationProvider for one-shot GPS location to calculate distance to all 266 cities and sort nearby cities dynamically, with seamless fallback to population sorting when location is denied. |
| Cedar Design System & Theme Toggle | 3 | S | `v1` | Authentic Cedar color palette (spruce, sandstone, ecru, charcoal, rust), typography, and custom light/dark theme toggle stored in DataStore. Dynamic color (Material You) disabled. |
| Native Sharesheet (`ACTION_SEND`) | 2 | S | `v1` | 1-tap sharing of city quality-of-life summary, Teleport city score, and category highlights via system sharesheet. |
| Search History in Room | 2 | S | `v1` | Instant access to recent searches with quick-tap re-search and clear history support. |
| Haptic Feedback | 2 | S | `v1` | Subtle Cedar tactile feedback on city selection, theme switching, search clearing, and navigation actions. |
| City Comparison Split View | 2 | M | `later` | Side-by-side score and expense comparison between two selected cities on unfolded wide screen. |
| Home Screen Glance Widget | 2 | M | `later` | Daily featured city or nearby city spotlight widget with Teleport score and top categories. |
| Background Periodic Sync | 1 | M | `later` | Quality of life statistics are static and change infrequently; on-demand network refresh with Room caching is sufficient for v1. |
| BiometricPrompt | 0 | S | `no` | Public geographic and quality of life statistics do not require biometric locking. |
| Camera / Audio Recording | 0 | M | `no` | Not relevant to city statistical exploration. |

## Recommended v1 (beyond parity)
1. **Offline Room Cache & Preloaded Catalog**: Preload all 266 cities into Room database so full search, filtering, and browsing work with zero network connection. Cache fetched category scores, images, and expense statistics for instant offline viewing.
2. **Sablier Wake Resilience**: Intercept Sablier HTML waking responses on API calls, display a calm "Waking up backend..." status over cached data, and automatically retry with exponential backoff.
3. **Foldable Content-First Layout**: Adaptive layout optimized for Galaxy Z Fold 8 Ultra (752dp unfolded screen using a slim ~72dp icon rail and dedicating ≥85% width to multi-column city grids and side-by-side score columns) and compact cover screen / Galaxy S26+ (bottom navigation bar and single-column cards).
4. **Native Proximity Location ("Cities Near You")**: Request one-shot fused location to compute distance to all 266 cities and display nearest cities first, with graceful fallback to population ranking if location is denied.
5. **Cedar Design Language**: Faithful Cedar tokens (Spruce `#1f513f` light / `#235c48` dark, sandstone canvas `#ebe7df` light / `#161614` dark, rust accents), custom in-app light/dark toggle persisted in DataStore.
6. **Native Sharesheet**: Quick share intent with city score, summary, and category highlights.
7. **Tactile Haptics**: Native vibration feedback on interactions and selections.

## Deferred (file tickets)
- **City Comparison Dual-Pane**: Dedicated side-by-side comparison screen comparing two cities on wide screens or foldable displays.
- **Home Screen Glance Widget**: Daily spotlight city widget showing quality-of-life score and highlights.
- **Background Data Sync**: Periodic WorkManager synchronization for updated statistics.

## Rejected
- **BiometricPrompt**: Quality of life metrics and public city rankings are non-sensitive.
- **Camera / Audio**: No media capture relevance for statistical city data.

## Permissions requested in v1
- `android.permission.INTERNET`: Backend API calls (`https://quality-of-life.lan.codyuhi.online/api/...`) and MinIO city images.
- `android.permission.ACCESS_NETWORK_STATE`: Observe network connectivity to display Cedar offline banner.
- `android.permission.ACCESS_LOCAL_NETWORK`: Android 17 local network protection; enables reaching `192.168.0.95` on home Wi-Fi.
- `android.permission.ACCESS_COARSE_LOCATION` & `android.permission.ACCESS_FINE_LOCATION`: One-shot device location for "Cities Near You" proximity sorting.
