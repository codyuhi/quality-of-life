package online.codyuhi.qualityoflife.domain

import kotlinx.serialization.Serializable

@Serializable
data class City(
    val geonameId: Int,
    val name: String,
    val fullName: String,
    val country: String,
    val continent: String,
    val population: Int,
    val latitude: Double,
    val longitude: Double,
    val urbanAreaSlug: String,
    val distanceKm: Double? = null,
)

@Serializable
data class CityDetails(
    val geonameId: Int,
    val name: String,
    val fullName: String,
    val country: String,
    val timezone: String,
    val urbanAreaSlug: String?,
    val urbanAreaName: String?,
    val latitude: Double,
    val longitude: Double,
    val population: Int,
)

@Serializable
data class ScoreCategory(
    val name: String,
    val color: String,
    val score: Float,
)

@Serializable
data class ScoresData(
    val urbanAreaSlug: String,
    val categories: List<ScoreCategory>,
    val summary: String,
    val teleportCityScore: Float,
)

@Serializable
data class StatItem(
    val id: String,
    val label: String,
    val type: String,
    val value: String,
)

@Serializable
data class StatCategory(
    val id: String,
    val label: String,
    val data: List<StatItem>,
)

@Serializable
data class UrbanAreaDetails(
    val urbanAreaSlug: String,
    val categories: List<StatCategory>,
)

@Serializable
data class CityImage(
    val urbanAreaSlug: String,
    val mobileUrl: String?,
    val webUrl: String?,
    val photographer: String?,
    val source: String?,
)

enum class ThemeMode { System, Light, Dark }

enum class CitySortMode { Distance, Population, Alphabetical }
