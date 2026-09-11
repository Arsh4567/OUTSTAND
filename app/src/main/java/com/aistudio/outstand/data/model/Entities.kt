package com.aistudio.outstand.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "habits")
data class HabitEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val category: String,
    val streak: Int = 0,
    val completedToday: Boolean = false,
    val lastCompletedDate: String = "",
    val targetDaysPerWeek: Int = 7
)

@Entity(tableName = "roadmap_tasks")
data class RoadmapTaskEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val roadmapGoal: String,
    val milestoneTitle: String,
    val title: String,
    val description: String,
    val estimatedMinutes: Int = 30,
    val isCompleted: Boolean = false,
    val isRequired: Boolean = true,
    val orderIndex: Int = 0
)

@Entity(tableName = "focus_sessions")
data class FocusSessionEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val durationMinutes: Int,
    val mode: String,
    val xpEarned: Int,
    val timestamp: Long = System.currentTimeMillis()
)

@Entity(tableName = "user_stats")
data class UserStatsEntity(
    @PrimaryKey val id: Int = 1,
    val userName: String = "Arsh",
    val xp: Int = 340,
    val level: Int = 3,
    val currentStreak: Int = 5,
    val bestStreak: Int = 14,
    val brainState: String = "Deep Focus",
    val dailyScore: Int = 88
)
