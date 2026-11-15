import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = "https://nakggxqpmnyiufhtwscn.supabase.co/rest/v1/";
const supabaseKey = "sb_publishable_jdbt3wTQ1HiNcYjDcYzerQ_xLmvNN9P";

export const supabase = createClient(supabaseUrl, supabaseKey);

async function probarConexion() {
  const { data, error } = await supabase
    .from("productos")
    .select("*");

  if (error) {
    console.error("Error al consultar Supabase:", error.message);
    return;
  }

  console.table(data);
}

probarConexion();