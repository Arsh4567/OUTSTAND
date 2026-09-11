package com.aistudio.outstand

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.aistudio.outstand.ui.navigation.Screen
import com.aistudio.outstand.ui.screens.coach.AiCoachScreen
import com.aistudio.outstand.ui.screens.dashboard.DashboardScreen
import com.aistudio.outstand.ui.screens.focus.FocusScreen
import com.aistudio.outstand.ui.screens.habits.HabitsScreen
import com.aistudio.outstand.ui.screens.momentum.MomentumScreen
import com.aistudio.outstand.ui.screens.profile.ProfileScreen
import com.aistudio.outstand.ui.screens.roadmap.RoadmapScreen
import com.aistudio.outstand.ui.theme.DeepBackground
import com.aistudio.outstand.ui.theme.OutstandTheme
import com.aistudio.outstand.ui.theme.PrimaryIndigo
import com.aistudio.outstand.ui.theme.SurfaceDark
import com.aistudio.outstand.ui.theme.TextMuted
import com.aistudio.outstand.ui.theme.TextPrimary

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val app = application as OutstandApplication
        val repository = app.repository

        setContent {
            OutstandTheme {
                val navController = rememberNavController()
                val navBackStackEntry by navController.currentBackStackEntryAsState()
                val currentDestination = navBackStackEntry?.destination

                val navItems = listOf(
                    Screen.Dashboard,
                    Screen.Roadmap,
                    Screen.Focus,
                    Screen.Habits,
                    Screen.Momentum,
                    Screen.Coach,
                    Screen.Profile
                )

                Scaffold(
                    modifier = Modifier.fillMaxSize(),
                    containerColor = DeepBackground,
                    bottomBar = {
                        NavigationBar(
                            containerColor = SurfaceDark,
                            tonalElevation = 8.dp,
                            modifier = Modifier.testTag("bottom_nav_bar")
                        ) {
                            navItems.forEach { screen ->
                                val selected = currentDestination?.route == screen.route
                                NavigationBarItem(
                                    icon = {
                                        Icon(
                                            imageVector = screen.icon,
                                            contentDescription = screen.title
                                        )
                                    },
                                    label = {
                                        Text(
                                            text = screen.title,
                                            fontSize = 9.sp,
                                            maxLines = 1
                                        )
                                    },
                                    selected = selected,
                                    onClick = {
                                        navController.navigate(screen.route) {
                                            popUpTo(navController.graph.findStartDestination().id) {
                                                saveState = true
                                            }
                                            launchSingleTop = true
                                            restoreState = true
                                        }
                                    },
                                    colors = NavigationBarItemDefaults.colors(
                                        selectedIconColor = TextPrimary,
                                        selectedTextColor = PrimaryIndigo,
                                        indicatorColor = PrimaryIndigo.copy(alpha = 0.35f),
                                        unselectedIconColor = TextMuted,
                                        unselectedTextColor = TextMuted
                                    )
                                )
                            }
                        }
                    }
                ) { innerPadding ->
                    NavHost(
                        navController = navController,
                        startDestination = Screen.Dashboard.route,
                        modifier = Modifier.padding(innerPadding)
                    ) {
                        composable(Screen.Dashboard.route) {
                            DashboardScreen(
                                repository = repository,
                                onNavigateToRoadmap = { navController.navigate(Screen.Roadmap.route) },
                                onNavigateToFocus = { navController.navigate(Screen.Focus.route) },
                                onNavigateToHabits = { navController.navigate(Screen.Habits.route) }
                            )
                        }

                        composable(Screen.Roadmap.route) {
                            RoadmapScreen(
                                repository = repository,
                                onStartFocusForTask = { task ->
                                    navController.navigate(Screen.Focus.route)
                                }
                            )
                        }

                        composable(Screen.Focus.route) {
                            FocusScreen(
                                repository = repository
                            )
                        }

                        composable(Screen.Habits.route) {
                            HabitsScreen(
                                repository = repository
                            )
                        }

                        composable(Screen.Momentum.route) {
                            MomentumScreen(
                                repository = repository
                            )
                        }

                        composable(Screen.Coach.route) {
                            AiCoachScreen(
                                repository = repository
                            )
                        }

                        composable(Screen.Profile.route) {
                            ProfileScreen(
                                repository = repository
                            )
                        }
                    }
                }
            }
        }
    }
}
