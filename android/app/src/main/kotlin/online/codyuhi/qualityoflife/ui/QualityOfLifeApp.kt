package online.codyuhi.qualityoflife.ui

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.toRoute
import androidx.window.core.layout.WindowWidthSizeClass
import online.codyuhi.qualityoflife.di.AppContainer
import online.codyuhi.qualityoflife.ui.detail.CityDetailScreen
import online.codyuhi.qualityoflife.ui.detail.CityDetailViewModel
import online.codyuhi.qualityoflife.ui.home.HomeScreen
import online.codyuhi.qualityoflife.ui.home.HomeViewModel
import online.codyuhi.qualityoflife.ui.navigation.CityDetailRoute
import online.codyuhi.qualityoflife.ui.navigation.HomeRoute

@Composable
fun QualityOfLifeApp(
    container: AppContainer,
    windowWidthSizeClass: WindowWidthSizeClass,
    isDarkTheme: Boolean,
    onToggleTheme: () -> Unit,
    localNetworkGranted: Boolean,
    onRequestLocalNetwork: () -> Unit,
    userLocation: Pair<Double, Double>?,
    modifier: Modifier = Modifier,
) {
    val navController = rememberNavController()

    NavHost(
        navController = navController,
        startDestination = HomeRoute,
        modifier = modifier,
    ) {
        composable<HomeRoute> {
            val homeVm: HomeViewModel = viewModel(
                factory = viewModelFactory {
                    initializer { HomeViewModel(container) }
                }
            )

            LaunchedEffect(userLocation) {
                if (userLocation != null) {
                    homeVm.updateLocation(userLocation.first, userLocation.second)
                }
            }

            HomeScreen(
                viewModel = homeVm,
                windowWidthSizeClass = windowWidthSizeClass,
                isDarkTheme = isDarkTheme,
                onToggleTheme = onToggleTheme,
                localNetworkGranted = localNetworkGranted,
                onRequestLocalNetwork = onRequestLocalNetwork,
                onSelectCity = { city ->
                    navController.navigate(
                        CityDetailRoute(
                            geonameId = city.geonameId,
                            slug = city.urbanAreaSlug,
                            cityName = city.name,
                        )
                    )
                },
            )
        }

        composable<CityDetailRoute> { backStackEntry ->
            val route: CityDetailRoute = backStackEntry.toRoute()
            val detailVm: CityDetailViewModel = viewModel(
                key = "detail_${route.geonameId}",
                factory = viewModelFactory {
                    initializer {
                        CityDetailViewModel(
                            geonameId = route.geonameId,
                            urbanAreaSlug = route.slug,
                            container = container,
                        )
                    }
                }
            )

            CityDetailScreen(
                viewModel = detailVm,
                windowWidthSizeClass = windowWidthSizeClass,
                isDarkTheme = isDarkTheme,
                onToggleTheme = onToggleTheme,
                onBack = { navController.popBackStack() },
            )
        }
    }
}
