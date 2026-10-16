package online.codyuhi.qualityoflife.data.api

import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.Query

interface QualityOfLifeApiService {
    @GET("api/cities")
    suspend fun getCities(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 12,
        @Query("lat") lat: Double? = null,
        @Query("lon") lon: Double? = null,
    ): CitiesResponseDto

    @GET("api/cities/")
    suspend fun searchCities(
        @Query("search") search: String,
    ): SearchResponseDto

    @GET("api/cities/geonameid:{id}/")
    suspend fun getCityDetails(
        @Path("id") id: Int,
    ): CityDetailsDto

    @GET("api/urban_areas/slug:{slug}/scores")
    suspend fun getUrbanAreaScores(
        @Path("slug") slug: String,
    ): ScoresResponseDto

    @GET("api/urban_areas/slug:{slug}/details")
    suspend fun getUrbanAreaDetails(
        @Path("slug") slug: String,
    ): DetailsResponseDto

    @GET("api/urban_areas/slug:{slug}/images")
    suspend fun getUrbanAreaImages(
        @Path("slug") slug: String,
    ): CityImageResponseDto
}
