package com.aistudio.outstand.ui.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.Map
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Speed
import androidx.compose.material.icons.filled.Timer
import androidx.compose.ui.graphics.vector.ImageVector

sealed class Screen(val route: String, val title: String, val icon: ImageVector) {
    object Dashboard : Screen("dashboard", "Dashboard", Icons.Default.Dashboard)
    object Roadmap : Screen("roadmap", "Roadmap", Icons.Default.Map)
    object Focus : Screen("focus", "Focus", Icons.Default.Timer)
    object Habits : Screen("habits", "Habits", Icons.Default.CheckCircle)
    object Momentum : Screen("momentum", "Momentum", Icons.Default.Speed)
    object Coach : Screen("coach", "Coach", Icons.Default.AutoAwesome)
    object Profile : Screen("profile", "Profile", Icons.Default.Person)
}

val BottomNavItems = listOf(
    Screen.Dashboard,
    Screen.Roadmap,
    Screen.Focus,
    Screen.Habits,
    Screen.Momentum,
    Screen.Coach,
    Screen.Profile
)
