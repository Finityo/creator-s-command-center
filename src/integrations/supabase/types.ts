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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ab_tests: {
        Row: {
          created_at: string
          id: string
          name: string
          platform: string
          status: string
          updated_at: string
          user_id: string
          variant_a_content: string
          variant_a_post_id: string | null
          variant_b_content: string
          variant_b_post_id: string | null
          winner: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          platform: string
          status?: string
          updated_at?: string
          user_id: string
          variant_a_content: string
          variant_a_post_id?: string | null
          variant_b_content: string
          variant_b_post_id?: string | null
          winner?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          platform?: string
          status?: string
          updated_at?: string
          user_id?: string
          variant_a_content?: string
          variant_a_post_id?: string | null
          variant_b_content?: string
          variant_b_post_id?: string | null
          winner?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ab_tests_variant_a_post_id_fkey"
            columns: ["variant_a_post_id"]
            isOneToOne: false
            referencedRelation: "scheduled_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ab_tests_variant_b_post_id_fkey"
            columns: ["variant_b_post_id"]
            isOneToOne: false
            referencedRelation: "scheduled_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_snapshots: {
        Row: {
          account_id: string | null
          clicks: number | null
          engagement: number | null
          followers: number | null
          id: string
          impressions: number | null
          platform: Database["public"]["Enums"]["platform"]
          taken_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          clicks?: number | null
          engagement?: number | null
          followers?: number | null
          id?: string
          impressions?: number | null
          platform: Database["public"]["Enums"]["platform"]
          taken_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          clicks?: number | null
          engagement?: number | null
          followers?: number | null
          id?: string
          impressions?: number | null
          platform?: Database["public"]["Enums"]["platform"]
          taken_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_snapshots_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "social_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_snapshots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_snapshots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      competitor_accounts: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          handle: string
          id: string
          notes: string | null
          platform: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          handle: string
          id?: string
          notes?: string | null
          platform: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          handle?: string
          id?: string
          notes?: string | null
          platform?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      link_items: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          is_active: boolean | null
          label: string
          sort_order: number | null
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          sort_order?: number | null
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          sort_order?: number | null
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "link_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "link_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          approval_needed: boolean
          created_at: string
          id: string
          post_approved: boolean
          post_failed: boolean
          post_rejected: boolean
          post_sent: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          approval_needed?: boolean
          created_at?: string
          id?: string
          post_approved?: boolean
          post_failed?: boolean
          post_rejected?: boolean
          post_sent?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          approval_needed?: boolean
          created_at?: string
          id?: string
          post_approved?: boolean
          post_failed?: boolean
          post_rejected?: boolean
          post_sent?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_analytics: {
        Row: {
          clicks: number | null
          comments: number | null
          created_at: string
          engagements: number | null
          id: string
          impressions: number | null
          likes: number | null
          post_id: string
          reach: number | null
          recorded_at: string
          shares: number | null
          user_id: string
        }
        Insert: {
          clicks?: number | null
          comments?: number | null
          created_at?: string
          engagements?: number | null
          id?: string
          impressions?: number | null
          likes?: number | null
          post_id: string
          reach?: number | null
          recorded_at?: string
          shares?: number | null
          user_id: string
        }
        Update: {
          clicks?: number | null
          comments?: number | null
          created_at?: string
          engagements?: number | null
          id?: string
          impressions?: number | null
          likes?: number | null
          post_id?: string
          reach?: number | null
          recorded_at?: string
          shares?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_analytics_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "scheduled_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_templates: {
        Row: {
          content: string
          created_at: string
          id: string
          name: string
          platform: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          name: string
          platform?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          name?: string
          platform?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          link_page_bio: string | null
          link_page_slug: string | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          link_page_bio?: string | null
          link_page_slug?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          link_page_bio?: string | null
          link_page_slug?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      scheduled_posts: {
        Row: {
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          content: string
          created_at: string
          error_message: string | null
          id: string
          media_url: string | null
          parent_post_id: string | null
          platform: Database["public"]["Enums"]["platform"]
          queue_order: number | null
          recurrence_end_date: string | null
          recurrence_type: string | null
          rejection_reason: string | null
          scheduled_at: string
          social_account_id: string | null
          status: Database["public"]["Enums"]["post_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          content: string
          created_at?: string
          error_message?: string | null
          id?: string
          media_url?: string | null
          parent_post_id?: string | null
          platform: Database["public"]["Enums"]["platform"]
          queue_order?: number | null
          recurrence_end_date?: string | null
          recurrence_type?: string | null
          rejection_reason?: string | null
          scheduled_at: string
          social_account_id?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          content?: string
          created_at?: string
          error_message?: string | null
          id?: string
          media_url?: string | null
          parent_post_id?: string | null
          platform?: Database["public"]["Enums"]["platform"]
          queue_order?: number | null
          recurrence_end_date?: string | null
          recurrence_type?: string | null
          rejection_reason?: string | null
          scheduled_at?: string
          social_account_id?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_posts_parent_post_id_fkey"
            columns: ["parent_post_id"]
            isOneToOne: false
            referencedRelation: "scheduled_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_posts_social_account_id_fkey"
            columns: ["social_account_id"]
            isOneToOne: false
            referencedRelation: "social_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      social_accounts: {
        Row: {
          access_token: string | null
          created_at: string
          external_id: string | null
          handle: string
          id: string
          is_connected: boolean | null
          platform: Database["public"]["Enums"]["platform"]
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          external_id?: string | null
          handle: string
          id?: string
          is_connected?: boolean | null
          platform: Database["public"]["Enums"]["platform"]
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          external_id?: string | null
          handle?: string
          id?: string
          is_connected?: boolean | null
          platform?: Database["public"]["Enums"]["platform"]
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          inviter_id: string
          role: Database["public"]["Enums"]["app_role"]
          status: string
          token: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          inviter_id: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          token?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          inviter_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          token?: string
          updated_at?: string
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
          role?: Database["public"]["Enums"]["app_role"]
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
      public_profiles: {
        Row: {
          avatar_url: string | null
          display_name: string | null
          id: string | null
          link_page_bio: string | null
          link_page_slug: string | null
          timezone: string | null
        }
        Insert: {
          avatar_url?: string | null
          display_name?: string | null
          id?: string | null
          link_page_bio?: string | null
          link_page_slug?: string | null
          timezone?: string | null
        }
        Update: {
          avatar_url?: string | null
          display_name?: string | null
          id?: string | null
          link_page_bio?: string | null
          link_page_slug?: string | null
          timezone?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_owner: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "owner" | "admin" | "editor" | "viewer"
      platform: "X" | "INSTAGRAM" | "FACEBOOK" | "ONLYFANS"
      post_status: "DRAFT" | "SCHEDULED" | "SENT" | "FAILED"
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
      app_role: ["owner", "admin", "editor", "viewer"],
      platform: ["X", "INSTAGRAM", "FACEBOOK", "ONLYFANS"],
      post_status: ["DRAFT", "SCHEDULED", "SENT", "FAILED"],
    },
  },
} as const
