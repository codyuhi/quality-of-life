package online.codyuhi.qualityoflife.ui.detail

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import online.codyuhi.qualityoflife.di.AppContainer
import online.codyuhi.qualityoflife.domain.CityDetails
import online.codyuhi.qualityoflife.domain.CityImage
import online.codyuhi.qualityoflife.domain.ScoresData
import online.codyuhi.qualityoflife.domain.UrbanAreaDetails

data class CityDetailUiState(
    val details: CityDetails? = null,
    val scores: ScoresData? = null,
    val urbanDetails: UrbanAreaDetails? = null,
    val image: CityImage? = null,
    val isOnline: Boolean = true,
    val isWakingUp: Boolean = false,
)

private data class DataBundle(
    val details: CityDetails?,
    val scores: ScoresData?,
    val urbanDetails: UrbanAreaDetails?,
    val image: CityImage?,
)

class CityDetailViewModel(
    geonameId: Int,
    urbanAreaSlug: String?,
    container: AppContainer,
) : ViewModel() {
    private val slug = urbanAreaSlug ?: ""

    private val detailsFlow = container.cityRepository.getCityDetails(geonameId)
    private val scoresFlow = if (slug.isNotBlank()) container.cityRepository.getScores(slug) else MutableStateFlow(null)
    private val urbanDetailsFlow = if (slug.isNotBlank()) container.cityRepository.getUrbanAreaDetails(slug) else MutableStateFlow(null)
    private val imageFlow = if (slug.isNotBlank()) container.cityRepository.getCityImage(slug) else MutableStateFlow(null)

    private val dataBundleFlow = combine(
        detailsFlow,
        scoresFlow,
        urbanDetailsFlow,
        imageFlow,
    ) { details, scores, urbanDetails, image ->
        DataBundle(details, scores, urbanDetails, image)
    }

    private val statusFlow = combine(
        container.isOnline,
        container.cityRepository.isWakingUp,
    ) { online, wakingUp ->
        Pair(online, wakingUp)
    }

    val uiState: StateFlow<CityDetailUiState> = combine(
        dataBundleFlow,
        statusFlow,
    ) { data, (online, wakingUp) ->
        CityDetailUiState(
            details = data.details,
            scores = data.scores,
            urbanDetails = data.urbanDetails,
            image = data.image,
            isOnline = online,
            isWakingUp = wakingUp,
        )
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), CityDetailUiState())
}
