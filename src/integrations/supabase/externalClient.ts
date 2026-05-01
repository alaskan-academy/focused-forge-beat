import { createClient } from '@supabase/supabase-js';

const EXTERNAL_SUPABASE_URL = 'https://vzxqxphqpazebibipzjz.supabase.co';
const EXTERNAL_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6eHF4cGhxcGF6ZWJpYmlwemp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NDY3NDYsImV4cCI6MjA5MzIyMjc0Nn0.7sqvplIPPGz5eouhD7G3FZKv7HBv0eUQYPRII6JUQSs';

export const externalSupabase = createClient(EXTERNAL_SUPABASE_URL, EXTERNAL_SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
