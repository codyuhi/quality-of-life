package online.codyuhi.qualityoflife.data.api

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import okhttp3.Interceptor
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.Response
import okhttp3.ResponseBody.Companion.toResponseBody
import java.io.IOException

class SablierInterceptor : Interceptor {
    private val _isWakingUp = MutableStateFlow(false)
    val isWakingUp: StateFlow<Boolean> = _isWakingUp.asStateFlow()

    @Throws(IOException::class)
    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()
        val requestWithAccept = originalRequest.newBuilder()
            .header("Accept", "application/json")
            .build()

        var response: Response = chain.proceed(requestWithAccept)

        // Check if response is Sablier HTML loading page
        val isHtml = response.header("Content-Type")?.contains("text/html", ignoreCase = true) == true
        if (isHtml) {
            val bodyString = response.body?.string().orEmpty()
            if (bodyString.contains("Sablier", ignoreCase = true) || bodyString.contains("Starting", ignoreCase = true)) {
                _isWakingUp.value = true
                response.close()

                // Retry with exponential backoff up to ~30 seconds
                val delays = listOf(2000L, 3000L, 5000L, 7000L, 10000L)
                for (delayMs in delays) {
                    try {
                        Thread.sleep(delayMs)
                    } catch (e: InterruptedException) {
                        Thread.currentThread().interrupt()
                        break
                    }
                    val retryResponse = chain.proceed(requestWithAccept)
                    val retryIsHtml = retryResponse.header("Content-Type")?.contains("text/html", ignoreCase = true) == true
                    if (!retryIsHtml) {
                        _isWakingUp.value = false
                        return retryResponse
                    }
                    val retryBody = retryResponse.body?.string().orEmpty()
                    if (!retryBody.contains("Sablier", ignoreCase = true)) {
                        _isWakingUp.value = false
                        return retryResponse.newBuilder()
                            .body(retryBody.toResponseBody(retryResponse.body?.contentType()))
                            .build()
                    }
                    retryResponse.close()
                }
                _isWakingUp.value = false
                throw IOException("Backend is still waking up from scale-to-zero. Please retry in a moment.")
            } else {
                return response.newBuilder()
                    .body(bodyString.toResponseBody("text/html".toMediaTypeOrNull()))
                    .build()
            }
        }

        _isWakingUp.value = false
        return response
    }
}
