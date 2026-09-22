import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from './supabaseTypes';
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://yupmxllzjaycbpzfcmsn.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1cG14bGx6amF5Y2JwemZjbXNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0ODYyOTYsImV4cCI6MjEwNTA2MjI5Nn0.tFIUjGPMX1igLVZt4zQF7fGG7jDznXb92Mc6Xf0AZ9o";

// Import the supabase client like this:
// import { supabase } from "@/utils/supabaseClient";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
