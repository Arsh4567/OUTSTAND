package com.aistudio.outstand.ui.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.ui.graphics.vector.ImageVector

sealed class Screen(
    val route: String,
    val title: String,
    val selectedIcon: ImageVector,
    val unselectedIcon: ImageVector
) {
    object Dashboard : Screen(
        route = "dashboard",
        title = "Today",
        selectedIcon = Icons.Filled.Dashboard,
        unselectedIcon = Icons.Outlined.Dashboard
    )
    object Roadmap : Screen(
        route = "roadmap",
        title = "Roadmap",
        selectedIcon = Icons.Filled.AltRoute,
        unselectedIcon = Icons.Outlined.AltRoute
    )
    object Focus : Screen(
        route = "focus",
        title = "Focus",
        selectedIcon = Icons.Filled.Timer,
        unselectedIcon = Icons.Outlined.Timer
    )
    object Habits : Screen(
        route = "habits",
        title = "Habits",
        selectedIcon = Icons.Filled.CheckCircle,
        unselectedIcon = Icons.Outlined.CheckCircle
    )
    object Coach : Screen(
        route = "coach",
        title = "AI Coach",
        selectedIcon = Icons.Filled.Psychology,
        unselectedIcon = Icons.Outlined.Psychology
    )
    object Profile : Screen(
        route = "profile",
        title = "Profile",
        selectedIcon = Icons.Filled.Person,
        unselectedIcon = Icons.Outlined.Person
    )
}

val BottomNavItems = listOf(
    Screen.Dashboard,
    Screen.Roadmap,
    Screen.Focus,
    Screen.Habits,
    Screen.Coach
)
