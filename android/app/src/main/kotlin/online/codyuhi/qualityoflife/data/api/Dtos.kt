package online.codyuhi.qualityoflife.data.api

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class CitiesResponseDto(
    val cities: List<CitySummaryDto> = emptyList(),
    val pagination: PaginationDto? = null,
)

@Serializable
data class PaginationDto(
    val page: Int = 1,
    val limit: Int = 12,
    @SerialName("total_cities") val totalCities: Int = 266,
    @SerialName("total_pages") val totalPages: Int = 23,
    @SerialName("has_next") val hasNext: Boolean = false,
    @SerialName("has_prev") val hasPrev: Boolean = false,
    @SerialName("sort_by") val sortBy: String? = null,
)

@Serializable
data class CitySummaryDto(
    @SerialName("geoname_id") val geonameId: Int,
    val name: String,
    @SerialName("full_name") val fullName: String,
    val country: String,
    val continent: String,
    val population: Int = 0,
    val latitude: Double = 0.0,
    val longitude: Double = 0.0,
    @SerialName("urban_area_slug") val urbanAreaSlug: String = "",
    @SerialName("distance_km") val distanceKm: Double? = null,
)

@Serializable
data class CityDetailsDto(
    @SerialName("geoname_id") val geonameId: Int,
    val name: String,
    @SerialName("full_name") val fullName: String,
    val population: Int = 0,
    val location: LocationDto? = null,
    @SerialName("_links") val links: CityDetailsLinksDto? = null,
)

@Serializable
data class LocationDto(
    val latlon: LatLonDto? = null,
)

@Serializable
data class LatLonDto(
    val latitude: Double = 0.0,
    val longitude: Double = 0.0,
)

@Serializable
data class CityDetailsLinksDto(
    @SerialName("city:country") val country: LinkNameDto? = null,
    @SerialName("city:timezone") val timezone: LinkNameDto? = null,
    @SerialName("city:urban_area") val urbanArea: UrbanAreaLinkDto? = null,
)

@Serializable
data class LinkNameDto(
    val name: String = "",
)

@Serializable
data class UrbanAreaLinkDto(
    val href: String = "",
    val name: String = "",
)

@Serializable
data class ScoresResponseDto(
    val categories: List<ScoreCategoryDto> = emptyList(),
    val summary: String = "",
    @SerialName("teleport_city_score") val teleportCityScore: Float = 0f,
)

@Serializable
data class ScoreCategoryDto(
    val color: String = "#1f513f",
    val name: String,
    @SerialName("score_out_of_10") val scoreOutOf10: Float = 0f,
)

@Serializable
data class DetailsResponseDto(
    val categories: List<DetailCategoryDto> = emptyList(),
)

@Serializable
data class DetailCategoryDto(
    val id: String = "",
    val label: String,
    val data: List<DetailItemDto> = emptyList(),
)

@Serializable
data class DetailItemDto(
    val id: String = "",
    val label: String,
    val type: String = "string",
    @SerialName("float_value") val floatValue: Double? = null,
    @SerialName("int_value") val intValue: Int? = null,
    @SerialName("string_value") val stringValue: String? = null,
    @SerialName("percent_value") val percentValue: Double? = null,
    @SerialName("currency_dollar_value") val currencyDollarValue: Double? = null,
)

@Serializable
data class CityImageResponseDto(
    val photos: List<PhotoDto> = emptyList(),
)

@Serializable
data class PhotoDto(
    val image: ImageUrlsDto? = null,
    val attribution: AttributionDto? = null,
)

@Serializable
data class ImageUrlsDto(
    val mobile: String? = null,
    val web: String? = null,
)

@Serializable
data class AttributionDto(
    val photographer: String? = null,
    val site: String? = null,
    val source: String? = null,
    val license: String? = null,
)

@Serializable
data class SearchResponseDto(
    val count: Int = 0,
    @SerialName("_embedded") val embedded: SearchEmbeddedDto? = null,
)

@Serializable
data class SearchEmbeddedDto(
    @SerialName("city:search-results") val results: List<SearchResultItemDto> = emptyList(),
)

@Serializable
data class SearchResultItemDto(
    @SerialName("matching_full_name") val matchingFullName: String,
    @SerialName("_links") val links: SearchResultLinksDto? = null,
)

@Serializable
data class SearchResultLinksDto(
    @SerialName("city:item") val cityItem: SearchCityItemLinkDto? = null,
)

@Serializable
data class SearchCityItemLinkDto(
    val href: String = "",
)
