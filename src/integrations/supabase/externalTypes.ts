// Types of the external Supabase project (vzxqxphqpazebibipzjz) used by externalClient.
// Generated from the live schema — regenerate after schema changes (Supabase "generate types").

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
      inbox_items: {
        Row: {
          content: string
          created_at: string
          id: string
          is_done: boolean
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_done?: boolean
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_done?: boolean
          user_id?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          status: string
          user_id: string | null
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          status?: string
          user_id?: string | null
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      reminders: {
        Row: {
          archived: boolean
          color: string
          content: string
          created_at: string
          id: string
          position: number
          user_id: string | null
        }
        Insert: {
          archived?: boolean
          color?: string
          content: string
          created_at?: string
          id?: string
          position?: number
          user_id?: string | null
        }
        Update: {
          archived?: boolean
          color?: string
          content?: string
          created_at?: string
          id?: string
          position?: number
          user_id?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          actual_minutes: number | null
          area: string
          completed_at: string | null
          created_at: string
          deleted_at: string | null
          due_date: string | null
          estimated_minutes: number | null
          id: string
          name: string
          notes: string | null
          priority: string
          project_id: string | null
          recurrence_config: Json | null
          start_date: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          actual_minutes?: number | null
          area?: string
          completed_at?: string | null
          created_at?: string
          deleted_at?: string | null
          due_date?: string | null
          estimated_minutes?: number | null
          id?: string
          name: string
          notes?: string | null
          priority?: string
          project_id?: string | null
          recurrence_config?: Json | null
          start_date?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          actual_minutes?: number | null
          area?: string
          completed_at?: string | null
          created_at?: string
          deleted_at?: string | null
          due_date?: string | null
          estimated_minutes?: number | null
          id?: string
          name?: string
          notes?: string | null
          priority?: string
          project_id?: string | null
          recurrence_config?: Json | null
          start_date?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      timer_sessions: {
        Row: {
          duration_minutes: number | null
          ended_at: string | null
          id: string
          started_at: string
          task_id: string
        }
        Insert: {
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          started_at?: string
          task_id: string
        }
        Update: {
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          started_at?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "timer_sessions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timer_sessions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks_with_time"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          preferences: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          preferences?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          preferences?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      tasks_with_time: {
        Row: {
          actual_minutes: number | null
          area: string | null
          completed_at: string | null
          created_at: string | null
          deleted_at: string | null
          due_date: string | null
          estimated_minutes: number | null
          id: string | null
          name: string | null
          notes: string | null
          priority: string | null
          project_color: string | null
          project_id: string | null
          project_name: string | null
          recurrence_config: Json | null
          start_date: string | null
          status: string | null
          total_tracked_minutes: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
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
