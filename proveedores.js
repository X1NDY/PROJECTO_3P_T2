
/* ==========================================================================
   PASO 2: FUNCIÓN AUXILIAR PARA NOTIFICACIONES VISUALES NEÓN
   Crea alertas flotantes modernas en lugar del aburrido "localhost dice..."
   ========================================================================== */
function mostrarNotificacion(mensaje, tipo = "success") {
    const notificacion = document.createElement("div");
    
    // Asignamos colores según el tipo (éxito verde o error rojo)
    const colorFondo = tipo === "success" 
        ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-300" 
        : "bg-red-950/90 border-red-500/50 text-red-300";
    
    notificacion.className = `fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur text-sm font-medium transition-all duration-300 ${colorFondo}`;
    notificacion.innerHTML = `<span>${tipo === "success" ? "✅" : "⚠️"}</span> ${mensaje}`;
    
    document.body.appendChild(notificacion);

    // Se desvanece y desaparece automáticamente a los 3 segundos
    setTimeout(() => {
        notificacion.style.opacity = "0";
        setTimeout(() => notificacion.remove(), 300);
    }, 3000);
}

/* ==========================================================================
   PASO 3: MOSTRAR EL INVENTARIO (Función Leer / Consultar)
   Trae los datos desde la nube de Supabase y los dibuja en la tabla HTML.
   ========================================================================== */
async function cargarInventario() {
    const tableBody = document.getElementById("productTableBody");
    if (!tableBody) return; // Si no estamos en la página de inventario, se detiene aquí

    // Mensaje temporal de carga
    tableBody.innerHTML = `<tr><td colspan="4" class="py-4 text-center text-slate-500">Cargando datos desde la nube Supabase...</td></tr>`;

    // Consultamos la tabla 'productos' en Supabase ordenados por ID descendiente
    const { data: productos, error } = await supabaseClient
        .from('productos')
        .select('*')
        .order('id', { ascending: false });

    if (error) {
        console.error("Error al cargar:", error);
        tableBody.innerHTML = `<tr><td colspan="4" class="py-4 text-center text-red-400">Error al cargar los datos de Inventario.</td></tr>`;
        return;
    }

    if (!productos || productos.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" class="py-4 text-center text-slate-500">No hay productos registrados.</td></tr>`;
        return;
    }

    tableBody.innerHTML = ""; // Limpiamos la tabla antes de rellenar

    productos.forEach(producto => {
        const fila = document.createElement("tr");
        fila.className = "border-b border-slate-800/60 hover:bg-slate-800/30 transition"; 
        
        fila.innerHTML = `
            <td class="py-3 px-2 font-medium text-slate-200">${producto.nombre}</td>
            <td class="py-3 px-2 font-medium text-slate-300">${producto.cantidad}</td>
            <td class="py-3 px-2 font-medium text-sky-400">L${Number(producto.precio).toFixed(2)}</td>
            <td class="py-3 px-2 text-center space-x-2">
                <!-- Botón Editar -->
                <button onclick="prepararEdicion(${producto.id}, '${producto.nombre}', ${producto.cantidad}, ${producto.precio})" 
                        class="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-1 rounded hover:bg-amber-500/20 transition">
                    Editar
                </button>
                <!-- Botón Eliminar -->
                <button onclick="eliminarProducto(${producto.id})" 
                        class="text-xs bg-red-500/10 text-red-400 border border-red-500/30 px-2 py-1 rounded hover:bg-red-500/20 transition">
                    Eliminar
                </button>
            </td>
        `;
        tableBody.appendChild(fila);
    });
}

/* ==========================================================================
   PASO 4: GUARDAR O ACTUALIZAR PRODUCTOS (Crear / Modificar)
   Maneja el evento submit del formulario de registro.
   ========================================================================== */
const formulario = document.getElementById("productForm");

if (formulario) {
    formulario.addEventListener("submit", async (evento) => {
        evento.preventDefault(); // Evita que la página se recargue por defecto

        const nombreIngresado = document.getElementById("nombre").value;
        const cantidadIngresada = document.getElementById("cantidad").value;
        const precioIngresado = document.getElementById("precio").value;

        if (idProductoEditando === null) {
            // --- MODO CREAR (Nuevo producto) ---
            const { error } = await supabaseClient
                .from('productos')
                .insert([{
                    nombre: nombreIngresado,
                    cantidad: parseInt(cantidadIngresada),
                    precio: parseFloat(precioIngresado)
                }]);

            if (error) {
                mostrarNotificacion("Error al guardar: " + error.message, "error");
                console.error(error);
            } else {
                mostrarNotificacion("¡Producto guardado con éxito en la nube!", "success");
                formulario.reset();
                cargarInventario(); 
            }
        } else {
            // --- MODO ACTUALIZAR (Modificar producto existente) ---
            const { error } = await supabaseClient
                .from('productos')
                .update({
                    nombre: nombreIngresado,
                    cantidad: parseInt(cantidadIngresada),
                    precio: parseFloat(precioIngresado)
                })
                .eq('id', idProductoEditando);

            if (error) {
                mostrarNotificacion("Error al actualizar: " + error.message, "error");
            } else {
                mostrarNotificacion("¡Producto actualizado con éxito!", "success");
                formulario.reset();
                idProductoEditando = null;
                
                // Regresamos el texto original del botón
                document.querySelector("#productForm button[type='submit']").textContent = "Guardar Producto";
                cargarInventario();
            }
        }
    });
}

/* ==========================================================================
   PASO 5: ELIMINAR UN PRODUCTO (Borrar)
   ========================================================================== */
async function eliminarProducto(id) {
    if (confirm("¿Estás seguro de que deseas eliminar este producto?")) {
        const { error } = await supabaseClient
            .from('productos')
            .delete()
            .eq('id', id);

        if (error) {
            mostrarNotificacion("Error al eliminar: " + error.message, "error");
        } else {
            mostrarNotificacion("¡Producto eliminado correctamente!", "success");
            cargarInventario();
        }
    }
}

/* ==========================================================================
   PASO 6: PREPARAR EDICIÓN
   Carga los datos del producto seleccionado de vuelta en las cajas del formulario.
   ========================================================================== */
function prepararEdicion(id, nombre, cantidad, precio) {
    idProductoEditando = id;

    document.getElementById("nombre").value = nombre;
    document.getElementById("cantidad").value = cantidad;
    document.getElementById("precio").value = precio;

    const botonSubmit = document.querySelector("#productForm button[type='submit']");
    botonSubmit.textContent = "Actualizar Producto";
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ==========================================================================
   PASO 7: EJECUCION AUTOMATICA AL CARGAR LA PAGINA
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
    // Si la tabla existe en la página actual, cargamos los datos automáticamente
    if (document.getElementById("productTableBody")) {
        cargarInventario();
    }
});