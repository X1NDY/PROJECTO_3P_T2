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

function mostrarNotificacion(mensaje, tipo = "success") {
    const aviso = document.createElement("div");
    aviso.className = `fixed bottom-5 left-5 right-5 md:left-auto md:max-w-md z-50 px-4 py-3 rounded-xl border shadow-2xl ${tipo === "success" ? "bg-emerald-950 text-emerald-300 border-emerald-500" : "bg-red-950 text-red-300 border-red-500"}`;
    aviso.setAttribute("role", tipo === "success" ? "status" : "alert");
    aviso.textContent = mensaje;
    document.body.appendChild(aviso);
    setTimeout(() => aviso.remove(), 4000);
}

function mostrarEstado(mensaje) {
    const fila = document.createElement("tr");
    const celda = document.createElement("td");
    celda.colSpan = 4;
    celda.className = "py-4 text-center text-slate-400";
    celda.textContent = mensaje;
    fila.appendChild(celda);
    document.getElementById("productTableBody").replaceChildren(fila);
}

async function cargarInventario() {
    mostrarEstado("Cargando inventario...");
    try {
        if (!supabaseClient) throw new Error("No se pudo cargar Supabase. Recarga la página.");
        const { data, error } = await supabaseClient.from("productos").select("*").order("id", { ascending: false });
        if (error) throw error;
        if (!data || data.length === 0) {
            mostrarEstado("No hay productos registrados.");
            return;
        }
        const tabla = document.getElementById("productTableBody");
        tabla.replaceChildren();
        data.forEach(producto => {
            const fila = document.createElement("tr");
            fila.className = "border-b border-slate-800/60 hover:bg-slate-800/30";
            for (const valor of [producto.nombre, producto.cantidad, `L${Number(producto.precio).toFixed(2)}`]) {
                const celda = document.createElement("td");
                celda.className = "py-3 px-2 text-slate-200 break-words";
                celda.textContent = valor;
                fila.appendChild(celda);
            }
            const acciones = document.createElement("td");
            acciones.className = "py-3 px-2 text-center space-x-2";
            for (const [texto, accion] of [
                ["Editar", () => prepararEdicion(producto)],
                ["Eliminar", () => eliminarProducto(producto.id)]
            ]) {
                const boton = document.createElement("button");
                boton.type = "button";
                boton.textContent = texto;
                boton.className = "text-xs text-sky-300 border border-sky-500/30 px-2 py-1 rounded";
                boton.addEventListener("click", async () => {
                    if (guardando) return;
                    boton.disabled = true;
                    try { await accion(); } finally { boton.disabled = false; }
                });
                acciones.appendChild(boton);
            }
            fila.appendChild(acciones);
            tabla.appendChild(fila);
        });
    } catch (error) {
        mostrarEstado("No se pudo cargar el inventario. Recarga la página para reintentar.");
        mostrarNotificacion(error.message, "error");
    }
}

function cancelarEdicion() {
    idProductoEditando = null;
    formulario.reset();
    botonGuardar.textContent = "Guardar Producto";
    botonCancelar.hidden = true;
}

function prepararEdicion(producto) {
    idProductoEditando = producto.id;
    for (const campo of ["nombre", "cantidad", "precio"]) {
        document.getElementById(campo).value = producto[campo];
    }
    botonGuardar.textContent = "Actualizar Producto";
    botonCancelar.hidden = false;
    document.getElementById("nombre").focus();
    formulario.scrollIntoView({ behavior: "smooth", block: "start" });
}

formulario.addEventListener("submit", async evento => {
    evento.preventDefault();
    if (guardando || !formulario.reportValidity()) return;
    const nombre = document.getElementById("nombre").value.trim();
    const cantidad = Number(document.getElementById("cantidad").value);
    const precio = Number(document.getElementById("precio").value);
    if (!nombre || !Number.isSafeInteger(cantidad) || cantidad < 0 || !Number.isFinite(precio) || precio < 0) {
        mostrarNotificacion("Ingresa un nombre, una cantidad entera y un precio no negativo.", "error");
        return;
    }
    guardando = true;
    botonGuardar.disabled = true;
    botonCancelar.disabled = true;
    botonGuardar.textContent = "Guardando...";
    try {
        if (!supabaseClient) throw new Error("No se pudo cargar Supabase. Recarga la página.");
        const producto = { nombre, cantidad, precio };
        const consulta = idProductoEditando === null
            ? supabaseClient.from("productos").insert([producto])
            : supabaseClient.from("productos").update(producto).eq("id", idProductoEditando);
        const { error } = await consulta;
        if (error) throw error;
        cancelarEdicion();
        mostrarNotificacion("Producto guardado correctamente.");
        await cargarInventario();
    } catch (error) {
        mostrarNotificacion("Error al guardar: " + error.message, "error");
    } finally {
        guardando = false;
        botonGuardar.disabled = false;
        botonCancelar.disabled = false;
        botonGuardar.textContent = idProductoEditando === null ? "Guardar Producto" : "Actualizar Producto";
    }
});

async function eliminarProducto(id) {
    if (!confirm("¿Deseas eliminar este producto?")) return;
    try {
        const { error } = await supabaseClient.from("productos").delete().eq("id", id);
        if (error) throw error;
        if (idProductoEditando === id) cancelarEdicion();
        mostrarNotificacion("Producto eliminado correctamente.");
        await cargarInventario();
    } catch (error) {
        mostrarNotificacion("Error al eliminar: " + error.message, "error");
    }
}

botonCancelar.addEventListener("click", cancelarEdicion);
cargarInventario();
probarConexion();