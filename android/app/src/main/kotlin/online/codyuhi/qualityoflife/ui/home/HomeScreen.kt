package online.codyuhi.qualityoflife.ui.home

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.window.core.layout.WindowWidthSizeClass
import online.codyuhi.qualityoflife.domain.City
import online.codyuhi.qualityoflife.domain.CitySortMode
import online.codyuhi.qualityoflife.ui.components.CedarCard
import online.codyuhi.qualityoflife.ui.components.CedarPill
import online.codyuhi.qualityoflife.ui.components.LocalNetworkBanner
import online.codyuhi.qualityoflife.ui.components.Lucide
import online.codyuhi.qualityoflife.ui.components.OfflineBanner
import online.codyuhi.qualityoflife.ui.components.SablierBanner
import online.codyuhi.qualityoflife.ui.components.ThemeToggle
import online.codyuhi.qualityoflife.ui.theme.Cedar
import online.codyuhi.qualityoflife.ui.theme.CedarSerif
import online.codyuhi.qualityoflife.ui.theme.Eyebrow
import online.codyuhi.qualityoflife.ui.theme.Mono
import java.text.NumberFormat
import java.util.Locale

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun HomeScreen(
    viewModel: HomeViewModel,
    windowWidthSizeClass: WindowWidthSizeClass,
    isDarkTheme: Boolean,
    onToggleTheme: () -> Unit,
    localNetworkGranted: Boolean,
    onRequestLocalNetwork: () -> Unit,
    onSelectCity: (City) -> Unit,
    modifier: Modifier = Modifier,
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    val isWideScreen = windowWidthSizeClass != WindowWidthSizeClass.COMPACT
    val focusManager = LocalFocusManager.current
    val haptics = LocalHapticFeedback.current

    Row(modifier = modifier.fillMaxSize().background(Cedar.colors.canvas)) {
        // Slim Icon Rail on Wide screens (Galaxy Z Fold 8 Ultra unfolded)
        if (isWideScreen) {
            Column(
                modifier = Modifier
                    .width(72.dp)
                    .fillMaxHeight()
                    .background(Cedar.colors.surface)
                    .border(width = 1.dp, color = Cedar.colors.line, shape = RoundedCornerShape(0.dp))
                    .padding(vertical = 16.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.SpaceBetween,
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Box(
                        modifier = Modifier
                            .size(44.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(Cedar.colors.spruce),
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(
                            imageVector = Lucide.HeartPulse,
                            contentDescription = "Quality of Life",
                            tint = Cedar.colors.onSpruce,
                            modifier = Modifier.size(24.dp),
                        )
                    }
                    Spacer(Modifier.height(24.dp))
                    IconButton(
                        onClick = { viewModel.setSortMode(CitySortMode.Distance) },
                        modifier = Modifier
                            .size(44.dp)
                            .clip(CircleShape)
                            .background(if (state.sortMode == CitySortMode.Distance) Cedar.colors.hover else Color.Transparent),
                    ) {
                        Icon(
                            imageVector = Lucide.Crosshair,
                            contentDescription = "Near You",
                            tint = if (state.sortMode == CitySortMode.Distance) Cedar.colors.brand else Cedar.colors.ink3,
                            modifier = Modifier.size(20.dp),
                        )
                    }
                    Spacer(Modifier.height(12.dp))
                    IconButton(
                        onClick = { viewModel.setSortMode(CitySortMode.Population) },
                        modifier = Modifier
                            .size(44.dp)
                            .clip(CircleShape)
                            .background(if (state.sortMode == CitySortMode.Population) Cedar.colors.hover else Color.Transparent),
                    ) {
                        Icon(
                            imageVector = Lucide.Globe,
                            contentDescription = "World Cities",
                            tint = if (state.sortMode == CitySortMode.Population) Cedar.colors.brand else Cedar.colors.ink3,
                            modifier = Modifier.size(20.dp),
                        )
                    }
                }

                ThemeToggle(
                    isDark = isDarkTheme,
                    onToggle = onToggleTheme,
                )
            }
        }

        // Main Content Area (allocating ≥85% width on wide displays)
        Column(
            modifier = Modifier
                .weight(1f)
                .fillMaxHeight()
                .padding(horizontal = if (isWideScreen) 24.dp else 16.dp)
                .imePadding(),
        ) {
            // Top Bar
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 16.dp, bottom = 12.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    if (!isWideScreen) {
                        Icon(
                            imageVector = Lucide.HeartPulse,
                            contentDescription = null,
                            tint = Cedar.colors.brand,
                            modifier = Modifier.size(24.dp),
                        )
                        Spacer(Modifier.width(8.dp))
                    }
                    Text(
                        text = "Quality of Life",
                        fontFamily = CedarSerif,
                        fontWeight = FontWeight.Bold,
                        fontSize = if (isWideScreen) 26.sp else 22.sp,
                        color = Cedar.colors.ink,
                    )
                }

                if (!isWideScreen) {
                    ThemeToggle(isDark = isDarkTheme, onToggle = onToggleTheme)
                }
            }

            // Banners
            if (!localNetworkGranted) {
                LocalNetworkBanner(
                    onRequestPermission = onRequestLocalNetwork,
                    modifier = Modifier.padding(bottom = 8.dp),
                )
            }
            if (!state.isOnline) {
                OfflineBanner(
                    onRetry = { },
                    modifier = Modifier.padding(bottom = 8.dp),
                )
            }
            if (state.isWakingUp) {
                SablierBanner(modifier = Modifier.padding(bottom = 8.dp))
            }

            // Search Input Field
            OutlinedTextField(
                value = state.searchQuery,
                onValueChange = { viewModel.setSearchQuery(it) },
                modifier = Modifier.fillMaxWidth(),
                placeholder = { Text("Search 260+ world cities...", fontSize = 14.sp, color = Cedar.colors.ink4) },
                leadingIcon = {
                    Icon(
                        imageVector = Lucide.Search,
                        contentDescription = "Search",
                        tint = Cedar.colors.ink3,
                        modifier = Modifier.size(18.dp),
                    )
                },
                trailingIcon = {
                    if (state.searchQuery.isNotBlank()) {
                        IconButton(onClick = { viewModel.clearSearch() }) {
                            Icon(
                                imageVector = Lucide.X,
                                contentDescription = "Clear search",
                                tint = Cedar.colors.ink3,
                                modifier = Modifier.size(18.dp),
                            )
                        }
                    }
                },
                singleLine = true,
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
                keyboardActions = KeyboardActions(
                    onSearch = {
                        focusManager.clearFocus()
                        viewModel.submitSearch(state.searchQuery)
                    }
                ),
                shape = RoundedCornerShape(6.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedContainerColor = Cedar.colors.surface,
                    unfocusedContainerColor = Cedar.colors.surface,
                    focusedBorderColor = Cedar.colors.brand,
                    unfocusedBorderColor = Cedar.colors.line,
                    focusedTextColor = Cedar.colors.ink,
                    unfocusedTextColor = Cedar.colors.ink,
                ),
            )

            // Search History Chips (if available)
            if (state.searchHistory.isNotEmpty() && state.searchQuery.isBlank()) {
                LazyRow(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 8.dp, bottom = 4.dp),
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    items(state.searchHistory) { item ->
                        Surface(
                            shape = RoundedCornerShape(9999.dp),
                            color = Cedar.colors.inset,
                            border = androidx.compose.foundation.BorderStroke(1.dp, Cedar.colors.line),
                            modifier = Modifier.clickable {
                                haptics.performHapticFeedback(HapticFeedbackType.LongPress)
                                viewModel.setSearchQuery(item)
                            },
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Text(
                                    text = item,
                                    fontSize = 12.sp,
                                    color = Cedar.colors.ink2,
                                )
                                Spacer(Modifier.width(4.dp))
                                Icon(
                                    imageVector = Lucide.X,
                                    contentDescription = "Remove",
                                    tint = Cedar.colors.ink4,
                                    modifier = Modifier
                                        .size(12.dp)
                                        .clickable { viewModel.removeHistoryItem(item) },
                                )
                            }
                        }
                    }
                }
            }

            // Database status badge and sorting options
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 10.dp, bottom = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Lucide.Database,
                        contentDescription = null,
                        tint = Cedar.colors.ink3,
                        modifier = Modifier.size(14.dp),
                    )
                    Spacer(Modifier.width(6.dp))
                    Text(
                        text = "${state.totalCitiesCount} cities ready",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium,
                        color = Cedar.colors.ink3,
                    )
                }

                // Sort Filter Chips
                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    FilterChip(
                        selected = state.sortMode == CitySortMode.Distance,
                        onClick = { viewModel.setSortMode(CitySortMode.Distance) },
                        label = { Text("Near You", fontSize = 11.sp) },
                        leadingIcon = if (state.locationGranted) {
                            {
                                Icon(
                                    imageVector = Lucide.Crosshair,
                                    contentDescription = null,
                                    modifier = Modifier.size(12.dp),
                                )
                            }
                        } else null,
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = Cedar.colors.spruce,
                            selectedLabelColor = Cedar.colors.onSpruce,
                            selectedLeadingIconColor = Cedar.colors.onSpruce,
                        ),
                    )
                    FilterChip(
                        selected = state.sortMode == CitySortMode.Population,
                        onClick = { viewModel.setSortMode(CitySortMode.Population) },
                        label = { Text("Population", fontSize = 11.sp) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = Cedar.colors.spruce,
                            selectedLabelColor = Cedar.colors.onSpruce,
                        ),
                    )
                    FilterChip(
                        selected = state.sortMode == CitySortMode.Alphabetical,
                        onClick = { viewModel.setSortMode(CitySortMode.Alphabetical) },
                        label = { Text("A–Z", fontSize = 11.sp) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = Cedar.colors.spruce,
                            selectedLabelColor = Cedar.colors.onSpruce,
                        ),
                    )
                }
            }

            // Cities Grid / List
            val columns = if (isWideScreen) GridCells.Fixed(3) else GridCells.Fixed(1)
            LazyVerticalGrid(
                columns = columns,
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                contentPadding = PaddingValues(bottom = 24.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                items(state.cities, key = { it.geonameId }) { city ->
                    CityCardItem(
                        city = city,
                        onClick = {
                            haptics.performHapticFeedback(HapticFeedbackType.LongPress)
                            onSelectCity(city)
                        },
                    )
                }
            }
        }
    }
}

@Composable
private fun CityCardItem(
    city: City,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    CedarCard(
        modifier = modifier,
        accent = Cedar.colors.brand,
        onClick = onClick,
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.Top,
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = city.name,
                    fontFamily = CedarSerif,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 17.sp,
                    color = Cedar.colors.ink,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Text(
                    text = city.country,
                    fontSize = 12.sp,
                    color = Cedar.colors.ink3,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }
            Icon(
                imageVector = Lucide.ChevronRight,
                contentDescription = null,
                tint = Cedar.colors.ink4,
                modifier = Modifier.size(16.dp),
            )
        }

        Spacer(Modifier.height(10.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                CedarPill(
                    text = city.continent,
                    color = Cedar.colors.inset,
                    textColor = Cedar.colors.ink3,
                )
                if (city.distanceKm != null) {
                    Spacer(Modifier.width(6.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Lucide.MapPin,
                            contentDescription = null,
                            tint = Cedar.colors.rust,
                            modifier = Modifier.size(12.dp),
                        )
                        Spacer(Modifier.width(2.dp))
                        Text(
                            text = if (city.distanceKm < 1.0) "< 1 km" else "${city.distanceKm.toInt()} km",
                            fontSize = 11.sp,
                            style = Mono,
                            color = Cedar.colors.ink3,
                        )
                    }
                }
            }

            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Lucide.Users,
                    contentDescription = null,
                    tint = Cedar.colors.ink4,
                    modifier = Modifier.size(12.dp),
                )
                Spacer(Modifier.width(3.dp))
                Text(
                    text = formatPopulation(city.population),
                    fontSize = 11.sp,
                    style = Mono,
                    color = Cedar.colors.ink3,
                )
            }
        }
    }
}

private fun formatPopulation(population: Int): String {
    return NumberFormat.getNumberInstance(Locale.US).format(population)
}
