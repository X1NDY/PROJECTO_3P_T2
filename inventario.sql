-- Ejecuta este archivo en SQL Editor del mismo proyecto de Personal y Proveedores.
-- Esta tabla es independiente de public.productos: no modifica sus registros.
create table if not exists public.inventario (
    codigo serial primary key,
    nombre text not null check (length(trim(nombre)) > 0),
    cantidad integer not null default 0 check (cantidad >= 0),
    precio numeric(10,2) not null default 0.00 check (precio >= 0),
    creado_en timestamp with time zone not null default now()
);
