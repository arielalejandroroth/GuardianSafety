import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jjvzmmqapvnnjrwvvgfl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqdnptbXFhcHZubmpyd3Z2Z2ZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxODIxMDYsImV4cCI6MjA3ODc1ODEwNn0.zfnr_KOhR2a7jBPvupYdb6smHYfw_O3CkrqSqaB6lo4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
