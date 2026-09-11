package com.aistudio.outstand.data.repository

import com.aistudio.outstand.data.dao.ChatDao
import com.aistudio.outstand.data.dao.FocusDao
import com.aistudio.outstand.data.dao.HabitDao
import com.aistudio.outstand.data.dao.MomentumDao
import com.aistudio.outstand.data.dao.RoadmapDao
import com.aistudio.outstand.data.dao.UserDao
import com.aistudio.outstand.data.model.ChatMessage
import com.aistudio.outstand.data.model.DailyMomentum
import com.aistudio.outstand.data.model.FocusSession
import com.aistudio.outstand.data.model.Habit
import com.aistudio.outstand.data.model.Roadmap
import com.aistudio.outstand.data.model.RoadmapTask
import com.aistudio.outstand.data.model.UserProfile
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.firstOrNull
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.UUID

class OutstandRepository(
    private val habitDao: HabitDao,
    private val focusDao: FocusDao,
    private val roadmapDao: RoadmapDao,
    private val momentumDao: MomentumDao,
    private val userDao: UserDao,
    private val chatDao: ChatDao
) {
    val habits: Flow<List<Habit>> = habitDao.getAllHabits()
    val focusSessions: Flow<List<FocusSession>> = focusDao.getAllSessions()
    val totalFocusMinutes: Flow<Int?> = focusDao.getTotalFocusMinutes()
    val activeRoadmap: Flow<Roadmap?> = roadmapDao.getActiveRoadmap()
    val allRoadmaps: Flow<List<Roadmap>> = roadmapDao.getAllRoadmaps()
    val userProfile: Flow<UserProfile?> = userDao.getUserProfile()
    val chatMessages: Flow<List<ChatMessage>> = chatDao.getAllMessages()

    private fun getTodayIso(): String {
        return SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
    }

    fun getTasksForRoadmap(roadmapId: String): Flow<List<RoadmapTask>> {
        return roadmapDao.getTasksForRoadmap(roadmapId)
    }

    fun getNextPendingTask(): Flow<RoadmapTask?> {
        return roadmapDao.getNextPendingTask()
    }

    fun getTodayMomentum(): Flow<DailyMomentum?> {
        return momentumDao.getMomentumForDate(getTodayIso())
    }

    fun getRecentMomentum(): Flow<List<DailyMomentum>> {
        return momentumDao.getRecentMomentum()
    }

    suspend fun toggleHabitToday(habitId: String) {
        val habit = habitDao.getHabitById(habitId) ?: return
        val today = getTodayIso()
        val historyList = if (habit.historyCsv.isBlank()) mutableListOf() else habit.historyCsv.split(",").toMutableList()

        val isCompletedNow = if (historyList.contains(today)) {
            historyList.remove(today)
            false
        } else {
            historyList.add(today)
            true
        }

        val newStreak = if (isCompletedNow) habit.streak + 1 else maxOf(0, habit.streak - 1)
        val newBestStreak = maxOf(habit.bestStreak, newStreak)

        val updated = habit.copy(
            streak = newStreak,
            bestStreak = newBestStreak,
            historyCsv = historyList.joinToString(",")
        )
        habitDao.updateHabit(updated)

        if (isCompletedNow) {
            awardXp(25, "Habit Completed: ${habit.name}")
        }
    }

    suspend fun addHabit(name: String, emoji: String, category: String, color: String) {
        val newHabit = Habit(
            id = UUID.randomUUID().toString(),
            name = name,
            emoji = emoji.ifBlank { "⚡" },
            category = category,
            color = color,
            streak = 0,
            bestStreak = 0,
            historyCsv = ""
        )
        habitDao.insertHabit(newHabit)
    }

    suspend fun recordFocusSession(taskName: String, durationMinutes: Int, completed: Boolean) {
        val xp = if (completed) durationMinutes * 2 else (durationMinutes * 1)
        val session = FocusSession(
            taskName = taskName.ifBlank { "Deep Focus Session" },
            durationMinutes = durationMinutes,
            completed = completed,
            xpEarned = xp
        )
        focusDao.insertSession(session)
        if (xp > 0) {
            awardXp(xp, "Focus Session: $durationMinutes min")
        }
    }

    suspend fun completeRoadmapTask(task: RoadmapTask) {
        val updated = task.copy(
            isCompleted = true,
            completedAt = System.currentTimeMillis()
        )
        roadmapDao.updateTask(updated)
        awardXp(50, "Roadmap Task Completed: ${task.title}")
    }

    suspend fun createRoadmap(
        goal: String,
        category: String,
        targetDays: Int,
        dailyMinutes: Int,
        difficulty: String
    ) {
        val roadmapId = "rm_${UUID.randomUUID()}"
        val title = if (goal.length > 30) "${goal.take(28)}..." else goal
        val newRoadmap = Roadmap(
            id = roadmapId,
            title = title,
            goal = goal,
            category = category,
            targetDays = targetDays,
            dailyMinutes = dailyMinutes,
            difficulty = difficulty,
            progressPct = 0,
            isActive = true
        )
        roadmapDao.insertRoadmap(newRoadmap)

        // Generate Structured Tasks for the Roadmap
        val generatedTasks = listOf(
            RoadmapTask(
                id = UUID.randomUUID().toString(),
                roadmapId = roadmapId,
                milestoneTitle = "Phase 1: Discovery & Calibration",
                title = "Define exact milestones and criteria",
                instructions = "Clarify top metrics and avoid non-essential work",
                successCriteria = "Roadmap action criteria documented",
                estimatedMinutes = minOf(dailyMinutes, 45),
                dayNumber = 1,
                isCompleted = false
            ),
            RoadmapTask(
                id = UUID.randomUUID().toString(),
                roadmapId = roadmapId,
                milestoneTitle = "Phase 1: Discovery & Calibration",
                title = "Execute baseline sprint",
                instructions = "Focus exclusively on the highest leverage sub-task",
                successCriteria = "1st focus block completed without interruption",
                estimatedMinutes = dailyMinutes,
                dayNumber = 2,
                isCompleted = false
            ),
            RoadmapTask(
                id = UUID.randomUUID().toString(),
                roadmapId = roadmapId,
                milestoneTitle = "Phase 2: Momentum Acceleration",
                title = "Ship intermediate deliverable",
                instructions = "Build the core proof of work or milestone draft",
                successCriteria = "Intermediate output validated",
                estimatedMinutes = dailyMinutes,
                dayNumber = 3,
                isCompleted = false
            ),
            RoadmapTask(
                id = UUID.randomUUID().toString(),
                roadmapId = roadmapId,
                milestoneTitle = "Phase 3: Mastery & Review",
                title = "Final verification and debrief",
                instructions = "Conduct thorough review, measure gains, and lock in system",
                successCriteria = "Goal completed with verifiable outcome",
                estimatedMinutes = dailyMinutes,
                dayNumber = 4,
                isCompleted = false
            )
        )
        roadmapDao.insertTasks(generatedTasks)

        // Set active roadmap in user profile
        val currentProfile = userDao.getUserProfile().firstOrNull() ?: UserProfile()
        userDao.insertOrUpdate(currentProfile.copy(activeRoadmapId = roadmapId))
        awardXp(100, "Roadmap Created: $title")
    }

    suspend fun updateMomentum(focusDelta: Int, recoveryDelta: Int, executionDelta: Int, positiveTag: String? = null, negativeTag: String? = null) {
        val today = getTodayIso()
        val current = momentumDao.getMomentumForDate(today).firstOrNull() ?: DailyMomentum(dateIso = today)

        val positives = current.positivesCsv.split(",").filter { it.isNotBlank() }.toMutableList()
        val negatives = current.negativesCsv.split(",").filter { it.isNotBlank() }.toMutableList()

        positiveTag?.let { tag ->
            if (positives.contains(tag)) positives.remove(tag) else positives.add(tag)
        }
        negativeTag?.let { tag ->
            if (negatives.contains(tag)) negatives.remove(tag) else negatives.add(tag)
        }

        val focus = (current.focusScore + focusDelta).coerceIn(0, 100)
        val recovery = (current.recoveryScore + recoveryDelta).coerceIn(0, 100)
        val execution = (current.executionScore + executionDelta).coerceIn(0, 100)
        val overall = (focus + recovery + execution) / 3

        val updated = current.copy(
            score = overall,
            focusScore = focus,
            recoveryScore = recovery,
            executionScore = execution,
            positivesCsv = positives.joinToString(","),
            negativesCsv = negatives.joinToString(",")
        )
        momentumDao.insertOrUpdate(updated)
    }

    suspend fun sendChatMessage(userText: String) {
        // Save user message
        chatDao.insertMessage(ChatMessage(sender = "user", content = userText))

        // Context-aware AI Coach response generator
        val response = generateAiCoachResponse(userText)
        chatDao.insertMessage(ChatMessage(sender = "assistant", content = response))
    }

    private suspend fun generateAiCoachResponse(query: String): String {
        val q = query.lowercase()
        val habitsList = habitDao.getAllHabits().firstOrNull().orEmpty()
        val uncompleted = habitsList.filter { !it.isCompletedToday() }
        val nextTask = roadmapDao.getNextPendingTask().firstOrNull()

        return when {
            q.contains("next") || q.contains("should i do") || q.contains("what now") -> {
                if (nextTask != null) {
                    "Your clearest next execution move is **${nextTask.title}** (${nextTask.estimatedMinutes} min). Milestone: *${nextTask.milestoneTitle}*. Eliminate phone notifications and start a focus session now."
                } else if (uncompleted.isNotEmpty()) {
                    "Your priority right now is finishing your routine: **${uncompleted.first().name}**. Taking care of this protects your daily momentum."
                } else {
                    "All required roadmap tasks and habits are done for today! Protect your momentum by doing a 5-minute nightly reflection or an ambient cooldown."
                }
            }
            q.contains("focus") || q.contains("timer") || q.contains("deep work") -> {
                "For high-friction tasks, run a **25-minute Pomodoro block** or a **45-minute Deep Work sprint**. Put your phone in another room to eliminate dopamine traps."
            }
            q.contains("plan") || q.contains("roadmap") || q.contains("schedule") -> {
                "A strong daily schedule follows: **Decide → Schedule → Focus → Complete → Reflect**. Review your Roadmap tab to calibrate milestones or create an adaptive goal path."
            }
            q.contains("dopamine") || q.contains("friction") || q.contains("energy") -> {
                "Digital friction protects attention. If you're feeling depleted, take 10 minutes of morning sunlight, hydrate with 500ml water, and step away from feeds."
            }
            else -> {
                "Consistency compounds faster than intensity. Pick one clear outcome for today, run a focused timer, and let your streak build momentum."
            }
        }
    }

    private suspend fun awardXp(amount: Int, reason: String) {
        val profile = userDao.getUserProfile().firstOrNull() ?: UserProfile()
        val newXp = profile.totalXp + amount
        val newLevel = (newXp / 1000) + 1
        userDao.insertOrUpdate(profile.copy(totalXp = newXp, level = newLevel))
    }
}
