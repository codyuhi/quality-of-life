package online.codyuhi.qualityoflife.data.settings

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import online.codyuhi.qualityoflife.domain.CitySortMode
import online.codyuhi.qualityoflife.domain.ThemeMode

data class UserSettings(
    val themeMode: ThemeMode = ThemeMode.System,
    val sortMode: CitySortMode = CitySortMode.Distance,
    val locationAllowed: Boolean = true,
)

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "settings")

class SettingsRepository(private val context: Context) {
    private object Keys {
        val theme = stringPreferencesKey("qol_theme")
        val sort = stringPreferencesKey("qol_sort")
        val locationAllowed = booleanPreferencesKey("qol_location_allowed")
    }

    val settings: Flow<UserSettings> = context.dataStore.data.map { prefs ->
        UserSettings(
            themeMode = prefs[Keys.theme]?.let { runCatching { ThemeMode.valueOf(it) }.getOrNull() } ?: ThemeMode.System,
            sortMode = prefs[Keys.sort]?.let { runCatching { CitySortMode.valueOf(it) }.getOrNull() } ?: CitySortMode.Distance,
            locationAllowed = prefs[Keys.locationAllowed] ?: true,
        )
    }

    suspend fun setThemeMode(mode: ThemeMode) {
        context.dataStore.edit { it[Keys.theme] = mode.name }
    }

    suspend fun setSortMode(mode: CitySortMode) {
        context.dataStore.edit { it[Keys.sort] = mode.name }
    }

    suspend fun setLocationAllowed(allowed: Boolean) {
        context.dataStore.edit { it[Keys.locationAllowed] = allowed }
    }
}
