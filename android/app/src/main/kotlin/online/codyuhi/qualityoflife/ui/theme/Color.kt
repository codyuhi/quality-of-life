package online.codyuhi.qualityoflife.ui.theme

import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color

@Immutable
data class CedarColors(
    val canvas: Color,
    val surface: Color,
    val inset: Color,
    val hover: Color,
    val field: Color,
    val ink: Color,
    val ink2: Color,
    val ink3: Color,
    val ink4: Color,
    val line: Color,
    val lineStrong: Color,
    val spruce: Color,
    val spruceHover: Color,
    val onSpruce: Color,
    val brand: Color,
    val rust: Color,
    val ochre: Color,
    val juniper: Color,
    val scoreHigh: Color,
    val scoreMid: Color,
    val scoreLow: Color,
    val okBg: Color,
    val okText: Color,
    val warnBg: Color,
    val warnText: Color,
    val errBg: Color,
    val errText: Color,
    val dark: Boolean,
)

val CedarLight = CedarColors(
    canvas = Color(0xFFEBE7DF),
    surface = Color(0xFFF5F3EC),
    inset = Color(0xFFE4DFD4),
    hover = Color(0xFFDBD5C7),
    field = Color(0xFFFFFFFF),
    ink = Color(0xFF141412),
    ink2 = Color(0xFF242320),
    ink3 = Color(0xFF48453D),
    ink4 = Color(0xFF666257),
    line = Color(0xFFCDC7BA),
    lineStrong = Color(0xFFABA496),
    spruce = Color(0xFF1F513F),
    spruceHover = Color(0xFF184133),
    onSpruce = Color(0xFFFAFBF9),
    brand = Color(0xFF1F513F),
    rust = Color(0xFFC7370F),
    ochre = Color(0xFF854714),
    juniper = Color(0xFF1B437E),
    scoreHigh = Color(0xFF1F513F),
    scoreMid = Color(0xFFB8860B),
    scoreLow = Color(0xFFC7370F),
    okBg = Color(0xFFD8E8DC),
    okText = Color(0xFF1F513F),
    warnBg = Color(0xFFEDE4CE),
    warnText = Color(0xFF854714),
    errBg = Color(0xFFEDDCD5),
    errText = Color(0xFF811823),
    dark = false,
)

val CedarDark = CedarColors(
    canvas = Color(0xFF161614),
    surface = Color(0xFF22221F),
    inset = Color(0xFF1B1B18),
    hover = Color(0xFF2D2C28),
    field = Color(0xFF1A1A18),
    ink = Color(0xFFFFFFFF),
    ink2 = Color(0xFFF4F2ED),
    ink3 = Color(0xFFD5CFC3),
    ink4 = Color(0xFF9E998E),
    line = Color(0xFF383630),
    lineStrong = Color(0xFF545149),
    spruce = Color(0xFF235C48),
    spruceHover = Color(0xFF2E745C),
    onSpruce = Color(0xFFFAFBF9),
    brand = Color(0xFF48A97C),
    rust = Color(0xFFE0532B),
    ochre = Color(0xFFFBBF24),
    juniper = Color(0xFF60A5FA),
    scoreHigh = Color(0xFF48A97C),
    scoreMid = Color(0xFFFBBF24),
    scoreLow = Color(0xFFE0532B),
    okBg = Color(0x382E6B34),
    okText = Color(0xFF4ADE80),
    warnBg = Color(0x38854714),
    warnText = Color(0xFFFBBF24),
    errBg = Color(0x38811823),
    errText = Color(0xFFF87171),
    dark = true,
)

val LocalCedarColors = staticCompositionLocalOf { CedarLight }

fun scoreColor(score: Float, isDark: Boolean = false): Color {
    return when {
        score >= 7.5f -> if (isDark) Color(0xFF48A97C) else Color(0xFF1F513F)
        score >= 5.0f -> if (isDark) Color(0xFFFBBF24) else Color(0xFFB8860B)
        else -> if (isDark) Color(0xFFE0532B) else Color(0xFFC7370F)
    }
}
