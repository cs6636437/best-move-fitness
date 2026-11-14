export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      body_records: {
        Row: {
          body_fat_pct: number
          created_at: string
          height_cm: number
          id: string
          muscle_mass_kg: number
          recorded_on: string
          user_id: string
          weight_kg: number
        }
        Insert: {
          body_fat_pct: number
          created_at?: string
          height_cm: number
          id?: string
          muscle_mass_kg: number
          recorded_on?: string
          user_id: string
          weight_kg: number
        }
        Update: {
          body_fat_pct?: number
          created_at?: string
          height_cm?: number
          id?: string
          muscle_mass_kg?: number
          recorded_on?: string
          user_id?: string
          weight_kg?: number
        }
        Relationships: []
      }
      exercise_sets: {
        Row: {
          created_at: string
          done: boolean
          exercise_id: string
          id: string
          position: number
          reps: number
          user_id: string
          weight_kg: number
        }
        Insert: {
          created_at?: string
          done?: boolean
          exercise_id: string
          id?: string
          position: number
          reps?: number
          user_id: string
          weight_kg?: number
        }
        Update: {
          created_at?: string
          done?: boolean
          exercise_id?: string
          id?: string
          position?: number
          reps?: number
          user_id?: string
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "exercise_sets_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "program_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_sets_owner_fk"
            columns: ["exercise_id", "user_id"]
            isOneToOne: false
            referencedRelation: "program_exercises"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      nutrition_plans: {
        Row: {
          calories: number
          carbs_g: number
          created_at: string
          fat_g: number
          id: string
          protein_g: number
          style: string
          user_id: string
        }
        Insert: {
          calories: number
          carbs_g: number
          created_at?: string
          fat_g: number
          id?: string
          protein_g: number
          style: string
          user_id: string
        }
        Update: {
          calories?: number
          carbs_g?: number
          created_at?: string
          fat_g?: number
          id?: string
          protein_g?: number
          style?: string
          user_id?: string
        }
        Relationships: []
      }
      program_exercises: {
        Row: {
          created_at: string
          id: string
          muscle_group: string
          name: string
          position: number
          program_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          muscle_group?: string
          name: string
          position?: number
          program_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          muscle_group?: string
          name?: string
          position?: number
          program_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_exercises_owner_fk"
            columns: ["program_id", "user_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "program_exercises_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          created_at: string
          duration_weeks: number | null
          goal: string
          id: string
          minutes_per_session: number | null
          name: string
          source: string
          target_weight_kg: number | null
          training_days: string[]
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_weeks?: number | null
          goal?: string
          id?: string
          minutes_per_session?: number | null
          name: string
          source: string
          target_weight_kg?: number | null
          training_days?: string[]
          user_id: string
        }
        Update: {
          created_at?: string
          duration_weeks?: number | null
          goal?: string
          id?: string
          minutes_per_session?: number | null
          name?: string
          source?: string
          target_weight_kg?: number | null
          training_days?: string[]
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          activity_factor: number | null
          age: number | null
          created_at: string
          display_name: string | null
          sex: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_factor?: number | null
          age?: number | null
          created_at?: string
          display_name?: string | null
          sex?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_factor?: number | null
          age?: number | null
          created_at?: string
          display_name?: string | null
          sex?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workout_sessions: {
        Row: {
          completed_at: string | null
          duration_seconds: number
          id: string
          program_id: string | null
          started_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          duration_seconds?: number
          id?: string
          program_id?: string | null
          started_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          duration_seconds?: number
          id?: string
          program_id?: string | null
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_set_logs: {
        Row: {
          completed_at: string
          exercise_name: string
          id: string
          muscle_group: string
          program_name: string
          reps: number
          session_id: string
          set_id: string
          user_id: string
          weight_kg: number
        }
        Insert: {
          completed_at?: string
          exercise_name: string
          id?: string
          muscle_group?: string
          program_name: string
          reps: number
          session_id: string
          set_id: string
          user_id: string
          weight_kg?: number
        }
        Update: {
          completed_at?: string
          exercise_name?: string
          id?: string
          muscle_group?: string
          program_name?: string
          reps?: number
          session_id?: string
          set_id?: string
          user_id?: string
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "workout_set_logs_session_owner_fk"
            columns: ["session_id", "user_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
