export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.5" }
  public: {
    Tables: {
      ai_roadmaps: {
        Row: { id: string; user_id: string; category: string; title: string; summary: string; duration_days: number; difficulty: string; answers: Json; plan: Json; habits_snapshot: Json; is_active: boolean; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; category: string; title: string; summary: string; duration_days: number; difficulty: string; answers?: Json; plan?: Json; habits_snapshot?: Json; is_active?: boolean; created_at?: string; updated_at?: string }
        Update: { id?: string; user_id?: string; category?: string; title?: string; summary?: string; duration_days?: number; difficulty?: string; answers?: Json; plan?: Json; habits_snapshot?: Json; is_active?: boolean; created_at?: string; updated_at?: string }
        Relationships: []
      }
      chat_conversations: {
        Row: { created_at: string; id: string; updated_at: string; user_id: string }
        Insert: { created_at?: string; id?: string; updated_at?: string; user_id: string }
        Update: { created_at?: string; id?: string; updated_at?: string; user_id?: string }
        Relationships: []
      }
      chat_messages: {
        Row: { content: string; conversation_id: string; created_at: string; id: string; role: string; user_id: string }
        Insert: { content: string; conversation_id: string; created_at?: string; id?: string; role: string; user_id: string }
        Update: { content?: string; conversation_id?: string; created_at?: string; id?: string; role?: string; user_id?: string }
        Relationships: []
      }
      daily_logs: {
        Row: { created_at: string; id: string; log_date: string; negatives: Json; positives: Json; score: number; updated_at: string; user_id: string }
        Insert: { created_at?: string; id?: string; log_date: string; negatives?: Json; positives?: Json; score?: number; updated_at?: string; user_id?: string }
        Update: { created_at?: string; id?: string; log_date?: string; negatives?: Json; positives?: Json; score?: number; updated_at?: string; user_id?: string }
        Relationships: []
      }
      profiles: {
        Row: { avatar_url: string | null; created_at: string; display_name: string | null; id: string; updated_at: string }
        Insert: { avatar_url?: string | null; created_at?: string; display_name?: string | null; id: string; updated_at?: string }
        Update: { avatar_url?: string | null; created_at?: string; display_name?: string | null; id?: string; updated_at?: string }
        Relationships: []
      }
      user_stats: {
        Row: { user_id: string; total_xp: number; level: number; streak_days: number; current_level_xp: number; next_level_xp: number }
        Insert: { user_id: string; total_xp?: number; level?: number; streak_days?: number; current_level_xp?: number; next_level_xp?: number }
        Update: { user_id?: string; total_xp?: number; level?: number; streak_days?: number; current_level_xp?: number; next_level_xp?: number }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]) | { schema: keyof DatabaseWithoutInternals }, TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals } ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"]) : never = never> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends { Row: infer R } ? R : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends { Row: infer R } ? R : never
    : never

export type TablesInsert<T extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals }, N extends T extends { schema: keyof DatabaseWithoutInternals } ? keyof DatabaseWithoutInternals[T["schema"]]["Tables"] : never = never> = T extends { schema: keyof DatabaseWithoutInternals } ? DatabaseWithoutInternals[T["schema"]]["Tables"][N] extends { Insert: infer I } ? I : never : T extends keyof DefaultSchema["Tables"] ? DefaultSchema["Tables"][T] extends { Insert: infer I } ? I : never : never
export type TablesUpdate<T extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals }, N extends T extends { schema: keyof DatabaseWithoutInternals } ? keyof DatabaseWithoutInternals[T["schema"]]["Tables"] : never = never> = T extends { schema: keyof DatabaseWithoutInternals } ? DatabaseWithoutInternals[T["schema"]]["Tables"][N] extends { Update: infer U } ? U : never : T extends keyof DefaultSchema["Tables"] ? DefaultSchema["Tables"][T] extends { Update: infer U } ? U : never : never
export type Enums<T extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals }, N extends T extends { schema: keyof DatabaseWithoutInternals } ? keyof DatabaseWithoutInternals[T["schema"]]["Enums"] : never = never> = T extends { schema: keyof DatabaseWithoutInternals } ? DatabaseWithoutInternals[T["schema"]]["Enums"][N] : T extends keyof DefaultSchema["Enums"] ? DefaultSchema["Enums"][T] : never
export type CompositeTypes<T extends keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals }, N extends T extends { schema: keyof DatabaseWithoutInternals } ? keyof DatabaseWithoutInternals[T["schema"]]["CompositeTypes"] : never = never> = T extends { schema: keyof DatabaseWithoutInternals } ? DatabaseWithoutInternals[T["schema"]]["CompositeTypes"][N] : T extends keyof DefaultSchema["CompositeTypes"] ? DefaultSchema["CompositeTypes"][T] : never
export const Constants = { public: { Enums: {} } } as const
