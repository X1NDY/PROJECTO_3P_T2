(() => {
    // Usar el mismo proyecto de autenticación que login.html.
    document.documentElement.style.visibility = "hidden";

    const irAlLogin = () => window.location.replace("login.html");

    async function validarSesion() {
        try {
            const cliente = window.supabase.createClient(
                "https://tabxpcvknbhzrcfxviol.supabase.co",
                "sb_publishable__-EQTX6HhRPdmydpAjfIQg_plxACJ3x"
            );

            cliente.auth.onAuthStateChange((evento, sesion) => {
                if (evento === "SIGNED_OUT" || (evento === "TOKEN_REFRESHED" && !sesion)) {
                    document.documentElement.style.visibility = "hidden";
                    irAlLogin();
                }
            });

            const { data, error } = await cliente.auth.getSession();
            if (error || !data.session) {
                irAlLogin();
                return;
            }

            document.documentElement.style.visibility = "visible";
        } catch (error) {
            console.error("No se pudo validar la sesión:", error);
            irAlLogin();
        }
    }

    validarSesion();
})();
