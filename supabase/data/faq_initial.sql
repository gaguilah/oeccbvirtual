-- =========================================================
-- Carga inicial de las preguntas frecuentes
-- =========================================================
-- Texto revisado en docs/plan-preguntas-frecuentes.md. Ejecutar una sola vez en el SQL Editor,
-- después de la migración 20261110120000_faq.sql. Es seguro repetirlo: no duplica secciones ni
-- preguntas (las compara por slug y por texto de la pregunta).
--
-- Todas las preguntas quedan OCULTAS: el director de oficina las revisa en el dashboard
-- (sobre todo cuentas y convenios) y las publica.
--
-- Formato de las respuestas: **negrita**, líneas que empiezan con "- " (lista) y una línea en
-- blanco entre párrafos.

begin;

insert into public.faq_sections (slug, title) values
  ('titulos', 'Títulos'),
  ('oficios', 'Oficios'),
  ('procesos', 'Procesos'),
  ('consignaciones', 'Consignaciones')
on conflict (slug) do nothing;

-- El trigger pone la posición en el orden de inserción (n).
insert into public.faq_questions (section_id, question, answer)
select s.id, q.question, q.answer
from (values
  (1, 'titulos', '¿Cómo sé si ya se elaboró un título en mi proceso?',
$t$Consulte su proceso en Consulta de Procesos de la Rama Judicial. Cuando el título está elaborado, aparece la actuación **"Elaboración de títulos"**.$t$),

  (2, 'titulos', '¿Cómo sé quién es el beneficiario del título?',
$t$En la anotación de la actuación "Elaboración de títulos" aparece el nombre del beneficiario, sea persona natural o jurídica.$t$),

  (3, 'titulos', '¿Cómo cobro un título?',
$t$El beneficiario debe acudir a cualquier oficina del **Banco Agrario de Colombia** en el país con estos documentos:

- **Persona natural:** documento de identidad.
- **Persona jurídica:** el representante legal, con su documento de identidad y el certificado de existencia y representación legal expedido por la Cámara de Comercio.$t$),

  (4, 'oficios', '¿Cómo sé si ya se elaboraron los oficios en mi proceso?',
$t$En Consulta de Procesos aparece la actuación **"Oficios librados"**.$t$),

  (5, 'oficios', '¿Cómo solicito que me envíen los oficios librados?',
$t$Envíe un correo a **ofejccbuc@cendoj.ramajudicial.gov.co** con el radicado completo (23 dígitos) del proceso.$t$),

  (6, 'oficios', '¿Cómo solicito los oficios de levantamiento de medidas cautelares o de adjudicación del remate?',
$t$Envíe un correo a **ofejccbuc@cendoj.ramajudicial.gov.co** con:

- el radicado completo (23 dígitos);
- el nombre completo y el número de identificación de quien retirará los oficios;
- si los retira otra persona, el poder o la autorización.

La oficina le asignará una **cita presencial** para el retiro.$t$),

  (7, 'procesos', '¿Cómo solicito la revisión de un proceso?',
$t$La revisión se pide por correo, sin necesidad de ir a la oficina. Envíe un correo a **ofejccbuc@cendoj.ramajudicial.gov.co** con el radicado completo (23 dígitos) y la calidad en la que actúa en el proceso (por ejemplo, demandante, demandado o apoderado).$t$),

  (8, 'procesos', '¿Cómo solicito el desarchivo de un proceso?',
$t$Envíe un correo a **ofejccbuc@cendoj.ramajudicial.gov.co** con:

- el radicado completo (23 dígitos);
- copia del recibo de pago del arancel judicial hecho en el Banco Agrario (la cuenta está en Consignaciones).$t$),

  (9, 'procesos', '¿Cómo solicito el desglose de documentos o copias auténticas?',
$t$Envíe un correo a **ofejccbuc@cendoj.ramajudicial.gov.co** con:

- el radicado completo (23 dígitos);
- el nombre completo y el número de identificación de quien retirará los documentos;
- copia del recibo de pago del arancel judicial hecho en el Banco Agrario;
- copia de los documentos que desea desglosar o autenticar;
- si quien retira no es una de las partes (demandante o demandado) ni su apoderado, el poder o la autorización.

La oficina le asignará una **cita presencial** para el retiro.$t$),

  (10, 'consignaciones', '¿En qué cuenta consigno posturas de remate y embargos?',
$t$- **Cuenta de depósitos judiciales:** 680012031800
- **Referencia:** radicado completo (23 dígitos)$t$),

  (11, 'consignaciones', '¿En qué cuenta consigno el arancel judicial?',
$t$- **Cuenta corriente:** 3-0820-000755-4
- **Convenio:** 14975$t$),

  (12, 'consignaciones', '¿En qué cuenta consigno el impuesto de remate del 5 %?',
$t$- **Cuenta corriente:** 3-0820-000755-4
- **Convenio:** 13477$t$),

  (13, 'consignaciones', '¿Cómo pago la retención en la fuente del 1 % (DIAN)?',
$t$Con el **Formulario 490** de la DIAN (Recibo Oficial de Pago de Impuestos Nacionales).$t$)
) as q (n, section_slug, question, answer)
join public.faq_sections s on s.slug = q.section_slug
where not exists (
  select 1 from public.faq_questions x where x.section_id = s.id and x.question = q.question
)
order by q.n;

commit;
