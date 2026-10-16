package online.codyuhi.qualityoflife

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.adaptive.currentWindowAdaptiveInfo
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.core.content.ContextCompat
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.lifecycle.compose.LifecycleResumeEffect
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch
import online.codyuhi.qualityoflife.domain.ThemeMode
import online.codyuhi.qualityoflife.ui.QualityOfLifeApp
import online.codyuhi.qualityoflife.ui.theme.CedarDark
import online.codyuhi.qualityoflife.ui.theme.CedarLight
import online.codyuhi.qualityoflife.ui.theme.CedarTheme

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        val splash = installSplashScreen()
        super.onCreate(savedInstanceState)

        val container = (application as QualityOfLifeApplication).container
        var ready = false
        splash.setKeepOnScreenCondition { !ready }

        setContent {
            val userSettings by container.settingsRepository.settings.collectAsStateWithLifecycle(null)
            if (userSettings != null) ready = true

            val systemDark = isSystemInDarkTheme()
            val isDark = when (userSettings?.themeMode ?: ThemeMode.System) {
                ThemeMode.System -> systemDark
                ThemeMode.Light -> false
                ThemeMode.Dark -> true
            }

            LaunchedEffect(isDark) {
                val style = if (isDark) {
                    SystemBarStyle.dark(Color.TRANSPARENT)
                } else {
                    SystemBarStyle.light(Color.TRANSPARENT, Color.TRANSPARENT)
                }
                enableEdgeToEdge(statusBarStyle = style, navigationBarStyle = style)
            }

            // Android 17+ local network permission
            var lanGranted by remember { mutableStateOf(hasLocalNetworkAccess()) }
            val lanPermissionLauncher = rememberLauncherForActivityResult(
                ActivityResultContracts.RequestPermission()
            ) { granted ->
                lanGranted = granted
            }

            LaunchedEffect(Unit) {
                if (!lanGranted) {
                    lanPermissionLauncher.launch(LOCAL_NETWORK)
                }
            }

            LifecycleResumeEffect(Unit) {
                lanGranted = hasLocalNetworkAccess()
                onPauseOrDispose { }
            }

            // Location coordinates state
            var userCoords by remember { mutableStateOf<Pair<Double, Double>?>(null) }

            // Location permission launcher
            val locationPermissionLauncher = rememberLauncherForActivityResult(
                ActivityResultContracts.RequestMultiplePermissions()
            ) { perms ->
                val granted = perms[Manifest.permission.ACCESS_FINE_LOCATION] == true ||
                        perms[Manifest.permission.ACCESS_COARSE_LOCATION] == true
                if (granted) {
                    requestLocation { coords -> userCoords = coords }
                }
            }

            LaunchedEffect(Unit) {
                if (hasLocationPermission()) {
                    requestLocation { coords -> userCoords = coords }
                } else {
                    locationPermissionLauncher.launch(
                        arrayOf(
                            Manifest.permission.ACCESS_FINE_LOCATION,
                            Manifest.permission.ACCESS_COARSE_LOCATION,
                        )
                    )
                }
            }

            val adaptiveInfo = currentWindowAdaptiveInfo()
            val colors = if (isDark) CedarDark else CedarLight

            CedarTheme(colors = colors) {
                QualityOfLifeApp(
                    container = container,
                    windowWidthSizeClass = adaptiveInfo.windowSizeClass.windowWidthSizeClass,
                    isDarkTheme = isDark,
                    onToggleTheme = {
                        lifecycleScope.launch {
                            val nextMode = if (isDark) ThemeMode.Light else ThemeMode.Dark
                            container.settingsRepository.setThemeMode(nextMode)
                        }
                    },
                    localNetworkGranted = lanGranted,
                    onRequestLocalNetwork = {
                        requestLocalNetwork { lanPermissionLauncher.launch(LOCAL_NETWORK) }
                    },
                    userLocation = userCoords,
                )
            }
        }
    }

    private fun hasLocalNetworkAccess(): Boolean =
        Build.VERSION.SDK_INT < 37 || ContextCompat.checkSelfPermission(
            this,
            LOCAL_NETWORK
        ) == PackageManager.PERMISSION_GRANTED

    private var askedLocalNetwork = false
    private fun requestLocalNetwork(ask: () -> Unit) {
        if (shouldShowRequestPermissionRationale(LOCAL_NETWORK) || !askedLocalNetwork) {
            askedLocalNetwork = true
            ask()
        } else {
            startActivity(
                Intent(
                    Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                    Uri.fromParts("package", packageName, null)
                )
            )
        }
    }

    private fun hasLocationPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED ||
                ContextCompat.checkSelfPermission(
                    this,
                    Manifest.permission.ACCESS_COARSE_LOCATION
                ) == PackageManager.PERMISSION_GRANTED
    }

    private fun requestLocation(onLocation: (Pair<Double, Double>) -> Unit) {
        if (!hasLocationPermission()) return
        val lm = getSystemService(Context.LOCATION_SERVICE) as? LocationManager ?: return
        try {
            val lastGps = lm.getLastKnownLocation(LocationManager.GPS_PROVIDER)
            val lastNet = lm.getLastKnownLocation(LocationManager.NETWORK_PROVIDER)
            val best = lastGps ?: lastNet
            if (best != null) {
                onLocation(Pair(best.latitude, best.longitude))
            }

            val listener = object : LocationListener {
                override fun onLocationChanged(loc: Location) {
                    onLocation(Pair(loc.latitude, loc.longitude))
                    lm.removeUpdates(this)
                }
                @Deprecated("Deprecated in Java")
                override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {}
                override fun onProviderEnabled(provider: String) {}
                override fun onProviderDisabled(provider: String) {}
            }

            if (lm.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                lm.requestSingleUpdate(LocationManager.NETWORK_PROVIDER, listener, null)
            } else if (lm.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                lm.requestSingleUpdate(LocationManager.GPS_PROVIDER, listener, null)
            }
        } catch (_: SecurityException) {
        }
    }

    companion object {
        private const val LOCAL_NETWORK = "android.permission.ACCESS_LOCAL_NETWORK"
    }
}
