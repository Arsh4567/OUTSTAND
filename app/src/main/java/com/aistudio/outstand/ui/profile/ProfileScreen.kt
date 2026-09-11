package com.aistudio.outstand.ui.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aistudio.outstand.ui.theme.*
import com.aistudio.outstand.ui.viewmodel.OutstandViewModel

@Composable
fun ProfileScreen(
    viewModel: OutstandViewModel,
    modifier: Modifier = Modifier
) {
    val stats by viewModel.stats.collectAsState()
    val habits by viewModel.habits.collectAsState()
    val sessions by viewModel.sessions.collectAsState()

    val totalFocusMins = sessions.sumOf { it.durationMinutes }
    val totalFocusHours = String.format(java.util.Locale.getDefault(), "%.1f", totalFocusMins / 60f)
    val completedHabitsCount = habits.count { it.completedToday }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(BackgroundDark)
            .testTag("profile_screen"),
        contentPadding = PaddingValues(16.dp, 16.dp, 16.dp, 100.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Header Profile Card
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceCard),
                border = ButtonDefaults.outlinedButtonBorder.copy(
                    brush = Brush.linearGradient(listOf(PrimaryNeon, SecondaryViolet))
                )
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Surface(
                            shape = CircleShape,
                            color = PrimaryNeon.copy(alpha = 0.2f),
                            modifier = Modifier.size(72.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(
                                    Icons.Default.Person,
                                    contentDescription = null,
                                    tint = PrimaryGlow,
                                    modifier = Modifier.size(40.dp)
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Text(
                        text = stats.userName,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Black,
                        color = TextPrimary
                    )

                    Spacer(modifier = Modifier.height(2.dp))

                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = SecondaryViolet.copy(alpha = 0.2f)
                    ) {
                        Text(
                            text = "Level ${stats.level} · Momentum Architect",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = SecondaryViolet,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceEvenly
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(text = "${stats.xp}", fontSize = 18.sp, fontWeight = FontWeight.Black, color = AccentCyan)
                            Text(text = "Total XP", fontSize = 10.sp, color = TextMuted)
                        }
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(text = "${stats.currentStreak}d", fontSize = 18.sp, fontWeight = FontWeight.Black, color = AccentAmber)
                            Text(text = "Streak", fontSize = 10.sp, color = TextMuted)
                        }
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(text = "${totalFocusHours}h", fontSize = 18.sp, fontWeight = FontWeight.Black, color = PrimaryNeon)
                            Text(text = "Deep Focus", fontSize = 10.sp, color = TextMuted)
                        }
                    }
                }
            }
        }

        // Achievements Section
        item {
            Text(
                text = "MOMENTUM TROPHIES",
                fontSize = 10.sp,
                fontWeight = FontWeight.Black,
                letterSpacing = 1.5.sp,
                color = TextMuted
            )

            Spacer(modifier = Modifier.height(8.dp))

            listOf(
                Triple("First Spark", "Executed first deep focus session", Icons.Default.Bolt),
                Triple("Deep Diver", "Completed 60+ minutes of focused flow", Icons.Default.Timer),
                Triple("Iron Habit", "Maintained a 5+ day routine streak", Icons.Default.LocalFireDepartment),
                Triple("Roadmap Architect", "Constructed structured goal path", Icons.Default.AltRoute)
            ).forEach { (title, desc, icon) ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 4.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = SurfaceCard)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Surface(
                            shape = CircleShape,
                            color = PrimaryNeon.copy(alpha = 0.15f),
                            modifier = Modifier.size(36.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(icon, contentDescription = null, tint = AccentCyan, modifier = Modifier.size(20.dp))
                            }
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text(text = title, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                            Text(text = desc, fontSize = 11.sp, color = TextSecondary)
                        }
                    }
                }
            }
        }

        // About & System Info
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceDark)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "OUTSTAND 1.0.0",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Black,
                        color = TextPrimary
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Turn attention into momentum. Local-first Room engine with reactive state management and AI goal planning.",
                        fontSize = 11.sp,
                        color = TextMuted
                    )
                }
            }
        }
    }
}
