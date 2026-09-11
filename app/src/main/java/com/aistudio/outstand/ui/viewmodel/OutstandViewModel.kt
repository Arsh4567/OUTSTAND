package com.aistudio.outstand.ui.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.aistudio.outstand.data.local.AppDatabase
import com.aistudio.outstand.data.model.FocusSessionEntity
import com.aistudio.outstand.data.model.HabitEntity
import com.aistudio.outstand.data.model.RoadmapTaskEntity
import com.aistudio.outstand.data.model.UserStatsEntity
import com.aistudio.outstand.data.repository.OutstandRepository
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

class OutstandViewModel(application: Application) : AndroidViewModel(application) {
    private val repository: OutstandRepository

    init {
        val db = AppDatabase.getDatabase(application)
        repository = OutstandRepository(db)
    }

    val habits: StateFlow<List<HabitEntity>> = repository.habits
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val tasks: StateFlow<List<RoadmapTaskEntity>> = repository.tasks
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val sessions: StateFlow<List<FocusSessionEntity>> = repository.sessions
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val stats: StateFlow<UserStatsEntity> = repository.stats
        .map { it ?: UserStatsEntity() }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), UserStatsEntity())

    // Focus Timer State
    private val _timerSeconds = MutableStateFlow(25 * 60)
    val timerSeconds = _timerSeconds.asStateFlow()

    private val _totalTimerSeconds = MutableStateFlow(25 * 60)
    val totalTimerSeconds = _totalTimerSeconds.asStateFlow()

    private val _isTimerRunning = MutableStateFlow(false)
    val isTimerRunning = _isTimerRunning.asStateFlow()

    private val _selectedMode = MutableStateFlow("Sprint (25m)")
    val selectedMode = _selectedMode.asStateFlow()

    private val _ambientSound = MutableStateFlow("Binaural Waves")
    val ambientSound = _ambientSound.asStateFlow()

    private var timerJob: Job? = null

    fun setTimerMode(mode: String, minutes: Int) {
        if (_isTimerRunning.value) pauseTimer()
        _selectedMode.value = mode
        _totalTimerSeconds.value = minutes * 60
        _timerSeconds.value = minutes * 60
    }

    fun setAmbientSound(sound: String) {
        _ambientSound.value = sound
    }

    fun toggleTimer() {
        if (_isTimerRunning.value) {
            pauseTimer()
        } else {
            startTimer()
        }
    }

    private fun startTimer() {
        _isTimerRunning.value = true
        timerJob?.cancel()
        timerJob = viewModelScope.launch {
            while (_isTimerRunning.value && _timerSeconds.value > 0) {
                delay(1000L)
                _timerSeconds.value -= 1
            }
            if (_timerSeconds.value <= 0 && _isTimerRunning.value) {
                completeTimerSession()
            }
        }
    }

    fun pauseTimer() {
        _isTimerRunning.value = false
        timerJob?.cancel()
    }

    fun resetTimer() {
        pauseTimer()
        _timerSeconds.value = _totalTimerSeconds.value
    }

    private fun completeTimerSession() {
        pauseTimer()
        val durationMins = _totalTimerSeconds.value / 60
        viewModelScope.launch {
            repository.recordFocusSession(durationMins, _selectedMode.value)
        }
        _timerSeconds.value = _totalTimerSeconds.value
    }

    // Habit operations
    fun toggleHabit(habit: HabitEntity) {
        viewModelScope.launch {
            repository.toggleHabit(habit)
        }
    }

    fun addHabit(name: String, category: String) {
        viewModelScope.launch {
            repository.addHabit(name, category)
        }
    }

    fun deleteHabit(habit: HabitEntity) {
        viewModelScope.launch {
            repository.deleteHabit(habit)
        }
    }

    // Task & Roadmap operations
    fun toggleTask(task: RoadmapTaskEntity) {
        viewModelScope.launch {
            repository.toggleTask(task)
        }
    }

    fun addTask(
        goal: String,
        milestone: String,
        title: String,
        description: String,
        minutes: Int,
        isRequired: Boolean
    ) {
        viewModelScope.launch {
            repository.addTask(goal, milestone, title, description, minutes, isRequired)
        }
    }

    fun deleteTask(task: RoadmapTaskEntity) {
        viewModelScope.launch {
            repository.deleteTask(task)
        }
    }

    fun generateAiRoadmap(goal: String, intensity: String) {
        viewModelScope.launch {
            repository.generateAiRoadmap(goal, intensity)
        }
    }

    fun updateBrainState(state: String) {
        viewModelScope.launch {
            repository.updateBrainState(state)
        }
    }

    // AI Coach Chat
    data class ChatMessage(
        val isUser: Boolean,
        val text: String,
        val timestamp: String
    )

    private val _messages = MutableStateFlow(
        listOf(
            ChatMessage(
                isUser = false,
                text = "Welcome to OUTSTAND Intelligence. I'm calibrated to your active roadmap, focus history, and habits. How can we optimize your momentum right now?",
                timestamp = "Just now"
            )
        )
    )
    val messages = _messages.asStateFlow()

    fun sendMessage(text: String) {
        val userMsg = ChatMessage(isUser = true, text = text, timestamp = "Just now")
        _messages.value = _messages.value + userMsg

        viewModelScope.launch {
            delay(600L) // subtle conversational response delay
            val reply = generateCoachAdvice(text)
            _messages.value = _messages.value + ChatMessage(isUser = false, text = reply, timestamp = "Just now")
            repository.addXp(5)
        }
    }

    private fun generateCoachAdvice(prompt: String): String {
        val currentTasks = tasks.value
        val uncompleted = currentTasks.filter { !it.isCompleted }
        val next = uncompleted.firstOrNull()
        val streak = stats.value.currentStreak

        return when {
            prompt.contains("next", ignoreCase = true) || prompt.contains("do now", ignoreCase = true) -> {
                if (next != null) {
                    "Your highest leverage action right now is: '${next.title}' (${next.estimatedMinutes} min). Tip: Close background browser tabs and execute one single 25-minute sprint block."
                } else {
                    "All current required roadmap items are finished! Consider a 10-minute reflection or generate a new milestone in the Roadmap tab to keep your momentum."
                }
            }
            prompt.contains("slump", ignoreCase = true) || prompt.contains("tired", ignoreCase = true) || prompt.contains("focus", ignoreCase = true) -> {
                "When mental resistance peaks: 1. Drink 300ml of cold water. 2. Switch to a lower-friction 15-minute sprint. 3. Remember you are currently on a $streak-day streak—protecting consistency beats perfection."
            }
            prompt.contains("habit", ignoreCase = true) -> {
                val pendingHabits = habits.value.filter { !it.completedToday }
                if (pendingHabits.isNotEmpty()) {
                    "You still have ${pendingHabits.size} daily habits uncompleted today (${pendingHabits.joinToString { it.name }}). Check one off now for +15 XP!"
                } else {
                    "All daily habits completed for today! Your consistency index is at 100%."
                }
            }
            else -> {
                "Understood. Focused daily execution compounds faster than sporadic intensity. Break down complex blockers into 20-minute chunks and track them in your Roadmap. Let's make today count."
            }
        }
    }
}
