(() => {
    document.documentElement.style.visibility = "hidden";
    let cerrandoSesion = false;
    const crearCliente = () => window.supabase.createClient(
        "https://nakggxqpmnyiufhtwscn.supabase.co",
        "sb_publishable_jdbt3wTQ1HiNcYjDcYzerQ_xLmvNN9P"
    );
    const irAlLogin = () => {
        localStorage.removeItem("sesion_usuarios");
        sessionStorage.removeItem("sesion_usuarios");
        window.location.replace("login.html");
    };
    async function validarSesion() {
        if (cerrandoSesion) return;
        try {
            const token = sessionStorage.getItem("sesion_usuarios")
                || localStorage.getItem("sesion_usuarios");
            if (!token) return irAlLogin();
            const cliente = crearCliente();
            const { data, error } = await cliente.rpc("validar_sesion_usuario", {
                p_token: token
            });
            if (error || data !== true) return irAlLogin();
            if (!cerrandoSesion) document.documentElement.style.visibility = "visible";
        } catch (error) {
            console.error("No se pudo validar la sesión:", error);
            irAlLogin();
        }
    }
    document.addEventListener("DOMContentLoaded", () => {
        const boton = document.getElementById("cerrarSesion");
        if (!boton) return;
        boton.addEventListener("click", async () => {
            if (cerrandoSesion) return;
            cerrandoSesion = true;
            boton.disabled = true;
            boton.textContent = "Cerrando sesión...";
            document.documentElement.style.visibility = "hidden";
            const tokens = new Set([
                sessionStorage.getItem("sesion_usuarios"),
                localStorage.getItem("sesion_usuarios")
            ].filter(Boolean));
            // Borrar ambos almacenamientos, incluso si falla la conexión.
            sessionStorage.removeItem("sesion_usuarios");
            localStorage.removeItem("sesion_usuarios");
            try {
                if (tokens.size) {
                    const cliente = crearCliente();
                    await Promise.race([
                        Promise.all([...tokens].map(p_token =>
                            cliente.rpc("cerrar_sesion_usuario", { p_token })
                        )),
                        new Promise(resolve => setTimeout(resolve, 5000))
                    ]);
                }
            } catch (error) {
                console.error("No se pudo revocar la sesión remota:", error);
            } finally {
                irAlLogin();
            }
        });
    });
    validarSesion();
    window.addEventListener("pageshow", evento => {
        if (evento.persisted) {
            document.documentElement.style.visibility = "hidden";
            validarSesion();
        }
    });
})();
