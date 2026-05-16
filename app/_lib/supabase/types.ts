export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_name_snapshot: string | null
          after_data: Json | null
          before_data: Json | null
          changed_fields: string[] | null
          created_at: string
          id: string
          ip_address: string | null
          on_behalf_of_id: string | null
          on_behalf_of_name_snapshot: string | null
          target_id: string
          target_type: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_name_snapshot?: string | null
          after_data?: Json | null
          before_data?: Json | null
          changed_fields?: string[] | null
          created_at?: string
          id?: string
          ip_address?: string | null
          on_behalf_of_id?: string | null
          on_behalf_of_name_snapshot?: string | null
          target_id: string
          target_type: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_name_snapshot?: string | null
          after_data?: Json | null
          before_data?: Json | null
          changed_fields?: string[] | null
          created_at?: string
          id?: string
          ip_address?: string | null
          on_behalf_of_id?: string | null
          on_behalf_of_name_snapshot?: string | null
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_on_behalf_of_id_fkey"
            columns: ["on_behalf_of_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          aliases: string[]
          created_at: string
          created_by: string
          deleted_at: string | null
          deleted_by: string | null
          id: string
          is_auto_registered: boolean
          name: string
          updated_at: string
        }
        Insert: {
          aliases?: string[]
          created_at?: string
          created_by: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_auto_registered?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          aliases?: string[]
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_auto_registered?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "companies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companies_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          company_id: string | null
          created_at: string
          created_by: string
          deleted_at: string | null
          deleted_by: string | null
          email: string | null
          id: string
          is_auto_registered: boolean
          name: string
          phone: string | null
          status: string
          title: string | null
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          created_by: string
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string | null
          id?: string
          is_auto_registered?: boolean
          name: string
          phone?: string | null
          status?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string | null
          id?: string
          is_auto_registered?: boolean
          name?: string
          phone?: string | null
          status?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      holidays: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          holiday_date: string
          id: string
          is_active: boolean
          memo: string | null
          name: string
          original_holiday_name: string | null
          type: string
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          holiday_date: string
          id?: string
          is_active?: boolean
          memo?: string | null
          name: string
          original_holiday_name?: string | null
          type: string
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          holiday_date?: string
          id?: string
          is_active?: boolean
          memo?: string | null
          name?: string
          original_holiday_name?: string | null
          type?: string
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "holidays_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "holidays_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mentions: {
        Row: {
          created_at: string
          id: string
          raw_text: string
          reference_id: string
          reference_type: string
          schedule_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          raw_text: string
          reference_id: string
          reference_type: string
          schedule_id: string
        }
        Update: {
          created_at?: string
          id?: string
          raw_text?: string
          reference_id?: string
          reference_type?: string
          schedule_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentions_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_logs: {
        Row: {
          attempt_count: number
          channel: string
          created_at: string
          error_message: string | null
          event_type: string
          id: string
          last_attempted_at: string | null
          payload: Json | null
          read_at: string | null
          recipient_email: string
          recipient_id: string | null
          sent_at: string | null
          status: string
          target_id: string | null
          target_type: string | null
          updated_at: string
        }
        Insert: {
          attempt_count?: number
          channel?: string
          created_at?: string
          error_message?: string | null
          event_type: string
          id?: string
          last_attempted_at?: string | null
          payload?: Json | null
          read_at?: string | null
          recipient_email: string
          recipient_id?: string | null
          sent_at?: string | null
          status?: string
          target_id?: string | null
          target_type?: string | null
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          channel?: string
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          last_attempted_at?: string | null
          payload?: Json | null
          read_at?: string | null
          recipient_email?: string
          recipient_id?: string | null
          sent_at?: string | null
          status?: string
          target_id?: string | null
          target_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notif_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      proxy_permissions: {
        Row: {
          created_at: string
          granted_at: string
          granted_by: string
          id: string
          proxy_user_id: string
          revoked_at: string | null
          revoked_by: string | null
          target_user_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          granted_at?: string
          granted_by: string
          id?: string
          proxy_user_id: string
          revoked_at?: string | null
          revoked_by?: string | null
          target_user_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          granted_at?: string
          granted_by?: string
          id?: string
          proxy_user_id?: string
          revoked_at?: string | null
          revoked_by?: string | null
          target_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proxy_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proxy_revoked_by_fkey"
            columns: ["revoked_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proxy_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proxy_user_id_fkey"
            columns: ["proxy_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_participants: {
        Row: {
          added_by: string
          cancelled_at: string | null
          created_at: string
          id: string
          joined_at: string
          schedule_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          added_by: string
          cancelled_at?: string | null
          created_at?: string
          id?: string
          joined_at?: string
          schedule_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          added_by?: string
          cancelled_at?: string | null
          created_at?: string
          id?: string
          joined_at?: string
          schedule_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sp_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sp_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sp_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      schedules: {
        Row: {
          created_at: string
          created_by: string
          deleted_at: string | null
          deleted_by: string | null
          end_time: string | null
          id: string
          is_all_day: boolean
          location: string | null
          memo: string | null
          on_behalf_of_id: string | null
          owner_id: string | null
          schedule_date: string
          start_time: string | null
          time_slot: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          deleted_at?: string | null
          deleted_by?: string | null
          end_time?: string | null
          id?: string
          is_all_day?: boolean
          location?: string | null
          memo?: string | null
          on_behalf_of_id?: string | null
          owner_id?: string | null
          schedule_date: string
          start_time?: string | null
          time_slot: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          deleted_by?: string | null
          end_time?: string | null
          id?: string
          is_all_day?: boolean
          location?: string | null
          memo?: string | null
          on_behalf_of_id?: string | null
          owner_id?: string | null
          schedule_date?: string
          start_time?: string | null
          time_slot?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_on_behalf_of_id_fkey"
            columns: ["on_behalf_of_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          color: string | null
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          email: string
          employee_id: string
          failed_login_count: number
          id: string
          last_login_at: string | null
          locked_until: string | null
          name: string
          role: string
          status: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          email: string
          employee_id: string
          failed_login_count?: number
          id?: string
          last_login_at?: string | null
          locked_until?: string | null
          name: string
          role?: string
          status?: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string
          employee_id?: string
          failed_login_count?: number
          id?: string
          last_login_at?: string | null
          locked_until?: string | null
          name?: string
          role?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      fn_radar_availability: {
        Args: {
          p_date_from: string
          p_date_to: string
          p_owner_ids: string[]
          p_slot_min?: number
        }
        Returns: {
          available_count: number
          conflicted_ids: string[]
          slot_date: string
          slot_end: string
          slot_start: string
          status: string
          total_count: number
        }[]
      }
      fn_relationship_summary: {
        Args: { p_limit?: number; p_ref_id: string; p_ref_type: string }
        Returns: Json
      }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

