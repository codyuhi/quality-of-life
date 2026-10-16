package online.codyuhi.qualityoflife.data.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface CityDao {
    @Query("SELECT * FROM cities ORDER BY population DESC")
    fun getAllCities(): Flow<List<CityEntity>>

    @Query("SELECT * FROM cities ORDER BY population DESC")
    suspend fun getAllCitiesList(): List<CityEntity>

    @Query("SELECT * FROM cities WHERE name LIKE '%' || :query || '%' OR country LIKE '%' || :query || '%' OR fullName LIKE '%' || :query || '%' ORDER BY population DESC LIMIT 50")
    fun searchCities(query: String): Flow<List<CityEntity>>

    @Query("SELECT * FROM cities WHERE geonameId = :id")
    suspend fun getCityById(id: Int): CityEntity?

    @Query("SELECT * FROM cities WHERE urbanAreaSlug = :slug LIMIT 1")
    suspend fun getCityBySlug(slug: String): CityEntity?

    @Query("SELECT COUNT(*) FROM cities")
    suspend fun getCount(): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(cities: List<CityEntity>)
}

@Dao
interface ScoreDao {
    @Query("SELECT * FROM cached_scores WHERE urbanAreaSlug = :slug")
    fun getScores(slug: String): Flow<CachedScoreEntity?>

    @Query("SELECT * FROM cached_scores WHERE urbanAreaSlug = :slug")
    suspend fun getScoresOnce(slug: String): CachedScoreEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(score: CachedScoreEntity)
}

@Dao
interface DetailsDao {
    @Query("SELECT * FROM cached_details WHERE urbanAreaSlug = :slug")
    fun getDetails(slug: String): Flow<CachedDetailsEntity?>

    @Query("SELECT * FROM cached_details WHERE urbanAreaSlug = :slug")
    suspend fun getDetailsOnce(slug: String): CachedDetailsEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(details: CachedDetailsEntity)
}

@Dao
interface ImageDao {
    @Query("SELECT * FROM cached_images WHERE urbanAreaSlug = :slug")
    fun getImage(slug: String): Flow<CachedImageEntity?>

    @Query("SELECT * FROM cached_images WHERE urbanAreaSlug = :slug")
    suspend fun getImageOnce(slug: String): CachedImageEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(image: CachedImageEntity)
}

@Dao
interface SearchHistoryDao {
    @Query("SELECT query FROM search_history ORDER BY timestamp DESC LIMIT 20")
    fun getHistory(): Flow<List<String>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(item: SearchHistoryEntity)

    @Query("DELETE FROM search_history WHERE query = :query")
    suspend fun delete(query: String)

    @Query("DELETE FROM search_history")
    suspend fun clearAll()
}
