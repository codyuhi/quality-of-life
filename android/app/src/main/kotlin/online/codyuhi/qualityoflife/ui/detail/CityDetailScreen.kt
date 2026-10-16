package online.codyuhi.qualityoflife.ui.detail

import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Divider
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.window.core.layout.WindowWidthSizeClass
import coil3.compose.AsyncImage
import online.codyuhi.qualityoflife.domain.CityDetails
import online.codyuhi.qualityoflife.domain.ScoresData
import online.codyuhi.qualityoflife.domain.UrbanAreaDetails
import online.codyuhi.qualityoflife.ui.components.CedarCard
import online.codyuhi.qualityoflife.ui.components.CedarPill
import online.codyuhi.qualityoflife.ui.components.CedarScoreBar
import online.codyuhi.qualityoflife.ui.components.Lucide
import online.codyuhi.qualityoflife.ui.components.SablierBanner
import online.codyuhi.qualityoflife.ui.components.ThemeToggle
import online.codyuhi.qualityoflife.ui.theme.Cedar
import online.codyuhi.qualityoflife.ui.theme.CedarSerif
import online.codyuhi.qualityoflife.ui.theme.Eyebrow
import online.codyuhi.qualityoflife.ui.theme.Mono
import java.text.NumberFormat
import java.util.Locale

@Composable
fun CityDetailScreen(
    viewModel: CityDetailViewModel,
    windowWidthSizeClass: WindowWidthSizeClass,
    isDarkTheme: Boolean,
    onToggleTheme: () -> Unit,
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    val context = LocalContext.current
    val haptics = LocalHapticFeedback.current
    val isWideScreen = windowWidthSizeClass != WindowWidthSizeClass.COMPACT
    val scrollState = rememberScrollState()

    val details = state.details
    val scores = state.scores
    val urbanDetails = state.urbanDetails
    val image = state.image

    val onShareCity = {
        val shareText = buildString {
            append("Quality of Life: ${details?.name ?: "City"}, ${details?.country ?: ""}\n")
            if (scores != null) {
                append("Teleport City Score: ${String.format(Locale.US, "%.1f", scores.teleportCityScore)} / 100\n\n")
                append("Ratings Highlights:\n")
                scores.categories.take(5).forEach { cat ->
                    append("• ${cat.name}: ${String.format(Locale.US, "%.1f", cat.score)} / 10\n")
                }
            }
            append("\nhttps://quality-of-life.lan.codyuhi.online")
        }
        val intent = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(Intent.EXTRA_SUBJECT, "Quality of Life - ${details?.name}")
            putExtra(Intent.EXTRA_TEXT, shareText)
        }
        context.startActivity(Intent.createChooser(intent, "Share City Ratings"))
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(Cedar.colors.canvas),
    ) {
        // Navigation Bar
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(Cedar.colors.surface)
                .padding(horizontal = 8.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = onBack) {
                    Icon(
                        imageVector = Lucide.ArrowLeft,
                        contentDescription = "Back",
                        tint = Cedar.colors.ink,
                        modifier = Modifier.size(20.dp),
                    )
                }
                Spacer(Modifier.width(4.dp))
                Text(
                    text = details?.name ?: "City Details",
                    fontFamily = CedarSerif,
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp,
                    color = Cedar.colors.ink,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }

            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = onShareCity) {
                    Icon(
                        imageVector = Lucide.Share2,
                        contentDescription = "Share",
                        tint = Cedar.colors.ink2,
                        modifier = Modifier.size(18.dp),
                    )
                }
                ThemeToggle(isDark = isDarkTheme, onToggle = onToggleTheme)
            }
        }

        HorizontalDivider(color = Cedar.colors.line, thickness = 1.dp)

        if (state.isWakingUp) {
            SablierBanner(modifier = Modifier.padding(12.dp))
        }

        // Scrollable Body
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(scrollState)
                .padding(horizontal = if (isWideScreen) 24.dp else 16.dp, vertical = 16.dp),
        ) {
            // City Cover Image (MinIO S3 via Coil)
            val imageUrl = image?.mobileUrl ?: image?.webUrl
            if (!imageUrl.isNullOrBlank()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(if (isWideScreen) 240.dp else 180.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(Cedar.colors.inset),
                ) {
                    AsyncImage(
                        model = imageUrl,
                        contentDescription = "City photo of ${details?.name}",
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize(),
                    )
                    image?.photographer?.let { photographer ->
                        Surface(
                            shape = RoundedCornerShape(topStart = 6.dp),
                            color = Cedar.colors.canvas.copy(alpha = 0.85f),
                            modifier = Modifier.align(Alignment.BottomEnd),
                        ) {
                            Text(
                                text = "Photo: $photographer",
                                style = Eyebrow,
                                fontSize = 10.sp,
                                color = Cedar.colors.ink2,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                            )
                        }
                    }
                }
                Spacer(Modifier.height(16.dp))
            }

            // City Overview Header Card
            CedarCard(accent = Cedar.colors.brand) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Top,
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = details?.name ?: "Loading...",
                            fontFamily = CedarSerif,
                            fontWeight = FontWeight.Bold,
                            fontSize = 24.sp,
                            color = Cedar.colors.ink,
                        )
                        Text(
                            text = details?.country ?: "",
                            fontSize = 14.sp,
                            color = Cedar.colors.ink3,
                        )
                    }

                    if (scores != null && scores.teleportCityScore > 0f) {
                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = Cedar.colors.spruce,
                        ) {
                            Column(
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                                horizontalAlignment = Alignment.CenterHorizontally,
                            ) {
                                Text(
                                    text = "SCORE",
                                    style = Eyebrow,
                                    fontSize = 9.sp,
                                    color = Cedar.colors.onSpruce.copy(alpha = 0.8f),
                                )
                                Text(
                                    text = String.format(Locale.US, "%.1f", scores.teleportCityScore),
                                    style = Mono,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 18.sp,
                                    color = Cedar.colors.onSpruce,
                                )
                            }
                        }
                    }
                }

                Spacer(Modifier.height(12.dp))
                HorizontalDivider(color = Cedar.colors.line.copy(alpha = 0.6f), thickness = 0.5.dp)
                Spacer(Modifier.height(12.dp))

                // Metadata Rows
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Lucide.Users, contentDescription = null, tint = Cedar.colors.ink3, modifier = Modifier.size(14.dp))
                        Spacer(Modifier.width(6.dp))
                        Text(
                            text = NumberFormat.getNumberInstance(Locale.US).format(details?.population ?: 0),
                            style = Mono,
                            fontSize = 12.sp,
                            color = Cedar.colors.ink2,
                        )
                    }
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Lucide.Clock, contentDescription = null, tint = Cedar.colors.ink3, modifier = Modifier.size(14.dp))
                        Spacer(Modifier.width(6.dp))
                        Text(
                            text = details?.timezone ?: "UTC",
                            fontSize = 12.sp,
                            color = Cedar.colors.ink2,
                        )
                    }
                    if (details != null && details.latitude != 0.0) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Lucide.MapPin, contentDescription = null, tint = Cedar.colors.rust, modifier = Modifier.size(14.dp))
                            Spacer(Modifier.width(6.dp))
                            Text(
                                text = String.format(Locale.US, "%.2f°, %.2f°", details.latitude, details.longitude),
                                style = Mono,
                                fontSize = 12.sp,
                                color = Cedar.colors.ink2,
                            )
                        }
                    }
                }
            }

            Spacer(Modifier.height(16.dp))

            // Main Metrics Section (Two-column layout on Wide screen / Foldable unfolded)
            if (isWideScreen) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(16.dp),
                ) {
                    // Left Column: 14 Quality of Life Categories
                    Column(modifier = Modifier.weight(1f)) {
                        ScoresSection(scores = scores)
                    }

                    // Right Column: Local Statistics & Details
                    Column(modifier = Modifier.weight(1f)) {
                        UrbanDetailsSection(urbanDetails = urbanDetails)
                    }
                }
            } else {
                // Compact Screen (Single column vertical flow)
                ScoresSection(scores = scores)
                Spacer(Modifier.height(16.dp))
                UrbanDetailsSection(urbanDetails = urbanDetails)
            }
        }
    }
}

@Composable
private fun ScoresSection(scores: ScoresData?) {
    CedarCard {
        Text(
            text = "Quality of Life Ratings",
            fontFamily = CedarSerif,
            fontWeight = FontWeight.Bold,
            fontSize = 16.sp,
            color = Cedar.colors.ink,
        )
        Spacer(Modifier.height(12.dp))

        if (scores != null && scores.categories.isNotEmpty()) {
            scores.categories.forEach { category ->
                CedarScoreBar(
                    score = category.score,
                    label = category.name,
                    colorHex = category.color,
                    modifier = Modifier.padding(vertical = 4.dp),
                )
            }
        } else {
            Text(
                text = "No rating categories on file for this location.",
                fontSize = 13.sp,
                color = Cedar.colors.ink4,
                modifier = Modifier.padding(vertical = 12.dp),
            )
        }
    }
}

@Composable
private fun UrbanDetailsSection(urbanDetails: UrbanAreaDetails?) {
    CedarCard {
        Text(
            text = "Local Statistics & Costs",
            fontFamily = CedarSerif,
            fontWeight = FontWeight.Bold,
            fontSize = 16.sp,
            color = Cedar.colors.ink,
        )
        Spacer(Modifier.height(12.dp))

        if (urbanDetails != null && urbanDetails.categories.isNotEmpty()) {
            urbanDetails.categories.forEachIndexed { index, category ->
                if (index > 0) {
                    HorizontalDivider(
                        color = Cedar.colors.line.copy(alpha = 0.5f),
                        thickness = 0.5.dp,
                        modifier = Modifier.padding(vertical = 8.dp),
                    )
                }
                Text(
                    text = category.label,
                    style = Eyebrow,
                    fontSize = 12.sp,
                    color = Cedar.colors.brand,
                    modifier = Modifier.padding(bottom = 6.dp),
                )
                category.data.forEach { item ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 3.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(
                            text = item.label,
                            fontSize = 13.sp,
                            color = Cedar.colors.ink2,
                        )
                        Text(
                            text = item.value,
                            style = Mono,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Cedar.colors.ink,
                        )
                    }
                }
            }
        } else {
            Text(
                text = "No granular economic details on file.",
                fontSize = 13.sp,
                color = Cedar.colors.ink4,
                modifier = Modifier.padding(vertical = 12.dp),
            )
        }
    }
}
