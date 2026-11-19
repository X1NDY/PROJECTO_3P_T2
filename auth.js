(() => {
    document.documentElement.style.visibility = "hidden";
    const irAlLogin = () => {
        localStorage.removeItem("sesion_usuarios");
        sessionStorage.removeItem("sesion_usuarios");
        window.location.replace("login.html");
    };
    async function validarSesion() {
        try {
            const token = sessionStorage.getItem("sesion_usuarios")
                || localStorage.getItem("sesion_usuarios");
            if (!token) return irAlLogin();
            const cliente = window.supabase.createClient(
                "https://nakggxqpmnyiufhtwscn.supabase.co",
                "sb_publishable_jdbt3wTQ1HiNcYjDcYzerQ_xLmvNN9P"
            );
            const { data, error } = await cliente.rpc("validar_sesion_usuario", {
                p_token: token
            });
            if (error || data !== true) return irAlLogin();
            document.documentElement.style.visibility = "visible";
        } catch (error) {
            console.error("No se pudo validar la sesión:", error);
            irAlLogin();
        }
    }
    validarSesion();
    window.addEventListener("pageshow", evento => {
        if (evento.persisted) {
            document.documentElement.style.visibility = "hidden";
            validarSesion();
        }
    });
})();
