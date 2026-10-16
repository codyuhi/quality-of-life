package online.codyuhi.qualityoflife

import online.codyuhi.qualityoflife.data.repository.CityRepository
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class DistanceCalculationTest {

    @Test
    fun calculateDistance_sameCoordinates_isZero() {
        val lat = 40.7608
        val lon = -111.8910
        val dist = CityRepository.calculateDistanceKm(lat, lon, lat, lon)
        assertEquals(0.0, dist, 0.01)
    }

    @Test
    fun calculateDistance_knownLocations_accurate() {
        // Salt Lake City (40.7608, -111.8910) to Seattle (47.6062, -122.3321) is ~1130 km
        val slcLat = 40.7608
        val slcLon = -111.8910
        val seaLat = 47.6062
        val seaLon = -122.3321

        val dist = CityRepository.calculateDistanceKm(slcLat, slcLon, seaLat, seaLon)
        assertTrue("Expected distance between 1100 and 1160 km, got $dist", dist in 1100.0..1160.0)
    }

    @Test
    fun calculateDistance_acrossHemispheres() {
        // London (51.5074, -0.1278) to Sydney (-33.8688, 151.2093) is ~16990 km
        val lonLat = 51.5074
        val lonLon = -0.1278
        val sydLat = -33.8688
        val sydLon = 151.2093

        val dist = CityRepository.calculateDistanceKm(lonLat, lonLon, sydLat, sydLon)
        assertTrue("Expected distance between 16900 and 17100 km, got $dist", dist in 16900.0..17100.0)
    }
}
