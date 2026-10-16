package online.codyuhi.qualityoflife.ui.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import online.codyuhi.qualityoflife.R

val CedarSerif = FontFamily(
    Font(R.font.source_serif_4_semibold, FontWeight.SemiBold),
    Font(R.font.source_serif_4_bold, FontWeight.Bold),
    Font(R.font.source_serif_4_italic, FontWeight.Normal, FontStyle.Italic),
)

val CedarSans = FontFamily(
    Font(R.font.inter_regular, FontWeight.Normal),
    Font(R.font.inter_medium, FontWeight.Medium),
    Font(R.font.inter_semibold, FontWeight.SemiBold),
    Font(R.font.inter_bold, FontWeight.Bold),
)

val CedarMono = FontFamily(
    Font(R.font.jetbrains_mono_regular, FontWeight.Normal),
    Font(R.font.jetbrains_mono_semibold, FontWeight.SemiBold),
)

val CedarTypography = Typography(
    headlineMedium = TextStyle(
        fontFamily = CedarSerif,
        fontWeight = FontWeight.Bold,
        fontSize = 24.sp,
        lineHeight = 30.sp,
        letterSpacing = (-0.25).sp,
    ),
    headlineSmall = TextStyle(
        fontFamily = CedarSerif,
        fontWeight = FontWeight.SemiBold,
        fontSize = 20.sp,
        lineHeight = 26.sp,
    ),
    titleLarge = TextStyle(
        fontFamily = CedarSerif,
        fontWeight = FontWeight.SemiBold,
        fontSize = 18.sp,
        lineHeight = 24.sp,
    ),
    titleMedium = TextStyle(
        fontFamily = CedarSans,
        fontWeight = FontWeight.SemiBold,
        fontSize = 15.sp,
        lineHeight = 21.sp,
    ),
    bodyLarge = TextStyle(
        fontFamily = CedarSans,
        fontSize = 16.sp,
        lineHeight = 24.sp,
    ),
    bodyMedium = TextStyle(
        fontFamily = CedarSans,
        fontSize = 14.sp,
        lineHeight = 20.sp,
    ),
    bodySmall = TextStyle(
        fontFamily = CedarSans,
        fontSize = 12.sp,
        lineHeight = 16.sp,
    ),
    labelLarge = TextStyle(
        fontFamily = CedarSans,
        fontWeight = FontWeight.Medium,
        fontSize = 14.sp,
    ),
    labelMedium = TextStyle(
        fontFamily = CedarSans,
        fontWeight = FontWeight.Medium,
        fontSize = 11.sp,
    ),
    labelSmall = TextStyle(
        fontFamily = CedarSans,
        fontWeight = FontWeight.SemiBold,
        fontSize = 11.sp,
        letterSpacing = 0.9.sp,
    ),
)

val Eyebrow = TextStyle(
    fontFamily = CedarSans,
    fontWeight = FontWeight.SemiBold,
    fontSize = 11.sp,
    letterSpacing = 0.9.sp,
)

val Mono = TextStyle(
    fontFamily = CedarMono,
    fontSize = 13.sp,
)

val MonoSmall = TextStyle(
    fontFamily = CedarMono,
    fontSize = 11.sp,
)

val CedarShapes = Shapes(
    extraSmall = RoundedCornerShape(4.dp),
    small = RoundedCornerShape(4.dp),
    medium = RoundedCornerShape(6.dp),
    large = RoundedCornerShape(8.dp),
    extraLarge = RoundedCornerShape(8.dp),
)

private fun CedarColors.toMaterial(): ColorScheme {
    val base = if (dark) darkColorScheme() else lightColorScheme()
    return base.copy(
        primary = spruce,
        onPrimary = onSpruce,
        primaryContainer = spruce,
        onPrimaryContainer = onSpruce,
        secondary = brand,
        onSecondary = if (dark) canvas else onSpruce,
        secondaryContainer = inset,
        onSecondaryContainer = ink2,
        tertiary = ochre,
        background = canvas,
        onBackground = ink2,
        surface = surface,
        onSurface = ink2,
        surfaceVariant = inset,
        onSurfaceVariant = ink3,
        surfaceContainer = surface,
        surfaceContainerLow = inset,
        surfaceContainerLowest = canvas,
        surfaceContainerHigh = hover,
        surfaceContainerHighest = hover,
        surfaceTint = Color.Transparent,
        outline = lineStrong,
        outlineVariant = line,
        error = rust,
        onError = onSpruce,
        inverseSurface = ink2,
        inverseOnSurface = surface,
    )
}

@Composable
fun CedarTheme(colors: CedarColors, content: @Composable () -> Unit) {
    CompositionLocalProvider(LocalCedarColors provides colors) {
        MaterialTheme(
            colorScheme = colors.toMaterial(),
            typography = CedarTypography,
            shapes = CedarShapes,
            content = content,
        )
    }
}

object Cedar {
    val colors: CedarColors
        @Composable @ReadOnlyComposable get() = LocalCedarColors.current
}
