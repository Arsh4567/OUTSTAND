package com.aistudio.outstand.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.sqlite.db.SupportSQLiteDatabase
import com.aistudio.outstand.data.model.FocusSessionEntity
import com.aistudio.outstand.data.model.HabitEntity
import com.aistudio.outstand.data.model.RoadmapTaskEntity
import com.aistudio.outstand.data.model.UserStatsEntity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@Database(
    entities = [
        HabitEntity::class,
        RoadmapTaskEntity::class,
        FocusSessionEntity::class,
        UserStatsEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun habitDao(): HabitDao
    abstract fun roadmapDao(): RoadmapDao
    abstract fun focusDao(): FocusDao
    abstract fun userStatsDao(): UserStatsDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "outstand_database"
                )
                    .addCallback(DatabaseCallback())
                    .build()
                INSTANCE = instance
                instance
            }
        }

        private class DatabaseCallback : RoomDatabase.Callback() {
            override fun onCreate(db: SupportSQLiteDatabase) {
                super.onCreate(db)
                INSTANCE?.let { database ->
                    CoroutineScope(Dispatchers.IO).launch {
                        seedInitialData(database)
                    }
                }
            }
        }

        private suspend fun seedInitialData(database: AppDatabase) {
            // Seed habits
            val defaultHabits = listOf(
                HabitEntity(
                    name = "Morning Deep Work (90m)",
                    category = "Deep Work",
                    streak = 6,
                    completedToday = true,
                    targetDaysPerWeek = 6
                ),
                HabitEntity(
                    name = "Read System Architecture",
                    category = "Mind",
                    streak = 4,
                    completedToday = false,
                    targetDaysPerWeek = 5
                ),
                HabitEntity(
                    name = "Daily Push-ups & Stretch",
                    category = "Health",
                    streak = 12,
                    completedToday = true,
                    targetDaysPerWeek = 7
                ),
                HabitEntity(
                    name = "Nightly Reflection & Planning",
                    category = "Discipline",
                    streak = 5,
                    completedToday = false,
                    targetDaysPerWeek = 7
                )
            )
            database.habitDao().insertAll(defaultHabits)

            // Seed roadmap tasks for "Master Production Systems"
            val defaultTasks = listOf(
                RoadmapTaskEntity(
                    roadmapGoal = "Build High-Performance AI Architecture",
                    milestoneTitle = "01 · Foundation & Data Schema",
                    title = "Define room entities and reactive event bus",
                    description = "Map core data models to local persistent storage with Flow streams.",
                    estimatedMinutes = 45,
                    isCompleted = true,
                    isRequired = true,
                    orderIndex = 0
                ),
                RoadmapTaskEntity(
                    roadmapGoal = "Build High-Performance AI Architecture",
                    milestoneTitle = "01 · Foundation & Data Schema",
                    title = "Implement focus timer state engine",
                    description = "Construct ticking coroutine loop with background resilience and XP calculation.",
                    estimatedMinutes = 35,
                    isCompleted = true,
                    isRequired = true,
                    orderIndex = 1
                ),
                RoadmapTaskEntity(
                    roadmapGoal = "Build High-Performance AI Architecture",
                    milestoneTitle = "02 · Daily Execution Loop",
                    title = "Build adaptive planning checklist",
                    description = "Surface 'Right Now' actionable block directly on home screen.",
                    estimatedMinutes = 40,
                    isCompleted = false,
                    isRequired = true,
                    orderIndex = 2
                ),
                RoadmapTaskEntity(
                    roadmapGoal = "Build High-Performance AI Architecture",
                    milestoneTitle = "02 · Daily Execution Loop",
                    title = "Integrate Dopamine & Friction monitor",
                    description = "Evaluate mental energy state and calibrate task difficulty dynamically.",
                    estimatedMinutes = 30,
                    isCompleted = false,
                    isRequired = false,
                    orderIndex = 3
                ),
                RoadmapTaskEntity(
                    roadmapGoal = "Build High-Performance AI Architecture",
                    milestoneTitle = "03 · Momentum & Feedback",
                    title = "Nightly review reflection engine",
                    description = "Review completed blocks, earn daily score, and schedule tomorrow.",
                    estimatedMinutes = 25,
                    isCompleted = false,
                    isRequired = true,
                    orderIndex = 4
                )
            )
            database.roadmapDao().insertAll(defaultTasks)

            // Seed user stats
            database.userStatsDao().upsertStats(
                UserStatsEntity(
                    id = 1,
                    userName = "Arsh",
                    xp = 420,
                    level = 4,
                    currentStreak = 6,
                    bestStreak = 14,
                    brainState = "Deep Flow",
                    dailyScore = 92
                )
            )

            // Seed recent focus sessions
            database.focusDao().insertSession(
                FocusSessionEntity(
                    durationMinutes = 45,
                    mode = "Deep Work",
                    xpEarned = 90,
                    timestamp = System.currentTimeMillis() - 86400000L
                )
            )
            database.focusDao().insertSession(
                FocusSessionEntity(
                    durationMinutes = 25,
                    mode = "Sprint",
                    xpEarned = 50,
                    timestamp = System.currentTimeMillis() - 3600000L
                )
            )
        }
    }
}
