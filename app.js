/* ==========================================================================
   PASO 1: CONFIGURACIÓN DE LA CONEXIÓN A SUPABASE
   ========================================================================== */
const SUPABASE_URL = "https://nakggxqpmnyiufhtwscn.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_jdbt3wTQ1HiNcYjDcYzerQ_xLmvNN9P";

// Iniciamos el cliente de Supabase para conectar la web con la nube
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

