/* ==========================================================================
   PASO 1: CONFIGURACIÓN DE LA CONEXIÓN A SUPABASE
   Usamos la misma base de datos del inventario.
   ========================================================================== */
const SUPABASE_UR = "https://jvffbhxsnlerrayaewpm.supabase.co";
const SUPA_ANON_KEY = "sb_publishable_2wFcBreVe81GVigRE_0LEw_yeCzu2kR";
const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_UR, SUPA_ANON_KEY) : null;

/* ==========================================================================
   PASO 2: NOTIFICACIONES VISUALES NEÓN
   ========================================================================== */
function mostrarNotificacion(mensaje, tipo = "success") {
    const notificacion = document.createElement("div");
    const colorFondo = tipo === "success"
        ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-300"
        : "bg-red-950/90 border-red-500/50 text-red-300";
    notificacion.className = `fixed bottom-5 left-5 right-5 md:left-auto md:max-w-md z-50 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur text-sm transition-all duration-300 ${colorFondo}`;
    notificacion.setAttribute("role", tipo === "success" ? "status" : "alert");
    // textContent muestra los datos como texto y evita interpretar código HTML.
    notificacion.textContent = mensaje;
    document.body.appendChild(notificacion);
    setTimeout(() => {
        notificacion.style.opacity = "0";
        setTimeout(() => notificacion.remove(), 300);
    }, 4000);
}

/* ==========================================================================
   PASO 3: MOSTRAR EL PERSONAL (Leer / Consultar)
   Traemos los registros desde Supabase y dibujamos la tabla.
   ========================================================================== */
function mostrarEstadoTabla(mensaje, esError = false) {
    const tableBody = document.getElementById("personalTableBody");
    const fila = document.createElement("tr");
    const celda = document.createElement("td");
    celda.colSpan = 5;
    celda.className = `py-6 text-center ${esError ? "text-red-400" : "text-slate-400"}`;
    celda.textContent = mensaje;
    fila.appendChild(celda);
    tableBody.replaceChildren(fila);
}

async function cargarPersonal() {
    mostrarEstadoTabla("Cargando personal desde Supabase...");
    const boton = document.getElementById("recargarPersonal");
    boton.disabled = true;
    try {
        if (!supabaseClient) throw new Error("No se pudo cargar Supabase. Recarga la página.");
        const { data: personal, error } = await supabaseClient
            .from("personal")
            .select("identidad, nombres, apellidos, genero, telefono, direccion")
            .order("apellidos", { ascending: true });
        if (error) throw error;
        document.getElementById("totalPersonal").textContent = `${personal.length} registros`;
        if (personal.length === 0) {
            mostrarEstadoTabla("No hay personal registrado.");
            return;
        }
        const tableBody = document.getElementById("personalTableBody");
        tableBody.replaceChildren();
        personal.forEach(persona => {
            const fila = document.createElement("tr");
            fila.className = "border-b border-slate-800/60 hover:bg-slate-800/30 transition";
            const valores = [persona.identidad, `${persona.nombres} ${persona.apellidos}`,
                persona.genero, persona.telefono, persona.direccion];
            // Nombres y apellidos se muestran juntos; la tabla tiene cinco columnas.
            valores.forEach(valor => {
                const celda = document.createElement("td");
                celda.className = "py-3 px-3 text-slate-200 break-words max-w-xs";
                celda.textContent = valor;
                fila.appendChild(celda);
            });
            tableBody.appendChild(fila);
        });
    } catch (error) {
        document.getElementById("totalPersonal").textContent = "Sin conexión";
        mostrarEstadoTabla("No se pudo cargar el personal. Pulsa Actualizar para reintentar.", true);
        mostrarNotificacion("Error al cargar: " + error.message, "error");
    } finally {
        boton.disabled = false;
    }
}

/* ==========================================================================
   PASO 4: REGISTRAR PERSONAL (Crear)
   La identidad se guarda como texto para conservar ceros iniciales.
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
    const formulario = document.getElementById("personalForm");
    formulario.addEventListener("submit", async evento => {
        evento.preventDefault();
        const boton = document.getElementById("guardarPersonal");
        if (boton.disabled) return;
        const persona = {};
        for (const campo of ["identidad", "nombres", "apellidos", "genero", "telefono", "direccion"]) {
            const input = document.getElementById(campo);
            persona[campo] = input.value.trim();
            if (!persona[campo]) {
                mostrarNotificacion("Completa todos los campos sin usar solamente espacios.", "error");
                input.focus();
                return;
            }
        }
        boton.disabled = true;
        boton.textContent = "Guardando...";
        try {
            if (!supabaseClient) throw new Error("No se pudo cargar Supabase. Recarga la página.");
            const { error } = await supabaseClient.from("personal").insert([persona]);
            if (error) throw error;
            formulario.reset();
            mostrarNotificacion("¡Personal registrado con éxito en la nube!");
            await cargarPersonal();
        } catch (error) {
            const mensaje = error.code === "23505"
                ? "Ya existe una persona registrada con esa identidad."
                : "Error al guardar: " + error.message;
            mostrarNotificacion(mensaje, "error");
        } finally {
            boton.disabled = false;
            boton.textContent = "Guardar Personal";
        }
    });

    // PASO 5: Carga inicial y actualización manual del listado.
    document.getElementById("recargarPersonal").addEventListener("click", cargarPersonal);
    cargarPersonal();
});
