package online.codyuhi.qualityoflife.data.db

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "cities")
data class CityEntity(
    @PrimaryKey val geonameId: Int,
    val name: String,
    val fullName: String,
    val country: String,
    val continent: String,
    val population: Int,
    val latitude: Double,
    val longitude: Double,
    val urbanAreaSlug: String,
)

@Entity(tableName = "cached_scores")
data class CachedScoreEntity(
    @PrimaryKey val urbanAreaSlug: String,
    val categoriesJson: String,
    val summary: String,
    val teleportCityScore: Float,
    val cachedAt: Long = System.currentTimeMillis(),
)

@Entity(tableName = "cached_details")
data class CachedDetailsEntity(
    @PrimaryKey val urbanAreaSlug: String,
    val categoriesJson: String,
    val cachedAt: Long = System.currentTimeMillis(),
)

@Entity(tableName = "cached_images")
data class CachedImageEntity(
    @PrimaryKey val urbanAreaSlug: String,
    val mobileUrl: String?,
    val webUrl: String?,
    val photographer: String?,
    val source: String?,
    val cachedAt: Long = System.currentTimeMillis(),
)

@Entity(tableName = "search_history")
data class SearchHistoryEntity(
    @PrimaryKey val query: String,
    val timestamp: Long = System.currentTimeMillis(),
)
