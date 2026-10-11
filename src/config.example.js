// config.example.js 
const supabaseUrl = 'YOUR_SUPABASE_URL_HERE';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY_HERE';
window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);