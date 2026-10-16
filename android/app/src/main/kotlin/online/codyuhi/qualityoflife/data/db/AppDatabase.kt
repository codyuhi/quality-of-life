package online.codyuhi.qualityoflife.data.db

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.sqlite.db.SupportSQLiteDatabase
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.double
import kotlinx.serialization.json.int
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

@Database(
    entities = [
        CityEntity::class,
        CachedScoreEntity::class,
        CachedDetailsEntity::class,
        CachedImageEntity::class,
        SearchHistoryEntity::class,
    ],
    version = 1,
    exportSchema = false,
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun cityDao(): CityDao
    abstract fun scoreDao(): ScoreDao
    abstract fun detailsDao(): DetailsDao
    abstract fun imageDao(): ImageDao
    abstract fun searchHistoryDao(): SearchHistoryDao

    companion object {
        fun build(context: Context): AppDatabase {
            val db = Room.databaseBuilder(
                context.applicationContext,
                AppDatabase::class.java,
                "quality_of_life.db"
            ).addCallback(object : Callback() {
                override fun onCreate(sqliteDb: SupportSQLiteDatabase) {
                    super.onCreate(sqliteDb)
                }
            }).build()

            // Preload cities in the background if empty
            CoroutineScope(Dispatchers.IO).launch {
                try {
                    if (db.cityDao().getCount() < 266) {
                        preloadFromAssets(context, db)
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
            return db
        }

        suspend fun preloadFromAssets(context: Context, db: AppDatabase) {
            try {
                val jsonString = context.assets.open("cities.json").bufferedReader().use { it.readText() }
                val root = Json.parseToJsonElement(jsonString).jsonObject
                val citiesArray = root["cities"]?.jsonArray ?: return
                val entities = citiesArray.map { el ->
                    val obj = el.jsonObject
                    CityEntity(
                        geonameId = obj["geoname_id"]!!.jsonPrimitive.int,
                        name = obj["name"]!!.jsonPrimitive.content,
                        fullName = obj["full_name"]!!.jsonPrimitive.content,
                        country = obj["country"]!!.jsonPrimitive.content,
                        continent = obj["continent"]!!.jsonPrimitive.content,
                        population = obj["population"]!!.jsonPrimitive.int,
                        latitude = obj["latitude"]!!.jsonPrimitive.double,
                        longitude = obj["longitude"]!!.jsonPrimitive.double,
                        urbanAreaSlug = obj["urban_area_slug"]!!.jsonPrimitive.content,
                    )
                }
                db.cityDao().insertAll(entities)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }
}
