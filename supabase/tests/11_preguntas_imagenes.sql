-- Preguntas frecuentes, fase 2: imágenes (migración 20261110140000_faq_images.sql).
begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

select tests.create_role('prueba_preguntas_ver', 'all', array['preguntas.ver']);
select tests.create_role('prueba_preguntas_gestion', 'all', array['preguntas.ver', 'preguntas.gestionar']);
select tests.create_user('lector@prueba.test', 'prueba_preguntas_ver');
select tests.create_user('gestor@prueba.test', 'prueba_preguntas_gestion');

insert into public.faq_sections (slug, title) values ('seccion-uno', 'Sección uno');
insert into public.faq_questions (section_id, question, answer, is_published, image_path, image_alt)
select id, '¿Pregunta con imagen?', 'Respuesta de prueba.', true,
       '0b6a5f3e-1c2d-4e5f-8a9b-0c1d2e3f4a5b.png', 'Captura de la consulta'
from public.faq_sections;

-- Bucket.
select results_eq(
  $$ select public, file_size_limit, allowed_mime_types from storage.buckets where id = 'faq-images' $$,
  $$ values (true, 2097152::bigint, array['image/png', 'image/jpeg', 'image/webp']) $$,
  'bucket público, hasta 2 MB, solo PNG, JPG y WebP'
);
select set_eq(
  $$ select policyname || '|' || cmd || '|' || array_to_string(roles, ',')
     from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname like 'faq_images_%' $$,
  array['faq_images_select|SELECT|authenticated', 'faq_images_insert|INSERT|authenticated',
        'faq_images_delete|DELETE|authenticated'],
  'el público no tiene políticas en el bucket (no lo lista); quien gestiona sube, ve y borra'
);

-- Reglas de las columnas.
select throws_ok(
  $$ update public.faq_questions set image_alt = null $$,
  '23514', null,
  'una imagen sin texto alternativo no se acepta'
);
select throws_ok(
  $$ update public.faq_questions set image_path = '../otro-bucket/archivo.png' $$,
  '23514', null,
  'el nombre del archivo es un UUID con extensión png, jpg o webp'
);
select throws_ok(
  $$ update public.faq_questions set image_alt = 'abc' $$,
  '23514', null,
  'el texto alternativo tiene al menos 5 caracteres'
);
select lives_ok(
  $$ update public.faq_questions set image_path = null, image_alt = null $$,
  'quitar la imagen deja las dos columnas vacías'
);
update public.faq_questions
set image_path = '0b6a5f3e-1c2d-4e5f-8a9b-0c1d2e3f4a5b.png', image_alt = 'Captura de la consulta';

-- Público.
select tests.login_as_anon();
select results_eq(
  $$ select image_path, image_alt from public.faq_questions where is_published $$,
  $$ values ('0b6a5f3e-1c2d-4e5f-8a9b-0c1d2e3f4a5b.png', 'Captura de la consulta') $$,
  'el público lee la imagen y su texto alternativo'
);
select is(
  (select count(*)::int from storage.objects where bucket_id = 'faq-images'),
  0,
  'el público no lista el bucket'
);

-- Subir archivos.
select tests.login_as('lector@prueba.test');
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('faq-images', 'lector.png') $$,
  '42501', null,
  'sin preguntas.gestionar no sube imágenes'
);
update public.faq_questions set image_alt = 'Otra descripción';
select is(
  (select image_alt from public.faq_questions),
  'Captura de la consulta',
  'sin preguntas.gestionar no cambia la imagen (el UPDATE no toca ninguna fila)'
);

select tests.login_as('gestor@prueba.test');
select lives_ok(
  $$ insert into storage.objects (bucket_id, name) values ('faq-images', 'gestor.png') $$,
  'con preguntas.gestionar sube imágenes'
);
select is(
  (select count(*)::int from storage.objects where bucket_id = 'faq-images'),
  1,
  'y las ve (la API de Storage lo necesita para borrar)'
);

select * from finish();
rollback;
