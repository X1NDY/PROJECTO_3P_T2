-- Ejecutar en SQL Editor del proyecto que contiene sesiones_usuarios.
-- Permite invalidar la sesión en Supabase al presionar Cerrar sesión.
create or replace function public.cerrar_sesion_usuario(p_token text)
returns void
language sql security definer
set search_path = public, extensions, pg_temp
as $$
    delete from public.sesiones_usuarios
    where token_hash = encode(digest(p_token, 'sha256'), 'hex');
$$;

revoke all on function public.cerrar_sesion_usuario(text) from public;
grant execute on function public.cerrar_sesion_usuario(text) to anon;
