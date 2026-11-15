
import { createClient } from
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// Credenciales de tu proyecto Supabase
const supabaseUrl = "https://nakggxqpmnyiufhtwscn.supabase.co";
const supabaseKey = "sb_publishable_jdbt3wTQ1HiNcYjDcYzerQ_xLmvNN9P";

// Crear la conexión
export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);

console.log("Cliente de Supabase inicializado");
