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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      app_roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: Database["public"]["Enums"]["app_role_type"]
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: Database["public"]["Enums"]["app_role_type"]
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: Database["public"]["Enums"]["app_role_type"]
        }
        Relationships: []
      }
      campuses: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          code: string | null
          country: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          is_main_campus: boolean | null
          name: string
          phone: string | null
          postal_code: string | null
          state_province: string | null
          updated_at: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          code?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_main_campus?: boolean | null
          name: string
          phone?: string | null
          postal_code?: string | null
          state_province?: string | null
          updated_at?: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          code?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_main_campus?: boolean | null
          name?: string
          phone?: string | null
          postal_code?: string | null
          state_province?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      course_assignments: {
        Row: {
          assigned_by_id: string | null
          assigned_date: string | null
          completion_date: string | null
          course_id: string
          created_at: string | null
          id: string
          notes: string | null
          person_id: string
          status: Database["public"]["Enums"]["assignment_status"] | null
          updated_at: string | null
        }
        Insert: {
          assigned_by_id?: string | null
          assigned_date?: string | null
          completion_date?: string | null
          course_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          person_id: string
          status?: Database["public"]["Enums"]["assignment_status"] | null
          updated_at?: string | null
        }
        Update: {
          assigned_by_id?: string | null
          assigned_date?: string | null
          completion_date?: string | null
          course_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          person_id?: string
          status?: Database["public"]["Enums"]["assignment_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_assignments_assigned_by_id_fkey"
            columns: ["assigned_by_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_assignments_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          category: Database["public"]["Enums"]["course_category"] | null
          code: string | null
          created_at: string | null
          delivery_type: Database["public"]["Enums"]["delivery_type"] | null
          description_en: string | null
          description_fr: string | null
          estimated_duration_hours: number | null
          id: string
          is_active: boolean | null
          title_en: string
          title_fr: string | null
          updated_at: string | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["course_category"] | null
          code?: string | null
          created_at?: string | null
          delivery_type?: Database["public"]["Enums"]["delivery_type"] | null
          description_en?: string | null
          description_fr?: string | null
          estimated_duration_hours?: number | null
          id?: string
          is_active?: boolean | null
          title_en: string
          title_fr?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["course_category"] | null
          code?: string | null
          created_at?: string | null
          delivery_type?: Database["public"]["Enums"]["delivery_type"] | null
          description_en?: string | null
          description_fr?: string | null
          estimated_duration_hours?: number | null
          id?: string
          is_active?: boolean | null
          title_en?: string
          title_fr?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      feedback: {
        Row: {
          content_en: string | null
          content_fr: string | null
          created_at: string | null
          feedback_type: Database["public"]["Enums"]["feedback_type"] | null
          given_by_id: string
          id: string
          person_id: string
          title_en: string | null
          title_fr: string | null
          visible_to_person: boolean | null
        }
        Insert: {
          content_en?: string | null
          content_fr?: string | null
          created_at?: string | null
          feedback_type?: Database["public"]["Enums"]["feedback_type"] | null
          given_by_id: string
          id?: string
          person_id: string
          title_en?: string | null
          title_fr?: string | null
          visible_to_person?: boolean | null
        }
        Update: {
          content_en?: string | null
          content_fr?: string | null
          created_at?: string | null
          feedback_type?: Database["public"]["Enums"]["feedback_type"] | null
          given_by_id?: string
          id?: string
          person_id?: string
          title_en?: string | null
          title_fr?: string | null
          visible_to_person?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_given_by_id_fkey"
            columns: ["given_by_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          category: Database["public"]["Enums"]["goal_category"] | null
          created_at: string | null
          description_en: string | null
          description_fr: string | null
          due_date: string | null
          goal_level: Database["public"]["Enums"]["goal_level"]
          id: string
          owner_ministry_id: string | null
          owner_person_id: string | null
          parent_goal_id: string | null
          progress_percent: number | null
          start_date: string | null
          status: Database["public"]["Enums"]["goal_status"] | null
          title_en: string
          title_fr: string | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["goal_category"] | null
          created_at?: string | null
          description_en?: string | null
          description_fr?: string | null
          due_date?: string | null
          goal_level: Database["public"]["Enums"]["goal_level"]
          id?: string
          owner_ministry_id?: string | null
          owner_person_id?: string | null
          parent_goal_id?: string | null
          progress_percent?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["goal_status"] | null
          title_en: string
          title_fr?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          category?: Database["public"]["Enums"]["goal_category"] | null
          created_at?: string | null
          description_en?: string | null
          description_fr?: string | null
          due_date?: string | null
          goal_level?: Database["public"]["Enums"]["goal_level"]
          id?: string
          owner_ministry_id?: string | null
          owner_person_id?: string | null
          parent_goal_id?: string | null
          progress_percent?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["goal_status"] | null
          title_en?: string
          title_fr?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "goals_owner_ministry_id_fkey"
            columns: ["owner_ministry_id"]
            isOneToOne: false
            referencedRelation: "ministries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_owner_person_id_fkey"
            columns: ["owner_person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_parent_goal_id_fkey"
            columns: ["parent_goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_agenda_items: {
        Row: {
          action_due_date: string | null
          action_owner_id: string | null
          action_required: boolean | null
          action_status: Database["public"]["Enums"]["action_status"] | null
          created_at: string | null
          discussion_notes: string | null
          id: string
          linked_goal_id: string | null
          linked_pdp_item_id: string | null
          meeting_id: string
          order_index: number | null
          section_type:
            | Database["public"]["Enums"]["agenda_section_type"]
            | null
          topic_en: string
          topic_fr: string | null
          updated_at: string | null
        }
        Insert: {
          action_due_date?: string | null
          action_owner_id?: string | null
          action_required?: boolean | null
          action_status?: Database["public"]["Enums"]["action_status"] | null
          created_at?: string | null
          discussion_notes?: string | null
          id?: string
          linked_goal_id?: string | null
          linked_pdp_item_id?: string | null
          meeting_id: string
          order_index?: number | null
          section_type?:
            | Database["public"]["Enums"]["agenda_section_type"]
            | null
          topic_en: string
          topic_fr?: string | null
          updated_at?: string | null
        }
        Update: {
          action_due_date?: string | null
          action_owner_id?: string | null
          action_required?: boolean | null
          action_status?: Database["public"]["Enums"]["action_status"] | null
          created_at?: string | null
          discussion_notes?: string | null
          id?: string
          linked_goal_id?: string | null
          linked_pdp_item_id?: string | null
          meeting_id?: string
          order_index?: number | null
          section_type?:
            | Database["public"]["Enums"]["agenda_section_type"]
            | null
          topic_en?: string
          topic_fr?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_agenda_items_action_owner_id_fkey"
            columns: ["action_owner_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_agenda_items_linked_goal_id_fkey"
            columns: ["linked_goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_agenda_items_linked_pdp_item_id_fkey"
            columns: ["linked_pdp_item_id"]
            isOneToOne: false
            referencedRelation: "pdp_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_agenda_items_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_participants: {
        Row: {
          created_at: string | null
          id: string
          meeting_id: string
          person_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          meeting_id: string
          person_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          meeting_id?: string
          person_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_participants_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_participants_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_template_items: {
        Row: {
          created_at: string | null
          id: string
          is_required: boolean | null
          order_index: number | null
          section_type: Database["public"]["Enums"]["agenda_section_type"]
          template_id: string
          topic_en: string
          topic_fr: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          order_index?: number | null
          section_type?: Database["public"]["Enums"]["agenda_section_type"]
          template_id: string
          topic_en: string
          topic_fr?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          order_index?: number | null
          section_type?: Database["public"]["Enums"]["agenda_section_type"]
          template_id?: string
          topic_en?: string
          topic_fr?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_template_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "meeting_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_templates: {
        Row: {
          created_at: string | null
          created_by_id: string | null
          description_en: string | null
          description_fr: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          meeting_type: Database["public"]["Enums"]["meeting_type"]
          name_en: string
          name_fr: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by_id?: string | null
          description_en?: string | null
          description_fr?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          meeting_type?: Database["public"]["Enums"]["meeting_type"]
          name_en: string
          name_fr?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by_id?: string | null
          description_en?: string | null
          description_fr?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          meeting_type?: Database["public"]["Enums"]["meeting_type"]
          name_en?: string
          name_fr?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_templates_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          created_at: string | null
          date_time: string
          duration_minutes: number | null
          id: string
          meeting_type: Database["public"]["Enums"]["meeting_type"] | null
          ministry_id: string | null
          organizer_id: string
          person_focus_id: string | null
          recurrence_pattern: string | null
          recurring_series_id: string | null
          spiritual_focus: boolean | null
          title_en: string
          title_fr: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date_time: string
          duration_minutes?: number | null
          id?: string
          meeting_type?: Database["public"]["Enums"]["meeting_type"] | null
          ministry_id?: string | null
          organizer_id: string
          person_focus_id?: string | null
          recurrence_pattern?: string | null
          recurring_series_id?: string | null
          spiritual_focus?: boolean | null
          title_en: string
          title_fr?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date_time?: string
          duration_minutes?: number | null
          id?: string
          meeting_type?: Database["public"]["Enums"]["meeting_type"] | null
          ministry_id?: string | null
          organizer_id?: string
          person_focus_id?: string | null
          recurrence_pattern?: string | null
          recurring_series_id?: string | null
          spiritual_focus?: boolean | null
          title_en?: string
          title_fr?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meetings_ministry_id_fkey"
            columns: ["ministry_id"]
            isOneToOne: false
            referencedRelation: "ministries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_person_focus_id_fkey"
            columns: ["person_focus_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      ministries: {
        Row: {
          created_at: string | null
          description_en: string | null
          description_fr: string | null
          id: string
          leader_id: string | null
          name_en: string
          name_fr: string | null
          parent_ministry_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description_en?: string | null
          description_fr?: string | null
          id?: string
          leader_id?: string | null
          name_en: string
          name_fr?: string | null
          parent_ministry_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description_en?: string | null
          description_fr?: string | null
          id?: string
          leader_id?: string | null
          name_en?: string
          name_fr?: string | null
          parent_ministry_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ministries_leader"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ministries_parent_ministry_id_fkey"
            columns: ["parent_ministry_id"]
            isOneToOne: false
            referencedRelation: "ministries"
            referencedColumns: ["id"]
          },
        ]
      }
      ministry_roles: {
        Row: {
          category: Database["public"]["Enums"]["role_category"] | null
          created_at: string | null
          description_en: string | null
          description_fr: string | null
          id: string
          is_staff_role: boolean | null
          is_volunteer_role: boolean | null
          name_en: string
          name_fr: string | null
          updated_at: string | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["role_category"] | null
          created_at?: string | null
          description_en?: string | null
          description_fr?: string | null
          id?: string
          is_staff_role?: boolean | null
          is_volunteer_role?: boolean | null
          name_en: string
          name_fr?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["role_category"] | null
          created_at?: string | null
          description_en?: string | null
          description_fr?: string | null
          id?: string
          is_staff_role?: boolean | null
          is_volunteer_role?: boolean | null
          name_en?: string
          name_fr?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          metadata?: Json | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      organization_settings: {
        Row: {
          accent_color: string | null
          address_line1: string | null
          address_line2: string | null
          city: string | null
          country: string | null
          created_at: string
          email: string | null
          email_footer_text: string | null
          email_reply_to: string | null
          email_sender_address: string | null
          email_sender_name: string | null
          font_family: string | null
          id: string
          organization_logo_url: string | null
          organization_name: string
          phone: string | null
          postal_code: string | null
          primary_color: string | null
          secondary_color: string | null
          state_province: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          accent_color?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          email_footer_text?: string | null
          email_reply_to?: string | null
          email_sender_address?: string | null
          email_sender_name?: string | null
          font_family?: string | null
          id?: string
          organization_logo_url?: string | null
          organization_name?: string
          phone?: string | null
          postal_code?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          state_province?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          accent_color?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          email_footer_text?: string | null
          email_reply_to?: string | null
          email_sender_address?: string | null
          email_sender_name?: string | null
          font_family?: string | null
          id?: string
          organization_logo_url?: string | null
          organization_name?: string
          phone?: string | null
          postal_code?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          state_province?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      pdp_items: {
        Row: {
          created_at: string | null
          description_en: string | null
          description_fr: string | null
          due_date: string | null
          id: string
          item_type: Database["public"]["Enums"]["pdp_item_type"] | null
          linked_goal_id: string | null
          pdp_id: string
          status: Database["public"]["Enums"]["pdp_item_status"] | null
          title_en: string
          title_fr: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description_en?: string | null
          description_fr?: string | null
          due_date?: string | null
          id?: string
          item_type?: Database["public"]["Enums"]["pdp_item_type"] | null
          linked_goal_id?: string | null
          pdp_id: string
          status?: Database["public"]["Enums"]["pdp_item_status"] | null
          title_en: string
          title_fr?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description_en?: string | null
          description_fr?: string | null
          due_date?: string | null
          id?: string
          item_type?: Database["public"]["Enums"]["pdp_item_type"] | null
          linked_goal_id?: string | null
          pdp_id?: string
          status?: Database["public"]["Enums"]["pdp_item_status"] | null
          title_en?: string
          title_fr?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pdp_items_linked_goal_id_fkey"
            columns: ["linked_goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdp_items_pdp_id_fkey"
            columns: ["pdp_id"]
            isOneToOne: false
            referencedRelation: "personal_development_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      people: {
        Row: {
          calling_description: string | null
          campus: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          end_date: string | null
          first_name: string
          gender: Database["public"]["Enums"]["gender_type"] | null
          growth_areas: string | null
          id: string
          last_name: string
          notes: string | null
          other_languages: Database["public"]["Enums"]["language_code"][] | null
          person_type: Database["public"]["Enums"]["person_type"] | null
          phone: string | null
          preferred_name: string | null
          primary_language: Database["public"]["Enums"]["language_code"] | null
          start_date: string | null
          status: Database["public"]["Enums"]["person_status"] | null
          strengths: string | null
          supervisor_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          calling_description?: string | null
          campus?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          end_date?: string | null
          first_name: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          growth_areas?: string | null
          id?: string
          last_name: string
          notes?: string | null
          other_languages?:
            | Database["public"]["Enums"]["language_code"][]
            | null
          person_type?: Database["public"]["Enums"]["person_type"] | null
          phone?: string | null
          preferred_name?: string | null
          primary_language?: Database["public"]["Enums"]["language_code"] | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["person_status"] | null
          strengths?: string | null
          supervisor_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          calling_description?: string | null
          campus?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          end_date?: string | null
          first_name?: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          growth_areas?: string | null
          id?: string
          last_name?: string
          notes?: string | null
          other_languages?:
            | Database["public"]["Enums"]["language_code"][]
            | null
          person_type?: Database["public"]["Enums"]["person_type"] | null
          phone?: string | null
          preferred_name?: string | null
          primary_language?: Database["public"]["Enums"]["language_code"] | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["person_status"] | null
          strengths?: string | null
          supervisor_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "people_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      people_ministries: {
        Row: {
          created_at: string | null
          id: string
          ministry_id: string
          person_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          ministry_id: string
          person_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          ministry_id?: string
          person_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "people_ministries_ministry_id_fkey"
            columns: ["ministry_id"]
            isOneToOne: false
            referencedRelation: "ministries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "people_ministries_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      people_roles: {
        Row: {
          created_at: string | null
          id: string
          person_id: string
          role_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          person_id: string
          role_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          person_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "people_roles_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "people_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "ministry_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_reviews: {
        Row: {
          character_rating: number | null
          created_at: string | null
          end_period_date: string | null
          finalized: boolean | null
          id: string
          ministry_effectiveness_rating: number | null
          overall_rating: number | null
          period_label: string | null
          person_id: string
          reviewer_id: string
          skills_rating: number | null
          spiritual_health_rating: number | null
          start_period_date: string | null
          submitted_at: string | null
          summary_en: string | null
          summary_fr: string | null
          updated_at: string | null
        }
        Insert: {
          character_rating?: number | null
          created_at?: string | null
          end_period_date?: string | null
          finalized?: boolean | null
          id?: string
          ministry_effectiveness_rating?: number | null
          overall_rating?: number | null
          period_label?: string | null
          person_id: string
          reviewer_id: string
          skills_rating?: number | null
          spiritual_health_rating?: number | null
          start_period_date?: string | null
          submitted_at?: string | null
          summary_en?: string | null
          summary_fr?: string | null
          updated_at?: string | null
        }
        Update: {
          character_rating?: number | null
          created_at?: string | null
          end_period_date?: string | null
          finalized?: boolean | null
          id?: string
          ministry_effectiveness_rating?: number | null
          overall_rating?: number | null
          period_label?: string | null
          person_id?: string
          reviewer_id?: string
          skills_rating?: number | null
          spiritual_health_rating?: number | null
          start_period_date?: string | null
          submitted_at?: string | null
          summary_en?: string | null
          summary_fr?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "performance_reviews_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_development_plans: {
        Row: {
          created_at: string | null
          id: string
          person_id: string
          plan_title_en: string
          plan_title_fr: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["pdp_status"] | null
          summary_en: string | null
          summary_fr: string | null
          target_date: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          person_id: string
          plan_title_en: string
          plan_title_fr?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["pdp_status"] | null
          summary_en?: string | null
          summary_fr?: string | null
          target_date?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          person_id?: string
          plan_title_en?: string
          plan_title_fr?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["pdp_status"] | null
          summary_en?: string | null
          summary_fr?: string | null
          target_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "personal_development_plans_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          last_login_at: string | null
          primary_language: Database["public"]["Enums"]["language_code"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          is_active?: boolean | null
          last_login_at?: string | null
          primary_language?: Database["public"]["Enums"]["language_code"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          primary_language?: Database["public"]["Enums"]["language_code"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pulse_responses: {
        Row: {
          comment: string | null
          id: string
          person_id: string
          pulse_survey_id: string
          rating: number | null
          submitted_at: string | null
        }
        Insert: {
          comment?: string | null
          id?: string
          person_id: string
          pulse_survey_id: string
          rating?: number | null
          submitted_at?: string | null
        }
        Update: {
          comment?: string | null
          id?: string
          person_id?: string
          pulse_survey_id?: string
          rating?: number | null
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pulse_responses_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pulse_responses_pulse_survey_id_fkey"
            columns: ["pulse_survey_id"]
            isOneToOne: false
            referencedRelation: "pulse_surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      pulse_surveys: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          target_group: Database["public"]["Enums"]["pulse_target"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          target_group?: Database["public"]["Enums"]["pulse_target"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          target_group?: Database["public"]["Enums"]["pulse_target"] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      review_goal_snapshots: {
        Row: {
          comment_en: string | null
          comment_fr: string | null
          created_at: string | null
          goal_id: string
          id: string
          performance_review_id: string
          rating: number | null
        }
        Insert: {
          comment_en?: string | null
          comment_fr?: string | null
          created_at?: string | null
          goal_id: string
          id?: string
          performance_review_id: string
          rating?: number | null
        }
        Update: {
          comment_en?: string | null
          comment_fr?: string | null
          created_at?: string | null
          goal_id?: string
          id?: string
          performance_review_id?: string
          rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "review_goal_snapshots_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_goal_snapshots_performance_review_id_fkey"
            columns: ["performance_review_id"]
            isOneToOne: false
            referencedRelation: "performance_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_visible_roles: {
        Row: {
          created_at: string | null
          id: string
          role_name: Database["public"]["Enums"]["app_role_type"]
          survey_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role_name: Database["public"]["Enums"]["app_role_type"]
          survey_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role_name?: Database["public"]["Enums"]["app_role_type"]
          survey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_visible_roles_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "pulse_surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "app_roles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_view_survey: {
        Args: { check_survey_id: string; check_user_id: string }
        Returns: boolean
      }
      get_person_id_for_user: {
        Args: { check_user_id: string }
        Returns: string
      }
      has_app_role: {
        Args: {
          check_role: Database["public"]["Enums"]["app_role_type"]
          check_user_id: string
        }
        Returns: boolean
      }
      is_admin_or_super: { Args: { check_user_id: string }; Returns: boolean }
      supervises_person: {
        Args: { person_id: string; supervisor_user_id: string }
        Returns: boolean
      }
      user_participates_in_meeting: {
        Args: { check_meeting_id: string; check_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      action_status: "open" | "in_progress" | "done" | "cancelled"
      agenda_section_type:
        | "spiritual_life"
        | "personal_family"
        | "ministry_updates"
        | "goals_review"
        | "development_training"
        | "feedback_coaching"
        | "other"
      app_role_type:
        | "super_admin"
        | "admin"
        | "pastor_supervisor"
        | "staff"
        | "volunteer"
      assignment_status: "not_started" | "in_progress" | "completed" | "dropped"
      course_category:
        | "theology"
        | "character"
        | "pastoral_skills"
        | "ministry_skills"
        | "leadership"
        | "other"
      delivery_type: "in_person" | "online" | "hybrid" | "reading_plan"
      feedback_type: "encouragement" | "coaching" | "concern"
      gender_type: "male" | "female" | "other" | "prefer_not_to_say"
      goal_category:
        | "discipleship"
        | "evangelism"
        | "operations"
        | "finance"
        | "training"
        | "other"
      goal_level: "church" | "ministry" | "department" | "individual"
      goal_status:
        | "not_started"
        | "in_progress"
        | "completed"
        | "on_hold"
        | "cancelled"
      language_code: "en" | "fr"
      meeting_type: "one_on_one" | "team" | "ministry" | "board" | "other"
      pdp_item_status: "not_started" | "in_progress" | "completed" | "cancelled"
      pdp_item_type: "course" | "mentoring" | "project" | "reading" | "other"
      pdp_status: "active" | "completed" | "on_hold"
      person_status: "active" | "inactive" | "on_leave"
      person_type: "staff" | "volunteer" | "congregant"
      pulse_target: "all_staff" | "all_volunteers" | "custom"
      role_category:
        | "pastoral"
        | "worship"
        | "children"
        | "youth"
        | "media"
        | "admin"
        | "other"
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
      action_status: ["open", "in_progress", "done", "cancelled"],
      agenda_section_type: [
        "spiritual_life",
        "personal_family",
        "ministry_updates",
        "goals_review",
        "development_training",
        "feedback_coaching",
        "other",
      ],
      app_role_type: [
        "super_admin",
        "admin",
        "pastor_supervisor",
        "staff",
        "volunteer",
      ],
      assignment_status: ["not_started", "in_progress", "completed", "dropped"],
      course_category: [
        "theology",
        "character",
        "pastoral_skills",
        "ministry_skills",
        "leadership",
        "other",
      ],
      delivery_type: ["in_person", "online", "hybrid", "reading_plan"],
      feedback_type: ["encouragement", "coaching", "concern"],
      gender_type: ["male", "female", "other", "prefer_not_to_say"],
      goal_category: [
        "discipleship",
        "evangelism",
        "operations",
        "finance",
        "training",
        "other",
      ],
      goal_level: ["church", "ministry", "department", "individual"],
      goal_status: [
        "not_started",
        "in_progress",
        "completed",
        "on_hold",
        "cancelled",
      ],
      language_code: ["en", "fr"],
      meeting_type: ["one_on_one", "team", "ministry", "board", "other"],
      pdp_item_status: ["not_started", "in_progress", "completed", "cancelled"],
      pdp_item_type: ["course", "mentoring", "project", "reading", "other"],
      pdp_status: ["active", "completed", "on_hold"],
      person_status: ["active", "inactive", "on_leave"],
      person_type: ["staff", "volunteer", "congregant"],
      pulse_target: ["all_staff", "all_volunteers", "custom"],
      role_category: [
        "pastoral",
        "worship",
        "children",
        "youth",
        "media",
        "admin",
        "other",
      ],
    },
  },
} as const
