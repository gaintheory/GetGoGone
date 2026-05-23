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
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          dealership_id: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          dealership_id?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          dealership_id?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_dealership_id_fkey"
            columns: ["dealership_id"]
            isOneToOne: false
            referencedRelation: "dealerships"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_assets: {
        Row: {
          asset_type: string
          campaign_channel_id: string | null
          campaign_id: string
          created_at: string
          file_url: string | null
          format: string | null
          id: string
          metadata: Json
          storage_path: string | null
          template_id: string | null
        }
        Insert: {
          asset_type: string
          campaign_channel_id?: string | null
          campaign_id: string
          created_at?: string
          file_url?: string | null
          format?: string | null
          id?: string
          metadata?: Json
          storage_path?: string | null
          template_id?: string | null
        }
        Update: {
          asset_type?: string
          campaign_channel_id?: string | null
          campaign_id?: string
          created_at?: string
          file_url?: string | null
          format?: string | null
          id?: string
          metadata?: Json
          storage_path?: string | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_assets_campaign_channel_id_fkey"
            columns: ["campaign_channel_id"]
            isOneToOne: false
            referencedRelation: "campaign_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_assets_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_channels: {
        Row: {
          call_to_action: string | null
          campaign_id: string
          channel: string
          created_at: string
          description: string | null
          destination_url: string | null
          headline: string | null
          id: string
          platform_payload: Json
          primary_text: string | null
          published_at: string | null
          published_url: string | null
          status: string
          updated_at: string
        }
        Insert: {
          call_to_action?: string | null
          campaign_id: string
          channel: string
          created_at?: string
          description?: string | null
          destination_url?: string | null
          headline?: string | null
          id?: string
          platform_payload?: Json
          primary_text?: string | null
          published_at?: string | null
          published_url?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          call_to_action?: string | null
          campaign_id?: string
          channel?: string
          created_at?: string
          description?: string | null
          destination_url?: string | null
          headline?: string | null
          id?: string
          platform_payload?: Json
          primary_text?: string | null
          published_at?: string | null
          published_url?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_channels_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          audience_type: string | null
          budget: number | null
          campaign_type: string
          created_at: string
          created_by: string | null
          dealership_id: string
          ends_at: string | null
          goal: string | null
          id: string
          language: string
          name: string
          starts_at: string | null
          status: string
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          audience_type?: string | null
          budget?: number | null
          campaign_type: string
          created_at?: string
          created_by?: string | null
          dealership_id: string
          ends_at?: string | null
          goal?: string | null
          id?: string
          language?: string
          name: string
          starts_at?: string | null
          status?: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          audience_type?: string | null
          budget?: number | null
          campaign_type?: string
          created_at?: string
          created_by?: string | null
          dealership_id?: string
          ends_at?: string | null
          goal?: string | null
          id?: string
          language?: string
          name?: string
          starts_at?: string | null
          status?: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_dealership_id_fkey"
            columns: ["dealership_id"]
            isOneToOne: false
            referencedRelation: "dealerships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      creative_templates: {
        Row: {
          canvas_json: Json
          category: string | null
          created_at: string
          created_by: string | null
          dealership_id: string | null
          format: string
          id: string
          is_system: boolean
          language: string
          name: string
          preview_url: string | null
          updated_at: string
        }
        Insert: {
          canvas_json?: Json
          category?: string | null
          created_at?: string
          created_by?: string | null
          dealership_id?: string | null
          format: string
          id?: string
          is_system?: boolean
          language?: string
          name: string
          preview_url?: string | null
          updated_at?: string
        }
        Update: {
          canvas_json?: Json
          category?: string | null
          created_at?: string
          created_by?: string | null
          dealership_id?: string | null
          format?: string
          id?: string
          is_system?: boolean
          language?: string
          name?: string
          preview_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "creative_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creative_templates_dealership_id_fkey"
            columns: ["dealership_id"]
            isOneToOne: false
            referencedRelation: "dealerships"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_applications: {
        Row: {
          created_at: string
          data: Json | null
          dl: string | null
          dob: string | null
          id: string
          name: string | null
          phone: string | null
          ssn: string | null
        }
        Insert: {
          created_at?: string
          data?: Json | null
          dl?: string | null
          dob?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          ssn?: string | null
        }
        Update: {
          created_at?: string
          data?: Json | null
          dl?: string | null
          dob?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          ssn?: string | null
        }
        Relationships: []
      }
      dealerships: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          brand_colors: Json
          city: string | null
          created_at: string
          default_disclosure: string | null
          finance_application_url: string | null
          id: string
          legal_name: string | null
          logo_url: string | null
          name: string
          phone: string | null
          postal_code: string | null
          state: string | null
          timezone: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          brand_colors?: Json
          city?: string | null
          created_at?: string
          default_disclosure?: string | null
          finance_application_url?: string | null
          id?: string
          legal_name?: string | null
          logo_url?: string | null
          name: string
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          timezone?: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          brand_colors?: Json
          city?: string | null
          created_at?: string
          default_disclosure?: string | null
          finance_application_url?: string | null
          id?: string
          legal_name?: string | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          timezone?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      inspections: {
        Row: {
          body: string | null
          checklist: Json | null
          color: string | null
          created_at: string | null
          down_payment: number | null
          id: number
          inspection_date: string | null
          inspector_name: string | null
          make: string | null
          miles: string | null
          model: string | null
          paid_status: string | null
          photo_urls: Json | null
          price: number | null
          purchased_from: string | null
          remarks: string | null
          transmission: string | null
          vin: string
          website_copy: string | null
          year: string | null
        }
        Insert: {
          body?: string | null
          checklist?: Json | null
          color?: string | null
          created_at?: string | null
          down_payment?: number | null
          id?: number
          inspection_date?: string | null
          inspector_name?: string | null
          make?: string | null
          miles?: string | null
          model?: string | null
          paid_status?: string | null
          photo_urls?: Json | null
          price?: number | null
          purchased_from?: string | null
          remarks?: string | null
          transmission?: string | null
          vin: string
          website_copy?: string | null
          year?: string | null
        }
        Update: {
          body?: string | null
          checklist?: Json | null
          color?: string | null
          created_at?: string | null
          down_payment?: number | null
          id?: number
          inspection_date?: string | null
          inspector_name?: string | null
          make?: string | null
          miles?: string | null
          model?: string | null
          paid_status?: string | null
          photo_urls?: Json | null
          price?: number | null
          purchased_from?: string | null
          remarks?: string | null
          transmission?: string | null
          vin?: string
          website_copy?: string | null
          year?: string | null
        }
        Relationships: []
      }
      integrations: {
        Row: {
          created_at: string
          credentials_ref: string | null
          dealership_id: string
          id: string
          last_sync_at: string | null
          provider: string
          settings: Json
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          credentials_ref?: string | null
          dealership_id: string
          id?: string
          last_sync_at?: string | null
          provider: string
          settings?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          credentials_ref?: string | null
          dealership_id?: string
          id?: string
          last_sync_at?: string | null
          provider?: string
          settings?: Json
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_dealership_id_fkey"
            columns: ["dealership_id"]
            isOneToOne: false
            referencedRelation: "dealerships"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_events: {
        Row: {
          channel: string | null
          content: string | null
          created_at: string
          created_by: string | null
          event_type: string
          id: string
          lead_id: string
          metadata: Json
        }
        Insert: {
          channel?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          event_type: string
          id?: string
          lead_id: string
          metadata?: Json
        }
        Update: {
          channel?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          event_type?: string
          id?: string
          lead_id?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "lead_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          appointment_at: string | null
          assigned_to: string | null
          campaign_id: string | null
          created_at: string
          dealership_id: string
          down_payment_available: number | null
          email: string | null
          first_name: string | null
          id: string
          language_preference: string
          last_contacted_at: string | null
          last_name: string | null
          phone: string | null
          preferred_contact: string | null
          source: string | null
          source_lead_id: string | null
          source_system: string | null
          status: string
          trade_in: boolean | null
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          appointment_at?: string | null
          assigned_to?: string | null
          campaign_id?: string | null
          created_at?: string
          dealership_id: string
          down_payment_available?: number | null
          email?: string | null
          first_name?: string | null
          id?: string
          language_preference?: string
          last_contacted_at?: string | null
          last_name?: string | null
          phone?: string | null
          preferred_contact?: string | null
          source?: string | null
          source_lead_id?: string | null
          source_system?: string | null
          status?: string
          trade_in?: boolean | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          appointment_at?: string | null
          assigned_to?: string | null
          campaign_id?: string | null
          created_at?: string
          dealership_id?: string
          down_payment_available?: number | null
          email?: string | null
          first_name?: string | null
          id?: string
          language_preference?: string
          last_contacted_at?: string | null
          last_name?: string | null
          phone?: string | null
          preferred_contact?: string | null
          source?: string | null
          source_lead_id?: string | null
          source_system?: string | null
          status?: string
          trade_in?: boolean | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_dealership_id_fkey"
            columns: ["dealership_id"]
            isOneToOne: false
            referencedRelation: "dealerships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_posts: {
        Row: {
          clicks: number | null
          copy_used: string | null
          created_at: string | null
          id: string
          inspection_id: string | null
          photo_urls: Json | null
          platform: string
          post_id: string | null
          published_at: string | null
          reach: number | null
          status: string | null
          vin: string
        }
        Insert: {
          clicks?: number | null
          copy_used?: string | null
          created_at?: string | null
          id?: string
          inspection_id?: string | null
          photo_urls?: Json | null
          platform: string
          post_id?: string | null
          published_at?: string | null
          reach?: number | null
          status?: string | null
          vin: string
        }
        Update: {
          clicks?: number | null
          copy_used?: string | null
          created_at?: string | null
          id?: string
          inspection_id?: string | null
          photo_urls?: Json | null
          platform?: string
          post_id?: string | null
          published_at?: string | null
          reach?: number | null
          status?: string | null
          vin?: string
        }
        Relationships: []
      }
      marketing_send_recipients: {
        Row: {
          clicked_at: string | null
          created_at: string
          error: string | null
          id: string
          lead_id: string | null
          marketing_send_id: string
          opened_at: string | null
          replied_at: string | null
          sent_at: string | null
          status: string
        }
        Insert: {
          clicked_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          lead_id?: string | null
          marketing_send_id: string
          opened_at?: string | null
          replied_at?: string | null
          sent_at?: string | null
          status?: string
        }
        Update: {
          clicked_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          lead_id?: string | null
          marketing_send_id?: string
          opened_at?: string | null
          replied_at?: string | null
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_send_recipients_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_send_recipients_marketing_send_id_fkey"
            columns: ["marketing_send_id"]
            isOneToOne: false
            referencedRelation: "marketing_sends"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_sends: {
        Row: {
          body: string
          channel: string
          created_at: string
          created_by: string | null
          dealership_id: string
          id: string
          name: string
          recipient_count: number
          scheduled_at: string | null
          segment: Json
          sent_at: string | null
          status: string
          subject: string | null
          template_id: string | null
          updated_at: string
        }
        Insert: {
          body: string
          channel: string
          created_at?: string
          created_by?: string | null
          dealership_id: string
          id?: string
          name: string
          recipient_count?: number
          scheduled_at?: string | null
          segment?: Json
          sent_at?: string | null
          status?: string
          subject?: string | null
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          body?: string
          channel?: string
          created_at?: string
          created_by?: string | null
          dealership_id?: string
          id?: string
          name?: string
          recipient_count?: number
          scheduled_at?: string | null
          segment?: Json
          sent_at?: string | null
          status?: string
          subject?: string | null
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_sends_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_sends_dealership_id_fkey"
            columns: ["dealership_id"]
            isOneToOne: false
            referencedRelation: "dealerships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_sends_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "message_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          body: string
          category: string | null
          channel: string
          compliance_level: string
          created_at: string
          created_by: string | null
          dealership_id: string | null
          id: string
          is_system: boolean
          language: string
          name: string
          subject: string | null
          tokens: Json
          updated_at: string
        }
        Insert: {
          body: string
          category?: string | null
          channel: string
          compliance_level?: string
          created_at?: string
          created_by?: string | null
          dealership_id?: string | null
          id?: string
          is_system?: boolean
          language?: string
          name: string
          subject?: string | null
          tokens?: Json
          updated_at?: string
        }
        Update: {
          body?: string
          category?: string | null
          channel?: string
          compliance_level?: string
          created_at?: string
          created_by?: string | null
          dealership_id?: string | null
          id?: string
          is_system?: boolean
          language?: string
          name?: string
          subject?: string | null
          tokens?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_templates_dealership_id_fkey"
            columns: ["dealership_id"]
            isOneToOne: false
            referencedRelation: "dealerships"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          dealership_id: string | null
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean
          phone: string | null
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          dealership_id?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          dealership_id?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_dealership_id_fkey"
            columns: ["dealership_id"]
            isOneToOne: false
            referencedRelation: "dealerships"
            referencedColumns: ["id"]
          },
        ]
      }
      service_records: {
        Row: {
          checklist: Json | null
          cosmetic_notes: string | null
          created_at: string
          id: string
          notes: string | null
          parts_log: Json | null
          safety_status: string | null
          sublet_flag: boolean | null
          updated_at: string | null
          vin: string | null
        }
        Insert: {
          checklist?: Json | null
          cosmetic_notes?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          parts_log?: Json | null
          safety_status?: string | null
          sublet_flag?: boolean | null
          updated_at?: string | null
          vin?: string | null
        }
        Update: {
          checklist?: Json | null
          cosmetic_notes?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          parts_log?: Json | null
          safety_status?: string | null
          sublet_flag?: boolean | null
          updated_at?: string | null
          vin?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          dealership_id: string
          description: string | null
          due_at: string | null
          id: string
          lead_id: string | null
          status: string
          task_type: string
          title: string
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          dealership_id: string
          description?: string | null
          due_at?: string | null
          id?: string
          lead_id?: string | null
          status?: string
          task_type: string
          title: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          dealership_id?: string
          description?: string | null
          due_at?: string | null
          id?: string
          lead_id?: string | null
          status?: string
          task_type?: string
          title?: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_dealership_id_fkey"
            columns: ["dealership_id"]
            isOneToOne: false
            referencedRelation: "dealerships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_photos: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          is_primary: boolean
          position: number
          quality_score: number | null
          source_url: string | null
          storage_path: string | null
          vehicle_id: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          position?: number
          quality_score?: number | null
          source_url?: string | null
          storage_path?: string | null
          vehicle_id: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          position?: number
          quality_score?: number | null
          source_url?: string | null
          storage_path?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_photos_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          body_style: string | null
          created_at: string
          dealership_id: string
          description: string | null
          down_payment: number | null
          drivetrain: string | null
          engine: string | null
          exterior_color: string | null
          first_seen_at: string
          fuel_type: string | null
          id: string
          interior_color: string | null
          last_synced_at: string | null
          make: string | null
          mileage: number | null
          model: string | null
          notes: string | null
          price: number | null
          readiness_status: string | null
          sold_at: string | null
          source_record_id: string | null
          source_system: string | null
          source_url: string | null
          status: string
          stock_number: string | null
          transmission: string | null
          trim: string | null
          updated_at: string
          vin: string
          year: number | null
        }
        Insert: {
          body_style?: string | null
          created_at?: string
          dealership_id: string
          description?: string | null
          down_payment?: number | null
          drivetrain?: string | null
          engine?: string | null
          exterior_color?: string | null
          first_seen_at?: string
          fuel_type?: string | null
          id?: string
          interior_color?: string | null
          last_synced_at?: string | null
          make?: string | null
          mileage?: number | null
          model?: string | null
          notes?: string | null
          price?: number | null
          readiness_status?: string | null
          sold_at?: string | null
          source_record_id?: string | null
          source_system?: string | null
          source_url?: string | null
          status?: string
          stock_number?: string | null
          transmission?: string | null
          trim?: string | null
          updated_at?: string
          vin: string
          year?: number | null
        }
        Update: {
          body_style?: string | null
          created_at?: string
          dealership_id?: string
          description?: string | null
          down_payment?: number | null
          drivetrain?: string | null
          engine?: string | null
          exterior_color?: string | null
          first_seen_at?: string
          fuel_type?: string | null
          id?: string
          interior_color?: string | null
          last_synced_at?: string | null
          make?: string | null
          mileage?: number | null
          model?: string | null
          notes?: string | null
          price?: number | null
          readiness_status?: string | null
          sold_at?: string | null
          source_record_id?: string | null
          source_system?: string | null
          source_url?: string | null
          status?: string
          stock_number?: string | null
          transmission?: string | null
          trim?: string | null
          updated_at?: string
          vin?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_dealership_id_fkey"
            columns: ["dealership_id"]
            isOneToOne: false
            referencedRelation: "dealerships"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_runs: {
        Row: {
          created_at: string
          error: string | null
          finished_at: string | null
          id: string
          lead_id: string | null
          metadata: Json
          started_at: string | null
          status: string
          vehicle_id: string | null
          workflow_id: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json
          started_at?: string | null
          status?: string
          vehicle_id?: string | null
          workflow_id: string
        }
        Update: {
          created_at?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json
          started_at?: string | null
          status?: string
          vehicle_id?: string | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_runs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_runs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_runs_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflows: {
        Row: {
          action_config: Json
          action_type: string
          created_at: string
          created_by: string | null
          dealership_id: string
          delay_minutes: number
          id: string
          name: string
          status: string
          trigger_config: Json
          trigger_type: string
          updated_at: string
        }
        Insert: {
          action_config?: Json
          action_type: string
          created_at?: string
          created_by?: string | null
          dealership_id: string
          delay_minutes?: number
          id?: string
          name: string
          status?: string
          trigger_config?: Json
          trigger_type: string
          updated_at?: string
        }
        Update: {
          action_config?: Json
          action_type?: string
          created_at?: string
          created_by?: string | null
          dealership_id?: string
          delay_minutes?: number
          id?: string
          name?: string
          status?: string
          trigger_config?: Json
          trigger_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflows_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflows_dealership_id_fkey"
            columns: ["dealership_id"]
            isOneToOne: false
            referencedRelation: "dealerships"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      inspection_vehicle_source: {
        Row: {
          body_style: string | null
          description: string | null
          down_payment: number | null
          exterior_color: string | null
          make: string | null
          mileage: number | null
          model: string | null
          notes: string | null
          photo_urls: Json | null
          price: number | null
          readiness_status: string | null
          service_notes: string | null
          source_record_id: string | null
          source_system: string | null
          source_updated_at: string | null
          transmission: string | null
          vin: string | null
          year: number | null
        }
        Relationships: []
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
