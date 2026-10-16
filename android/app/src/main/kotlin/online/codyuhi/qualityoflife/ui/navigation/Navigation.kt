package online.codyuhi.qualityoflife.ui.navigation

import kotlinx.serialization.Serializable

@Serializable
object HomeRoute

@Serializable
data class CityDetailRoute(
    val geonameId: Int,
    val slug: String? = null,
    val cityName: String = "",
)
