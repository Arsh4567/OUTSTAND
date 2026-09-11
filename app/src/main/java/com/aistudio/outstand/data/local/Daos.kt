package com.aistudio.outstand.data.local

import androidx.room.*
import com.aistudio.outstand.data.model.FocusSessionEntity
import com.aistudio.outstand.data.model.HabitEntity
import com.aistudio.outstand.data.model.RoadmapTaskEntity
import com.aistudio.outstand.data.model.UserStatsEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface HabitDao {
    @Query("SELECT * FROM habits ORDER BY id ASC")
    fun getAllHabits(): Flow<List<HabitEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertHabit(habit: HabitEntity): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(habits: List<HabitEntity>)

    @Update
    suspend fun updateHabit(habit: HabitEntity)

    @Delete
    suspend fun deleteHabit(habit: HabitEntity)
}

@Dao
interface RoadmapDao {
    @Query("SELECT * FROM roadmap_tasks ORDER BY orderIndex ASC")
    fun getAllTasks(): Flow<List<RoadmapTaskEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTask(task: RoadmapTaskEntity): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(tasks: List<RoadmapTaskEntity>)

    @Update
    suspend fun updateTask(task: RoadmapTaskEntity)

    @Delete
    suspend fun deleteTask(task: RoadmapTaskEntity)

    @Query("DELETE FROM roadmap_tasks")
    suspend fun clearAll()
}

@Dao
interface FocusDao {
    @Query("SELECT * FROM focus_sessions ORDER BY timestamp DESC")
    fun getAllSessions(): Flow<List<FocusSessionEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSession(session: FocusSessionEntity): Long
}

@Dao
interface UserStatsDao {
    @Query("SELECT * FROM user_stats WHERE id = 1")
    fun getUserStats(): Flow<UserStatsEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertStats(stats: UserStatsEntity)
}
