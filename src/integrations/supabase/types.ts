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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      blocked_ips: {
        Row: {
          blocked_at: string
          blocked_by: string | null
          id: string
          ip_address: string
          reason: string | null
        }
        Insert: {
          blocked_at?: string
          blocked_by?: string | null
          id?: string
          ip_address: string
          reason?: string | null
        }
        Update: {
          blocked_at?: string
          blocked_by?: string | null
          id?: string
          ip_address?: string
          reason?: string | null
        }
        Relationships: []
      }
      honeypot_logs: {
        Row: {
          attempted_password: string | null
          attempted_username: string | null
          created_at: string
          id: string
          ip_address: string | null
          is_blocked: boolean
          user_agent: string | null
        }
        Insert: {
          attempted_password?: string | null
          attempted_username?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          is_blocked?: boolean
          user_agent?: string | null
        }
        Update: {
          attempted_password?: string | null
          attempted_username?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          is_blocked?: boolean
          user_agent?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          flow_type: string
          id: string
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          flow_type: string
          id?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          flow_type?: string
          id?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          bio_data: string | null
          created_at: string | null
          current_level: number | null
          days_completed: number | null
          demo_messages_used: number | null
          detailed_info: Json | null
          education_level: string | null
          email: string | null
          full_name: string | null
          has_paid_access: boolean | null
          id: string
          interview_unlocked: boolean | null
          other_details: string | null
          phone_number: string | null
          profession: string | null
          semester: string | null
          total_points: number | null
          updated_at: string | null
          user_id: string
          user_type: string | null
        }
        Insert: {
          bio_data?: string | null
          created_at?: string | null
          current_level?: number | null
          days_completed?: number | null
          demo_messages_used?: number | null
          detailed_info?: Json | null
          education_level?: string | null
          email?: string | null
          full_name?: string | null
          has_paid_access?: boolean | null
          id?: string
          interview_unlocked?: boolean | null
          other_details?: string | null
          phone_number?: string | null
          profession?: string | null
          semester?: string | null
          total_points?: number | null
          updated_at?: string | null
          user_id: string
          user_type?: string | null
        }
        Update: {
          bio_data?: string | null
          created_at?: string | null
          current_level?: number | null
          days_completed?: number | null
          demo_messages_used?: number | null
          detailed_info?: Json | null
          education_level?: string | null
          email?: string | null
          full_name?: string | null
          has_paid_access?: boolean | null
          id?: string
          interview_unlocked?: boolean | null
          other_details?: string | null
          phone_number?: string | null
          profession?: string | null
          semester?: string | null
          total_points?: number | null
          updated_at?: string | null
          user_id?: string
          user_type?: string | null
        }
        Relationships: []
      }
      psychometric_orders: {
        Row: {
          amount: number
          created_at: string
          id: string
          payment_method: string | null
          payment_reference: string | null
          payment_screenshot_url: string | null
          status: string | null
          updated_at: string
          user_id: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          payment_method?: string | null
          payment_reference?: string | null
          payment_screenshot_url?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          payment_method?: string | null
          payment_reference?: string | null
          payment_screenshot_url?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      psychometric_test_attempts: {
        Row: {
          attempt_number: number
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          email: string | null
          id: string
          started_at: string | null
          user_id: string
        }
        Insert: {
          attempt_number: number
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          started_at?: string | null
          user_id: string
        }
        Update: {
          attempt_number?: number
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          started_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          used: boolean
          used_at: string | null
          used_by: string | null
          used_by_email: string | null
          used_by_name: string | null
          used_for_flow: string | null
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          used?: boolean
          used_at?: string | null
          used_by?: string | null
          used_by_email?: string | null
          used_by_name?: string | null
          used_for_flow?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          used?: boolean
          used_at?: string | null
          used_by?: string | null
          used_by_email?: string | null
          used_by_name?: string | null
          used_for_flow?: string | null
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          attempt_limit_reached: boolean
          college_dashboard_access: boolean | null
          created_at: string
          email: string
          id: string
          last_psychometric_attempt_at: string | null
          payment_status: string | null
          phone_number: string | null
          psychometric_result_paid: boolean | null
          psychometric_result_payment_date: string | null
          psychometric_test_completed: boolean | null
          psychometric_test_completed_date: string | null
          psychometric_tests_allowed: number | null
          psychometric_tests_used: number | null
          show_result: boolean | null
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          test_access_activated: boolean | null
          test_access_activated_at: string | null
          test_access_method: string | null
          test_access_used: boolean | null
          test_access_used_at: string | null
          test_result_access: boolean | null
          test_session_token: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          attempt_limit_reached?: boolean
          college_dashboard_access?: boolean | null
          created_at?: string
          email: string
          id?: string
          last_psychometric_attempt_at?: string | null
          payment_status?: string | null
          phone_number?: string | null
          psychometric_result_paid?: boolean | null
          psychometric_result_payment_date?: string | null
          psychometric_test_completed?: boolean | null
          psychometric_test_completed_date?: string | null
          psychometric_tests_allowed?: number | null
          psychometric_tests_used?: number | null
          show_result?: boolean | null
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          test_access_activated?: boolean | null
          test_access_activated_at?: string | null
          test_access_method?: string | null
          test_access_used?: boolean | null
          test_access_used_at?: string | null
          test_result_access?: boolean | null
          test_session_token?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          attempt_limit_reached?: boolean
          college_dashboard_access?: boolean | null
          created_at?: string
          email?: string
          id?: string
          last_psychometric_attempt_at?: string | null
          payment_status?: string | null
          phone_number?: string | null
          psychometric_result_paid?: boolean | null
          psychometric_result_payment_date?: string | null
          psychometric_test_completed?: boolean | null
          psychometric_test_completed_date?: string | null
          psychometric_tests_allowed?: number | null
          psychometric_tests_used?: number | null
          show_result?: boolean | null
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          test_access_activated?: boolean | null
          test_access_activated_at?: string | null
          test_access_method?: string | null
          test_access_used?: boolean | null
          test_access_used_at?: string | null
          test_result_access?: boolean | null
          test_session_token?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      test_access_tokens: {
        Row: {
          access_method: string | null
          created_at: string
          expires_at: string
          id: string
          ip_address: string | null
          token: string
          used: boolean
          used_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          access_method?: string | null
          created_at?: string
          expires_at: string
          id?: string
          ip_address?: string | null
          token: string
          used?: boolean
          used_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          access_method?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: string | null
          token?: string
          used?: boolean
          used_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tutor_chapters: {
        Row: {
          chapter_number: number
          created_at: string
          description: string | null
          estimated_minutes: number
          focus_areas: string[]
          id: string
          is_active: boolean
          source_pdf_path: string | null
          subtitle: string | null
          system_prompt: string
          title: string
          updated_at: string
        }
        Insert: {
          chapter_number: number
          created_at?: string
          description?: string | null
          estimated_minutes?: number
          focus_areas?: string[]
          id?: string
          is_active?: boolean
          source_pdf_path?: string | null
          subtitle?: string | null
          system_prompt: string
          title: string
          updated_at?: string
        }
        Update: {
          chapter_number?: number
          created_at?: string
          description?: string | null
          estimated_minutes?: number
          focus_areas?: string[]
          id?: string
          is_active?: boolean
          source_pdf_path?: string | null
          subtitle?: string | null
          system_prompt?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      tutor_memory: {
        Row: {
          created_at: string
          facts: Json | null
          id: string
          strengths: string[] | null
          summary: string | null
          total_sessions: number
          updated_at: string
          user_id: string
          weaknesses: string[] | null
        }
        Insert: {
          created_at?: string
          facts?: Json | null
          id?: string
          strengths?: string[] | null
          summary?: string | null
          total_sessions?: number
          updated_at?: string
          user_id: string
          weaknesses?: string[] | null
        }
        Update: {
          created_at?: string
          facts?: Json | null
          id?: string
          strengths?: string[] | null
          summary?: string | null
          total_sessions?: number
          updated_at?: string
          user_id?: string
          weaknesses?: string[] | null
        }
        Relationships: []
      }
      tutor_messages: {
        Row: {
          content: string
          corrections: Json | null
          created_at: string
          id: string
          pronunciation: Json | null
          role: string
          session_id: string
          user_id: string
        }
        Insert: {
          content: string
          corrections?: Json | null
          created_at?: string
          id?: string
          pronunciation?: Json | null
          role: string
          session_id: string
          user_id: string
        }
        Update: {
          content?: string
          corrections?: Json | null
          created_at?: string
          id?: string
          pronunciation?: Json | null
          role?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tutor_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "tutor_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      tutor_notes: {
        Row: {
          chapter_id: string | null
          content: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          chapter_id?: string | null
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          chapter_id?: string | null
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tutor_notes_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "tutor_chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      tutor_progress: {
        Row: {
          attempts: number
          best_scores: Json | null
          chapter_id: string
          completed: boolean
          completed_at: string | null
          created_at: string
          difficulty_level: number
          id: string
          last_beat_summary: string | null
          last_message_index: number
          last_session_id: string | null
          resumable: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          best_scores?: Json | null
          chapter_id: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          difficulty_level?: number
          id?: string
          last_beat_summary?: string | null
          last_message_index?: number
          last_session_id?: string | null
          resumable?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number
          best_scores?: Json | null
          chapter_id?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          difficulty_level?: number
          id?: string
          last_beat_summary?: string | null
          last_message_index?: number
          last_session_id?: string | null
          resumable?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tutor_progress_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "tutor_chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tutor_progress_last_session_id_fkey"
            columns: ["last_session_id"]
            isOneToOne: false
            referencedRelation: "tutor_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      tutor_sessions: {
        Row: {
          chapter_id: string
          created_at: string
          emotion_samples: Json
          ended_at: string | null
          id: string
          metadata: Json
          recording_path: string | null
          scores: Json | null
          started_at: string
          status: string
          suggestions: string[] | null
          summary: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          chapter_id: string
          created_at?: string
          emotion_samples?: Json
          ended_at?: string | null
          id?: string
          metadata?: Json
          recording_path?: string | null
          scores?: Json | null
          started_at?: string
          status?: string
          suggestions?: string[] | null
          summary?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          chapter_id?: string
          created_at?: string
          emotion_samples?: Json
          ended_at?: string | null
          id?: string
          metadata?: Json
          recording_path?: string | null
          scores?: Json | null
          started_at?: string
          status?: string
          suggestions?: string[] | null
          summary?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tutor_sessions_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "tutor_chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      tutor_vocab: {
        Row: {
          chapter_id: string | null
          created_at: string
          example: string | null
          hindi: string | null
          id: string
          mastered: boolean
          meaning: string | null
          user_id: string
          word: string
        }
        Insert: {
          chapter_id?: string | null
          created_at?: string
          example?: string | null
          hindi?: string | null
          id?: string
          mastered?: boolean
          meaning?: string | null
          user_id: string
          word: string
        }
        Update: {
          chapter_id?: string | null
          created_at?: string
          example?: string | null
          hindi?: string | null
          id?: string
          mastered?: boolean
          meaning?: string | null
          user_id?: string
          word?: string
        }
        Relationships: [
          {
            foreignKeyName: "tutor_vocab_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "tutor_chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      user_gamification: {
        Row: {
          badges: Json
          created_at: string
          id: string
          last_active_date: string | null
          level: number
          streak_days: number
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          badges?: Json
          created_at?: string
          id?: string
          last_active_date?: string | null
          level?: number
          streak_days?: number
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          badges?: Json
          created_at?: string
          id?: string
          last_active_date?: string | null
          level?: number
          streak_days?: number
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      user_passwords: {
        Row: {
          created_at: string
          email: string
          id: string
          password_hash: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          password_hash: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          password_hash?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_test_via_payment: { Args: { p_user_id: string }; Returns: Json }
      can_take_psychometric_test: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      consume_test_access_token: {
        Args: { p_token: string; p_user_id: string }
        Returns: Json
      }
      generate_test_access_token: { Args: { p_user_id: string }; Returns: Json }
      get_psychometric_attempt_status: {
        Args: { p_user_id: string }
        Returns: Json
      }
      get_user_test_attempts: { Args: { p_user_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      mark_psychometric_test_completed: {
        Args: { user_id_param: string }
        Returns: Json
      }
      redeem_referral_code: {
        Args: { p_code: string; p_user_id: string }
        Returns: Json
      }
      sync_psychometric_attempt_limit: {
        Args: { p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
