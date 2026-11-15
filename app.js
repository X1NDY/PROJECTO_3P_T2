import { supabase } from "./conexion.js";

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