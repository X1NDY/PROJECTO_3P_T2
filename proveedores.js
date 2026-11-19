import { supabase } from "./conexion.js";

const formulario =
    document.getElementById("formProveedor");

const mensaje =
    document.getElementById("mensaje");

const tabla =
    document.getElementById("tablaProveedores");

const buscar =
    document.getElementById("buscar");

const btnGuardar =
    document.getElementById("btnGuardar");

let codigoEditar = null;
let proveedores = [];

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
// Obtener datos del formulario
function obtenerDatos() {
    return {
        empresa:
            document.getElementById("empresa").value.trim(),

        representante:
            document.getElementById("representante").value.trim(),

        telefono:
            document.getElementById("telefono").value.trim(),

        direccion_empresa:
            document.getElementById("direccion").value.trim(),

        email:
            document.getElementById("email").value.trim() || null
    };
}

// Guardar o actualizar proveedor
formulario.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (btnGuardar.disabled || !formulario.reportValidity()) return;

    const datos = obtenerDatos();
    if (!datos.empresa) {
        mostrarNotificacion("Ingresa el nombre de la empresa.", true);
        return;
    }

    btnGuardar.disabled = true;
    btnGuardar.textContent = "Procesando...";

    try {
        let resultado;

        if (codigoEditar === null) {

            resultado = await supabase
                .from("proveedores")
                .insert([datos]);

        } else {

            resultado = await supabase
                .from("proveedores")
                .update(datos)
                .eq("codigo", codigoEditar)
                .select("codigo");

        }

        if (resultado.error) {
            throw resultado.error;
        }

        if (codigoEditar !== null &&
            resultado.data.length === 0) {
            throw new Error(
                "No se actualizó ningún proveedor. " +
                "Verifica los permisos."
            );
        }

        const accion = codigoEditar === null
            ? "registrado"
            : "actualizado";

        limpiarFormulario();

        mostrarNotificacion(
            "✅ Proveedor " + accion + " correctamente."
        );

        await cargarProveedores();

    } catch (error) {

        mostrarNotificacion(
            error.code === "23505"
                ? "❌ Ya existe un proveedor con ese código u otro dato único."
                : "❌ Error: " + error.message, true
        );

    } finally {

        btnGuardar.disabled = false;

        btnGuardar.textContent =
            codigoEditar === null
            ? "💾 Guardar Proveedor"
            : "💾 Actualizar Proveedor";
    }
});

// Consultar proveedores
async function cargarProveedores() {

    const { data, error } = await supabase
        .from("proveedores")
        .select("codigo, empresa, representante, telefono, direccion_empresa, email")
        .order("codigo", { ascending: true });

    if (error) {
        mostrarNotificacion(
            "❌ Error al consultar: " + error.message,
            true
        );
        return;
    }

    proveedores = data || [];
    mostrarProveedores(proveedores);
}

// Mostrar proveedores en tabla
function mostrarProveedores(lista) {

    tabla.replaceChildren();

    if (lista.length === 0) {
        const fila = tabla.insertRow();
        const celda = fila.insertCell();

        celda.colSpan = 8;
        celda.className =
            "text-center text-slate-400";

        celda.textContent =
            "No hay proveedores registrados.";

    } else {

        lista.forEach(proveedor => {

            const fila = tabla.insertRow();

            const campos = [
                proveedor.codigo,
                proveedor.empresa,
                proveedor.representante,
                proveedor.telefono,
                proveedor.direccion_empresa,
                proveedor.email
            ];

            campos.forEach(valor => {
                const celda = fila.insertCell();
                celda.textContent = valor ?? "-";
            });

            const acciones = fila.insertCell();

            const btnEditar =
                document.createElement("button");

            btnEditar.textContent = "✏️ Editar";
            btnEditar.className =
                "bg-blue-600 hover:bg-blue-700 " +
                "px-3 py-2 rounded-lg mr-2 mb-1";

            btnEditar.addEventListener("click", () => {
                editarProveedor(proveedor.codigo);
            });

            const btnEliminar =
                document.createElement("button");

            btnEliminar.textContent = "🗑️ Eliminar";
            btnEliminar.className =
                "bg-red-600 hover:bg-red-700 " +
                "px-3 py-2 rounded-lg";

            btnEliminar.addEventListener("click", () => {
                eliminarProveedor(proveedor.codigo);
            });

            acciones.append(btnEditar, btnEliminar);
        });
    }

    document.getElementById(
        "totalProveedores"
    ).textContent =
        "Proveedores mostrados: " + lista.length;
}

// Editar proveedor
function editarProveedor(codigo) {

    const proveedor = proveedores.find(
        p => p.codigo === codigo
    );

    if (!proveedor) return;

    codigoEditar = codigo;

    document.getElementById("codigo").value =
        proveedor.codigo;
    document.getElementById("codigo").readOnly = true;

    document.getElementById("empresa").value =
        proveedor.empresa || "";

    document.getElementById("representante").value =
        proveedor.representante || "";

    document.getElementById("telefono").value =
        proveedor.telefono || "";

    document.getElementById("direccion").value =
        proveedor.direccion_empresa || "";

    document.getElementById("email").value =
        proveedor.email || "";

    document.getElementById(
        "tituloFormulario"
    ).textContent = "✏️ Editar Proveedor";

    btnGuardar.textContent =
        "💾 Actualizar Proveedor";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

// Eliminar proveedor
async function eliminarProveedor(codigo) {

    const confirmar = confirm(
        "¿Deseas eliminar el proveedor " +
        codigo + "?"
    );

    if (!confirmar) return;

    try {

        const { data, error } = await supabase
            .from("proveedores")
            .delete()
            .eq("codigo", codigo)
            .select("codigo");

        if (error) throw error;

        if (!data || data.length === 0) {
            throw new Error(
                "No se eliminó ningún registro. " +
                "Verifica los permisos."
            );
        }

        if (codigoEditar === codigo) {
            limpiarFormulario();
        }

        mostrarNotificacion(
            "✅ Proveedor eliminado correctamente."
        );

        await cargarProveedores();

    } catch (error) {

        mostrarNotificacion(
            "❌ Error: " + error.message, true
        );
    }
}

// Buscar proveedores
buscar.addEventListener("input", () => {

    const texto = buscar.value
        .toLowerCase()
        .trim();

    const filtrados = proveedores.filter(p => {

        return [
            p.codigo,
            p.empresa,
            p.representante,
            p.telefono,
            p.email
        ].some(valor =>
            String(valor ?? "")
                .toLowerCase()
                .includes(texto)
        );

    });

    mostrarProveedores(filtrados);
});

// Limpiar formulario
function limpiarFormulario() {

    formulario.reset();
    codigoEditar = null;

    document.getElementById("codigo").value = "";
    document.getElementById("codigo").readOnly = true;

    document.getElementById(
        "tituloFormulario"
    ).textContent = "➕ Registrar Proveedor";

    btnGuardar.textContent =
        "💾 Guardar Proveedor";
}

document.getElementById(
    "btnCancelar"
).addEventListener("click", () => {
    limpiarFormulario();
    mensaje.textContent = "";
});

// Cargar proveedores al abrir la página
cargarProveedores();
