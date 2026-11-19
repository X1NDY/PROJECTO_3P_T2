import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Conexión de datos compartida por Personal y Proveedores.
const SUPABASE_URL = "https://nakggxqpmnyiufhtwscn.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_jdbt3wTQ1HiNcYjDcYzerQ_xLmvNN9P";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
