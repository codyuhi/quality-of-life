package online.codyuhi.qualityoflife.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import online.codyuhi.qualityoflife.di.AppContainer
import online.codyuhi.qualityoflife.domain.City
import online.codyuhi.qualityoflife.domain.CitySortMode

data class HomeUiState(
    val searchQuery: String = "",
    val cities: List<City> = emptyList(),
    val searchHistory: List<String> = emptyList(),
    val sortMode: CitySortMode = CitySortMode.Distance,
    val userLocation: Pair<Double, Double>? = null,
    val locationGranted: Boolean = false,
    val isOnline: Boolean = true,
    val isWakingUp: Boolean = false,
    val totalCitiesCount: Int = 266,
)

private data class SearchAndFilter(
    val query: String,
    val history: List<String>,
    val sortMode: CitySortMode,
    val userLocation: Pair<Double, Double>?,
    val locationGranted: Boolean,
)

@OptIn(ExperimentalCoroutinesApi::class)
class HomeViewModel(private val container: AppContainer) : ViewModel() {
    private val _searchQuery = MutableStateFlow("")
    val searchQuery = _searchQuery.asStateFlow()

    private val _userLocation = MutableStateFlow<Pair<Double, Double>?>(null)
    private val _locationGranted = MutableStateFlow(false)

    val settings = container.settingsRepository.settings
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    private val searchHistory = container.cityRepository.getSearchHistory()

    private val citiesFlow = combine(
        _searchQuery,
        _userLocation,
        settings,
    ) { query, location, userSettings ->
        val sortMode = userSettings?.sortMode ?: CitySortMode.Distance
        Triple(query, location, sortMode)
    }.flatMapLatest { (query, location, sortMode) ->
        container.cityRepository.getCities(
            query = query,
            userLat = location?.first,
            userLon = location?.second,
            sortMode = sortMode,
        )
    }

    private val searchAndFilterFlow = combine(
        _searchQuery,
        searchHistory,
        settings,
        _userLocation,
        _locationGranted,
    ) { query, history, userSettings, location, locGranted ->
        SearchAndFilter(
            query = query,
            history = history,
            sortMode = userSettings?.sortMode ?: CitySortMode.Distance,
            userLocation = location,
            locationGranted = locGranted,
        )
    }

    private val statusFlow = combine(
        container.isOnline,
        container.cityRepository.isWakingUp,
    ) { online, wakingUp ->
        Pair(online, wakingUp)
    }

    val uiState: StateFlow<HomeUiState> = combine(
        citiesFlow,
        searchAndFilterFlow,
        statusFlow,
    ) { cities, filter, (online, wakingUp) ->
        HomeUiState(
            searchQuery = filter.query,
            cities = cities,
            searchHistory = filter.history,
            sortMode = filter.sortMode,
            userLocation = filter.userLocation,
            locationGranted = filter.locationGranted,
            isOnline = online,
            isWakingUp = wakingUp,
            totalCitiesCount = if (cities.size > 200) cities.size else 266,
        )
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), HomeUiState())

    fun setSearchQuery(query: String) {
        _searchQuery.value = query
        if (query.isNotBlank() && query.length >= 2) {
            viewModelScope.launch {
                container.cityRepository.addSearchHistory(query)
            }
        }
    }

    fun submitSearch(query: String) {
        _searchQuery.value = query
        if (query.isNotBlank()) {
            viewModelScope.launch {
                container.cityRepository.addSearchHistory(query)
            }
        }
    }

    fun clearSearch() {
        _searchQuery.value = ""
    }

    fun removeHistoryItem(query: String) {
        viewModelScope.launch {
            container.cityRepository.removeSearchHistory(query)
        }
    }

    fun clearAllHistory() {
        viewModelScope.launch {
            container.cityRepository.clearSearchHistory()
        }
    }

    fun updateLocation(lat: Double, lon: Double) {
        _userLocation.value = Pair(lat, lon)
        _locationGranted.value = true
    }

    fun setLocationGranted(granted: Boolean) {
        _locationGranted.value = granted
        if (!granted) {
            _userLocation.value = null
        }
    }

    fun setSortMode(mode: CitySortMode) {
        viewModelScope.launch {
            container.settingsRepository.setSortMode(mode)
        }
    }
}
