package online.codyuhi.qualityoflife.ui.components

import androidx.core.graphics.toColorInt
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import online.codyuhi.qualityoflife.ui.theme.Cedar
import online.codyuhi.qualityoflife.ui.theme.CedarSerif
import online.codyuhi.qualityoflife.ui.theme.Eyebrow
import online.codyuhi.qualityoflife.ui.theme.Mono
import online.codyuhi.qualityoflife.ui.theme.scoreColor

@Composable
fun CedarCard(
    modifier: Modifier = Modifier,
    accent: Color? = null,
    onClick: (() -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit,
) {
    Surface(
        modifier = modifier
            .fillMaxWidth()
            .then(if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier),
        shape = RoundedCornerShape(6.dp),
        color = Cedar.colors.surface,
        border = BorderStroke(1.dp, Cedar.colors.line),
    ) {
        Column {
            if (accent != null) {
                Box(
                    Modifier
                        .fillMaxWidth()
                        .height(3.dp)
                        .background(accent)
                )
            }
            Column(Modifier.padding(14.dp)) {
                content()
            }
        }
    }
}

@Composable
fun PrimaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    icon: ImageVector? = null,
    enabled: Boolean = true,
) {
    val haptics = LocalHapticFeedback.current
    Button(
        onClick = {
            haptics.performHapticFeedback(HapticFeedbackType.LongPress)
            onClick()
        },
        modifier = modifier,
        enabled = enabled,
        shape = RoundedCornerShape(4.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = Cedar.colors.spruce,
            contentColor = Cedar.colors.onSpruce,
        ),
    ) {
        if (icon != null) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                modifier = Modifier.size(16.dp),
                tint = Cedar.colors.onSpruce,
            )
            Spacer(Modifier.width(8.dp))
        }
        Text(text, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
    }
}

@Composable
fun CedarPill(
    text: String,
    modifier: Modifier = Modifier,
    color: Color = Cedar.colors.spruce,
    textColor: Color = Cedar.colors.onSpruce,
    icon: ImageVector? = null,
) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(9999.dp),
        color = color,
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center,
        ) {
            if (icon != null) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    modifier = Modifier.size(12.dp),
                    tint = textColor,
                )
                Spacer(Modifier.width(4.dp))
            }
            Text(
                text = text,
                style = Eyebrow,
                fontSize = 11.sp,
                color = textColor,
                fontWeight = FontWeight.SemiBold,
            )
        }
    }
}

@Composable
fun CedarScoreBar(
    score: Float,
    label: String,
    modifier: Modifier = Modifier,
    colorHex: String? = null,
) {
    val clampedScore = score.coerceIn(0f, 10f)
    val percentage = clampedScore / 10f
    val barColor = if (!colorHex.isNullOrBlank() && colorHex.startsWith("#")) {
        runCatching { Color(colorHex.toColorInt()) }.getOrDefault(scoreColor(score, Cedar.colors.dark))
    } else {
        scoreColor(score, Cedar.colors.dark)
    }

    Column(modifier = modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                text = label,
                fontSize = 13.sp,
                fontWeight = FontWeight.Medium,
                color = Cedar.colors.ink2,
            )
            Text(
                text = String.format(java.util.Locale.US, "%.1f / 10", clampedScore),
                style = Mono,
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold,
                color = barColor,
            )
        }
        Spacer(Modifier.height(4.dp))
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(8.dp)
                .clip(RoundedCornerShape(4.dp))
                .background(Cedar.colors.inset),
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth(percentage)
                    .height(8.dp)
                    .clip(RoundedCornerShape(4.dp))
                    .background(barColor),
            )
        }
    }
}

@Composable
fun OfflineBanner(
    modifier: Modifier = Modifier,
    onRetry: () -> Unit,
) {
    Surface(
        modifier = modifier.fillMaxWidth(),
        color = Cedar.colors.warnBg,
        border = BorderStroke(1.dp, Cedar.colors.ochre.copy(alpha = 0.3f)),
        shape = RoundedCornerShape(4.dp),
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(
                imageVector = Lucide.WifiOff,
                contentDescription = null,
                tint = Cedar.colors.warnText,
                modifier = Modifier.size(16.dp),
            )
            Spacer(Modifier.width(8.dp))
            Text(
                text = "Offline: showing saved city catalog",
                fontSize = 12.sp,
                color = Cedar.colors.warnText,
                modifier = Modifier.weight(1f),
            )
            Text(
                text = "Retry",
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                color = Cedar.colors.warnText,
                modifier = Modifier
                    .clickable(onClick = onRetry)
                    .padding(4.dp),
            )
        }
    }
}

@Composable
fun SablierBanner(modifier: Modifier = Modifier) {
    Surface(
        modifier = modifier.fillMaxWidth(),
        color = Cedar.colors.inset,
        border = BorderStroke(1.dp, Cedar.colors.spruce.copy(alpha = 0.3f)),
        shape = RoundedCornerShape(4.dp),
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            CircularProgressIndicator(
                modifier = Modifier.size(14.dp),
                strokeWidth = 2.dp,
                color = Cedar.colors.brand,
            )
            Spacer(Modifier.width(8.dp))
            Text(
                text = "Waking up Quality of Life backend…",
                fontSize = 12.sp,
                color = Cedar.colors.ink2,
            )
        }
    }
}

@Composable
fun LocalNetworkBanner(
    modifier: Modifier = Modifier,
    onRequestPermission: () -> Unit,
) {
    Surface(
        modifier = modifier.fillMaxWidth(),
        color = Cedar.colors.warnBg,
        border = BorderStroke(1.dp, Cedar.colors.ochre.copy(alpha = 0.4f)),
        shape = RoundedCornerShape(4.dp),
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(
                imageVector = Lucide.Globe,
                contentDescription = null,
                tint = Cedar.colors.warnText,
                modifier = Modifier.size(16.dp),
            )
            Spacer(Modifier.width(8.dp))
            Text(
                text = "Allow local network access to reach homelab on Wi-Fi",
                fontSize = 12.sp,
                color = Cedar.colors.warnText,
                modifier = Modifier.weight(1f),
            )
            Spacer(Modifier.width(8.dp))
            Button(
                onClick = onRequestPermission,
                shape = RoundedCornerShape(4.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Cedar.colors.spruce,
                    contentColor = Cedar.colors.onSpruce,
                ),
                contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 8.dp, vertical = 2.dp),
            ) {
                Text("Allow", fontSize = 11.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
fun ThemeToggle(
    isDark: Boolean,
    onToggle: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val haptics = LocalHapticFeedback.current
    IconButton(
        onClick = {
            haptics.performHapticFeedback(HapticFeedbackType.LongPress)
            onToggle()
        },
        modifier = modifier
            .size(36.dp)
            .clip(CircleShape)
            .background(Cedar.colors.inset),
    ) {
        Icon(
            imageVector = if (isDark) Lucide.Sun else Lucide.Moon,
            contentDescription = if (isDark) "Switch to Light Theme" else "Switch to Dark Theme",
            tint = Cedar.colors.ink2,
            modifier = Modifier.size(18.dp),
        )
    }
}
