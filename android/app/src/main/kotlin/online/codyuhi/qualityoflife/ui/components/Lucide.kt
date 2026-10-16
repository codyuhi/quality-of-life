package online.codyuhi.qualityoflife.ui.components

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.addPathNodes
import androidx.compose.ui.unit.dp

private fun lucide(name: String, vararg paths: String): ImageVector =
    ImageVector.Builder(name, 24.dp, 24.dp, 24f, 24f).apply {
        paths.forEach {
            addPath(
                pathData = addPathNodes(it),
                stroke = SolidColor(Color.Black),
                strokeLineWidth = 2f,
                strokeLineCap = StrokeCap.Round,
                strokeLineJoin = StrokeJoin.Round,
            )
        }
    }.build()

object Lucide {
    val HeartPulse: ImageVector by lazy {
        lucide(
            "heart-pulse",
            "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z",
            "M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h4.27",
        )
    }

    val Search: ImageVector by lazy {
        lucide(
            "search",
            "m21 21-4.3-4.3",
            "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z",
        )
    }

    val Globe: ImageVector by lazy {
        lucide(
            "globe",
            "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
            "M2 12h20",
            "M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z",
        )
    }

    val Building: ImageVector by lazy {
        lucide(
            "building",
            "M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z",
            "M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2",
            "M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2",
            "M10 6h4",
            "M10 10h4",
            "M10 14h4",
            "M10 18h4",
        )
    }

    val Users: ImageVector by lazy {
        lucide(
            "users",
            "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",
            "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
            "M22 21v-2a4 4 0 0 0-3-3.87",
            "M16 3.13a4 4 0 0 1 0 7.75",
        )
    }

    val MapPin: ImageVector by lazy {
        lucide(
            "map-pin",
            "M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0",
            "M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
        )
    }

    val Clock: ImageVector by lazy {
        lucide(
            "clock",
            "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
            "M12 6v6l4 2",
        )
    }

    val ChevronRight: ImageVector by lazy {
        lucide(
            "chevron-right",
            "m9 18 6-6-6-6",
        )
    }

    val ChevronLeft: ImageVector by lazy {
        lucide(
            "chevron-left",
            "m15 18-6-6 6-6",
        )
    }

    val ArrowLeft: ImageVector by lazy {
        lucide(
            "arrow-left",
            "m12 19-7-7 7-7",
            "M19 12H5",
        )
    }

    val Share2: ImageVector by lazy {
        lucide(
            "share-2",
            "M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
            "M6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
            "M18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
            "m8.59 13.51 6.83 3.98",
            "m15.41 6.51-6.82 3.98",
        )
    }

    val Sun: ImageVector by lazy {
        lucide(
            "sun",
            "M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
            "M12 2v2",
            "M12 20v2",
            "m4.93 4.93 1.41 1.41",
            "m17.66 17.66 1.41 1.41",
            "M2 12h2",
            "M20 12h2",
            "m6.34 17.66-1.41 1.41",
            "m19.07 4.93-1.41 1.41",
        )
    }

    val Moon: ImageVector by lazy {
        lucide(
            "moon",
            "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z",
        )
    }

    val RefreshCw: ImageVector by lazy {
        lucide(
            "refresh-cw",
            "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",
            "M21 3v5h-5",
            "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",
            "M8 16H3v5",
        )
    }

    val X: ImageVector by lazy {
        lucide(
            "x",
            "M18 6 6 18",
            "m6 6 12 12",
        )
    }

    val Database: ImageVector by lazy {
        lucide(
            "database",
            "M21 5c0 1.66-4 3-9 3s-9-1.34-9-3 4-3 9-3 9 1.34 9 3z",
            "M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5",
            "M3 12c0 1.66 4 3 9 3s9-1.34 9-3",
        )
    }

    val CheckCircle: ImageVector by lazy {
        lucide(
            "check-circle",
            "M22 11.08V12a10 10 0 1 1-5.93-9.14",
            "m9 11 3 3L22 4",
        )
    }

    val Crosshair: ImageVector by lazy {
        lucide(
            "crosshair",
            "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
            "M22 12h-4",
            "M6 12H2",
            "M12 6V2",
            "M12 22v-4",
        )
    }

    val WifiOff: ImageVector by lazy {
        lucide(
            "wifi-off",
            "m2 2 20 20",
            "M8.5 16.5a5 5 0 0 1 7 0",
            "M2 8.82a15 15 0 0 1 4.17-2.65",
            "M10.66 5c4.01-.36 8.14.9 11.34 3.76",
            "M16.85 11.25a10 10 0 0 1 2.22 1.68",
            "M5 13a10 10 0 0 1 .52-.44",
            "M12 20h.01",
        )
    }
}
