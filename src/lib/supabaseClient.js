import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hlspcpiawyyvvwnqqkgq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhsc3BjcGlhd3l5dnZ3bnFxa2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MTY4NjksImV4cCI6MjA4ODM5Mjg2OX0.Cn0pkS7LLzWU9iacB7O_bFhy4tmGotFdocYgtG_WytQ'
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
