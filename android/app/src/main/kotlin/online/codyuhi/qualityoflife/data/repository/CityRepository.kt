package online.codyuhi.qualityoflife.data.repository

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import online.codyuhi.qualityoflife.data.api.QualityOfLifeApiService
import online.codyuhi.qualityoflife.data.api.SablierInterceptor
import online.codyuhi.qualityoflife.data.db.AppDatabase
import online.codyuhi.qualityoflife.data.db.CachedDetailsEntity
import online.codyuhi.qualityoflife.data.db.CachedImageEntity
import online.codyuhi.qualityoflife.data.db.CachedScoreEntity
import online.codyuhi.qualityoflife.data.db.CityEntity
import online.codyuhi.qualityoflife.data.db.SearchHistoryEntity
import online.codyuhi.qualityoflife.domain.City
import online.codyuhi.qualityoflife.domain.CityDetails
import online.codyuhi.qualityoflife.domain.CityImage
import online.codyuhi.qualityoflife.domain.CitySortMode
import online.codyuhi.qualityoflife.domain.ScoreCategory
import online.codyuhi.qualityoflife.domain.ScoresData
import online.codyuhi.qualityoflife.domain.StatCategory
import online.codyuhi.qualityoflife.domain.StatItem
import online.codyuhi.qualityoflife.domain.UrbanAreaDetails
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.round
import kotlin.math.sin
import kotlin.math.sqrt

class CityRepository(
    private val database: AppDatabase,
    private val apiService: QualityOfLifeApiService,
    private val sablierInterceptor: SablierInterceptor,
    private val json: Json = Json { ignoreUnknownKeys = true },
) {
    val isWakingUp: StateFlow<Boolean> = sablierInterceptor.isWakingUp

    private val scope = CoroutineScope(Dispatchers.IO)

    fun getCities(
        query: String?,
        userLat: Double?,
        userLon: Double?,
        sortMode: CitySortMode,
    ): Flow<List<City>> {
        val baseFlow = if (query.isNullOrBlank()) {
            database.cityDao().getAllCities()
        } else {
            database.cityDao().searchCities(query.trim())
        }

        return baseFlow.map { entities ->
            val mapped = entities.map { entity ->
                val distance = if (userLat != null && userLon != null) {
                    calculateDistanceKm(userLat, userLon, entity.latitude, entity.longitude)
                } else null
                entity.toDomain(distance)
            }

            when (sortMode) {
                CitySortMode.Distance -> {
                    if (userLat != null && userLon != null) {
                        mapped.sortedWith(
                            compareBy<City> { it.distanceKm ?: Double.MAX_VALUE }
                                .thenByDescending { it.population }
                        )
                    } else {
                        mapped.sortedByDescending { it.population }
                    }
                }
                CitySortMode.Population -> mapped.sortedByDescending { it.population }
                CitySortMode.Alphabetical -> mapped.sortedBy { it.name }
            }
        }.flowOn(Dispatchers.Default)
    }

    fun getCityDetails(geonameId: Int): Flow<CityDetails?> = flow {
        // Emit from Room database entity first
        val local = database.cityDao().getCityById(geonameId)
        if (local != null) {
            emit(
                CityDetails(
                    geonameId = local.geonameId,
                    name = local.name,
                    fullName = local.fullName,
                    country = local.country,
                    timezone = "UTC",
                    urbanAreaSlug = local.urbanAreaSlug,
                    urbanAreaName = local.name,
                    latitude = local.latitude,
                    longitude = local.longitude,
                    population = local.population,
                )
            )
        }

        // Fetch from network if possible
        try {
            val remote = apiService.getCityDetails(geonameId)
            val updated = CityDetails(
                geonameId = remote.geonameId,
                name = remote.name,
                fullName = remote.fullName,
                country = remote.links?.country?.name ?: local?.country.orEmpty(),
                timezone = remote.links?.timezone?.name ?: "UTC",
                urbanAreaSlug = local?.urbanAreaSlug ?: remote.links?.urbanArea?.href?.substringAfter("slug:")?.trimEnd('/'),
                urbanAreaName = remote.links?.urbanArea?.name ?: local?.name.orEmpty(),
                latitude = remote.location?.latlon?.latitude ?: local?.latitude ?: 0.0,
                longitude = remote.location?.latlon?.longitude ?: local?.longitude ?: 0.0,
                population = remote.population,
            )
            emit(updated)
        } catch (_: Exception) {
            // Keep emitting cached local data on offline
        }
    }.flowOn(Dispatchers.IO)

    fun getScores(urbanAreaSlug: String): Flow<ScoresData?> {
        // Refresh from network in background
        scope.launch {
            try {
                val remote = apiService.getUrbanAreaScores(urbanAreaSlug)
                val categories = remote.categories.map {
                    ScoreCategory(name = it.name, color = it.color, score = it.scoreOutOf10)
                }
                val entity = CachedScoreEntity(
                    urbanAreaSlug = urbanAreaSlug,
                    categoriesJson = json.encodeToString(categories),
                    summary = remote.summary,
                    teleportCityScore = remote.teleportCityScore,
                )
                database.scoreDao().insert(entity)
            } catch (_: Exception) {
                // Offline fallback
            }
        }

        return database.scoreDao().getScores(urbanAreaSlug).map { entity ->
            entity?.let {
                val categories = runCatching {
                    json.decodeFromString<List<ScoreCategory>>(it.categoriesJson)
                }.getOrDefault(emptyList())
                ScoresData(
                    urbanAreaSlug = it.urbanAreaSlug,
                    categories = categories,
                    summary = it.summary,
                    teleportCityScore = it.teleportCityScore,
                )
            }
        }.flowOn(Dispatchers.Default)
    }

    fun getUrbanAreaDetails(urbanAreaSlug: String): Flow<UrbanAreaDetails?> {
        scope.launch {
            try {
                val remote = apiService.getUrbanAreaDetails(urbanAreaSlug)
                val categories = remote.categories.map { cat ->
                    StatCategory(
                        id = cat.id,
                        label = cat.label,
                        data = cat.data.map { item ->
                            val valueStr = when (item.type) {
                                "currency_dollar" -> "$${String.format(java.util.Locale.US, "%.2f", item.currencyDollarValue ?: 0.0)}"
                                "percent" -> "${String.format(java.util.Locale.US, "%.1f", (item.percentValue ?: 0.0) * 100)}%"
                                "float" -> String.format(java.util.Locale.US, "%.2f", item.floatValue ?: 0.0)
                                "int" -> (item.intValue ?: 0).toString()
                                else -> item.stringValue.orEmpty()
                            }
                            StatItem(
                                id = item.id,
                                label = item.label,
                                type = item.type,
                                value = valueStr,
                            )
                        }
                    )
                }
                val entity = CachedDetailsEntity(
                    urbanAreaSlug = urbanAreaSlug,
                    categoriesJson = json.encodeToString(categories),
                )
                database.detailsDao().insert(entity)
            } catch (_: Exception) {
                // Offline fallback
            }
        }

        return database.detailsDao().getDetails(urbanAreaSlug).map { entity ->
            entity?.let {
                val categories = runCatching {
                    json.decodeFromString<List<StatCategory>>(it.categoriesJson)
                }.getOrDefault(emptyList())
                UrbanAreaDetails(
                    urbanAreaSlug = it.urbanAreaSlug,
                    categories = categories,
                )
            }
        }.flowOn(Dispatchers.Default)
    }

    fun getCityImage(urbanAreaSlug: String): Flow<CityImage?> {
        scope.launch {
            try {
                val remote = apiService.getUrbanAreaImages(urbanAreaSlug)
                val photo = remote.photos.firstOrNull()
                val entity = CachedImageEntity(
                    urbanAreaSlug = urbanAreaSlug,
                    mobileUrl = photo?.image?.mobile,
                    webUrl = photo?.image?.web,
                    photographer = photo?.attribution?.photographer,
                    source = photo?.attribution?.source,
                )
                database.imageDao().insert(entity)
            } catch (_: Exception) {
                // Offline fallback
            }
        }

        return database.imageDao().getImage(urbanAreaSlug).map { entity ->
            entity?.let {
                CityImage(
                    urbanAreaSlug = it.urbanAreaSlug,
                    mobileUrl = it.mobileUrl,
                    webUrl = it.webUrl,
                    photographer = it.photographer,
                    source = it.source,
                )
            }
        }.flowOn(Dispatchers.Default)
    }

    fun getSearchHistory(): Flow<List<String>> = database.searchHistoryDao().getHistory()

    suspend fun addSearchHistory(query: String) {
        if (query.isNotBlank()) {
            database.searchHistoryDao().insert(SearchHistoryEntity(query = query.trim()))
        }
    }

    suspend fun removeSearchHistory(query: String) {
        database.searchHistoryDao().delete(query)
    }

    suspend fun clearSearchHistory() {
        database.searchHistoryDao().clearAll()
    }

    companion object {
        fun calculateDistanceKm(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Double {
            val r = 6371.0 // Radius of the Earth in km
            val dLat = Math.toRadians(lat2 - lat1)
            val dLon = Math.toRadians(lon2 - lon1)
            val a = sin(dLat / 2) * sin(dLat / 2) +
                    cos(Math.toRadians(lat1)) * cos(Math.toRadians(lat2)) *
                    sin(dLon / 2) * sin(dLon / 2)
            val c = 2 * atan2(sqrt(a), sqrt(1 - a))
            return round(r * c * 10.0) / 10.0
        }
    }
}

private fun CityEntity.toDomain(distanceKm: Double?): City {
    return City(
        geonameId = geonameId,
        name = name,
        fullName = fullName,
        country = country,
        continent = continent,
        population = population,
        latitude = latitude,
        longitude = longitude,
        urbanAreaSlug = urbanAreaSlug,
        distanceKm = distanceKm,
    )
}
