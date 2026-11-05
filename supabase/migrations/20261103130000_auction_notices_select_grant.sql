-- Lectura de los avisos de remate (docs/plan-pruebas.md, Fase 4).
--
-- auction_notices se creó cuando "Automatically expose new tables" estaba activado: el SELECT de
-- anon y authenticated vino de ese interruptor, no de una migración. En producción existe; en una
-- base nueva (pruebas pgTAP) faltaba, y el sitio público no podría listar los avisos. Lo que cada
-- uno ve lo siguen decidiendo las políticas: el público solo los publicados, el dashboard según
-- remates.ver y su juzgado.
--
-- Idempotente: en producción no cambia nada.

grant select on table public.auction_notices to anon, authenticated;
