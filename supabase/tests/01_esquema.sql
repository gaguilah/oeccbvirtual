-- Grants, funciones, políticas y triggers (docs/plan-pruebas.md, Fase 4).
--
-- Lo esperado es una foto de producción del 2026-11-03, después de la limpieza de
-- 20261103120000_security_cleanup.sql (docs/plan-seguridad-supabase.md, Fase 1). Así esta prueba
-- comprueba dos cosas: que las migraciones recrean la misma base que producción, y que ninguna
-- migración nueva da permisos de más sin que se note.
--
-- Si una migración cambia a propósito un grant, una función, una política o un trigger, se
-- actualiza aquí en el mismo commit.
begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

-- Grants de tabla de anon y authenticated (tabla rol privilegio).
select set_eq(
  $$
    select c.relname || ' ' || pg_get_userbyid(a.grantee) || ' ' || a.privilege_type
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public'
    cross join lateral aclexplode(c.relacl) a
    where c.relkind in ('r', 'v', 'p')
      and pg_get_userbyid(a.grantee) in ('anon', 'authenticated')
  $$,
  $$
    values
      ('auction_notices anon SELECT'),
      ('execution_courts anon SELECT'),
      ('hearing_statuses anon SELECT'),
      ('hearing_types anon SELECT'),
      ('survey_questions anon SELECT'),
      ('surveys anon SELECT'),
      ('auction_notices authenticated DELETE'),
      ('auction_notices authenticated SELECT'),
      ('customer_requests authenticated SELECT'),
      ('eps_entities authenticated SELECT'),
      ('execution_courts authenticated SELECT'),
      ('hearing_statuses authenticated SELECT'),
      ('hearing_types authenticated DELETE'),
      ('hearing_types authenticated SELECT'),
      ('hearings authenticated DELETE'),
      ('hearings authenticated SELECT'),
      ('job_positions authenticated SELECT'),
      ('non_business_days authenticated DELETE'),
      ('non_business_days authenticated SELECT'),
      ('pdf_folders authenticated DELETE'),
      ('pdf_folders authenticated SELECT'),
      ('permissions authenticated SELECT'),
      ('profile_personal_info authenticated SELECT'),
      ('profiles authenticated SELECT'),
      ('role_permissions authenticated DELETE'),
      ('role_permissions authenticated INSERT'),
      ('role_permissions authenticated SELECT'),
      ('roles authenticated DELETE'),
      ('roles authenticated SELECT'),
      ('survey_questions authenticated DELETE'),
      ('survey_questions authenticated SELECT'),
      ('surveys authenticated DELETE'),
      ('surveys authenticated SELECT')
  $$,
  'anon y authenticated tienen en cada tabla solo los grants de producción'
);

select is_empty(
  $$
    select c.relname || ' ' || pg_get_userbyid(a.grantee) || ' ' || a.privilege_type
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public'
    cross join lateral aclexplode(c.relacl) a
    where pg_get_userbyid(a.grantee) in ('anon', 'authenticated')
      and a.privilege_type in ('TRUNCATE', 'REFERENCES', 'TRIGGER', 'MAINTAIN')
  $$,
  'ninguna tabla da TRUNCATE, REFERENCES, TRIGGER ni MAINTAIN a anon o authenticated'
);

select is_empty(
  $$
    select c.relname || ' ' || pg_get_userbyid(a.grantee)
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public'
    cross join lateral aclexplode(c.relacl) a
    where c.relkind = 'S' and pg_get_userbyid(a.grantee) in ('anon', 'authenticated')
  $$,
  'ninguna secuencia da permisos a anon o authenticated'
);

-- Grants de columna (tabla rol privilegio columnas).
select set_eq(
  $$
    select c.relname || ' ' || pg_get_userbyid(a.grantee) || ' ' || a.privilege_type || ' '
      || string_agg(att.attname::text, ',' order by att.attname::text collate "C")
    from pg_attribute att
    join pg_class c on c.oid = att.attrelid
    join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public'
    cross join lateral aclexplode(att.attacl) a
    where att.attnum > 0 and not att.attisdropped
      and pg_get_userbyid(a.grantee) in ('anon', 'authenticated')
    group by c.relname, a.grantee, a.privilege_type
  $$,
  $$
    values
      ('auction_notices authenticated INSERT case_number,court,is_published,pdf_url,scheduled_at'),
      ('auction_notices authenticated UPDATE case_number,court,is_published,pdf_url,scheduled_at'),
      ('hearing_types authenticated INSERT description,is_active,requires_link'),
      ('hearing_types authenticated UPDATE description,is_active,requires_link'),
      ('hearings authenticated INSERT case_number,connection_url,court_id,hearing_type_id,notes,scheduled_at'),
      ('hearings authenticated UPDATE case_number,connection_url,court_id,filed_at,hearing_type_id,notes,recording_url,scheduled_at,status_id'),
      ('non_business_days authenticated INSERT day,kind,reason'),
      ('pdf_folders authenticated INSERT folder_id,group_id,valid_from'),
      ('permissions authenticated UPDATE description,name'),
      ('profile_personal_info authenticated INSERT emergency_name,emergency_phone,emergency_relationship,eps_id,mobile_phone,personal_email,residence_address,user_id'),
      ('profile_personal_info authenticated UPDATE emergency_name,emergency_phone,emergency_relationship,eps_id,mobile_phone,personal_email,residence_address'),
      ('profiles authenticated UPDATE full_name,position_id'),
      ('roles authenticated INSERT code,description,name,scope'),
      ('roles authenticated UPDATE description,name,scope'),
      ('survey_questions authenticated INSERT code,help_text,id,is_required,max_label,min_label,position,scale_max,scale_min,survey_id,text,type'),
      ('survey_questions authenticated UPDATE help_text,max_label,min_label,text'),
      ('surveys authenticated INSERT code,title'),
      ('surveys authenticated UPDATE is_active,title')
  $$,
  'los grants de columna son los de producción (nadie escribe role_id, court, active ni must_change_password)'
);

select is_empty(
  $$ select relname from pg_class c join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public'
     where c.relkind = 'r' and not c.relrowsecurity $$,
  'todas las tablas de public tienen RLS'
);

-- Funciones.
select is_empty(
  $$ select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace and n.nspname = 'public'
     where not coalesce('search_path=""' = any (p.proconfig), false) $$,
  'todas las funciones de public tienen search_path vacío'
);

select set_eq(
  $$ select p.proname::text from pg_proc p join pg_namespace n on n.oid = p.pronamespace and n.nspname = 'public'
     where p.prosecdef $$,
  array[
    'auction_notice_audit', 'auction_notices_sync_hearing', 'business_days_between', 'complete_password_change',
    'get_user_personal_info', 'handle_new_user', 'has_permission', 'hearing_audit', 'hearing_in_current_list',
    'hearing_non_business_days', 'hearing_recipients', 'hearing_schedule_error', 'hearing_snapshot',
    'hearings_enqueue_change', 'hearings_filed_rules', 'hearings_recording_author', 'is_business_day',
    'link_hearing_to_notice', 'list_public_hearings', 'list_roles', 'list_surveys', 'list_users', 'pqrs_due_date',
    'pqrs_summary', 'profiles_keep_last_superadmin', 'request_audit', 'request_emails', 'set_request_status',
    'survey_has_responses', 'survey_stats', 'survey_summary'
  ],
  'las funciones security definer son las de producción'
);

-- Quién ejecuta cada función: anon solo list_public_hearings; authenticated solo las RPC del
-- dashboard (nunca las de triggers, submit_survey_response ni las de los correos).
select set_eq(
  $$ select p.proname || ' ' || r.rolname
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace and n.nspname = 'public'
     cross join (values ('anon'), ('authenticated')) r(rolname)
     where has_function_privilege(r.rolname, p.oid, 'execute') $$,
  $$
    select f || ' authenticated' from unnest(array[
      'auction_notice_audit', 'business_days_between', 'business_days_left', 'complete_password_change',
      'create_auction_notice_with_hearing', 'due_date', 'get_my_access', 'get_user_personal_info', 'has_permission',
      'hearing_audit', 'hearing_non_business_days', 'hearing_schedule_error', 'is_business_day',
      'link_hearing_to_notice', 'list_public_hearings', 'list_roles', 'list_surveys', 'list_users', 'pqrs_due_date',
      'pqrs_summary', 'request_audit', 'request_emails', 'save_role', 'save_survey', 'set_active_survey',
      'set_request_status', 'survey_has_responses', 'survey_stats', 'survey_summary'
    ]) f
    union all
    select 'list_public_hearings anon'
  $$,
  'anon y authenticated ejecutan solo las funciones de producción'
);

-- Políticas (tabla|nombre|comando|roles).
select set_eq(
  $$ select tablename || '|' || policyname || '|' || cmd || '|' || array_to_string(roles, ',')
     from pg_policies where schemaname = 'public' $$,
  array[
    'auction_notices|Avisos de remate publicados visibles públicamente|SELECT|anon,authenticated',
    'auction_notices|auction_notices_delete|DELETE|authenticated',
    'auction_notices|auction_notices_insert|INSERT|authenticated',
    'auction_notices|auction_notices_select_admin|SELECT|authenticated',
    'auction_notices|auction_notices_update|UPDATE|authenticated',
    'customer_requests|customer_requests_select|SELECT|authenticated',
    'eps_entities|eps_entities_select|SELECT|authenticated',
    'execution_courts|execution_courts_select|SELECT|anon,authenticated',
    'hearing_statuses|hearing_statuses_select|SELECT|anon,authenticated',
    'hearing_types|hearing_types_delete|DELETE|authenticated',
    'hearing_types|hearing_types_insert|INSERT|authenticated',
    'hearing_types|hearing_types_select|SELECT|anon,authenticated',
    'hearing_types|hearing_types_update|UPDATE|authenticated',
    'hearings|hearings_delete|DELETE|authenticated',
    'hearings|hearings_insert|INSERT|authenticated',
    'hearings|hearings_select|SELECT|authenticated',
    'hearings|hearings_update|UPDATE|authenticated',
    'job_positions|job_positions_select|SELECT|authenticated',
    'non_business_days|non_business_days_delete|DELETE|authenticated',
    'non_business_days|non_business_days_insert|INSERT|authenticated',
    'non_business_days|non_business_days_select|SELECT|authenticated',
    'pdf_folders|pdf_folders_delete|DELETE|authenticated',
    'pdf_folders|pdf_folders_insert|INSERT|authenticated',
    'pdf_folders|pdf_folders_select|SELECT|authenticated',
    'permissions|permissions_select|SELECT|authenticated',
    'permissions|permissions_update|UPDATE|authenticated',
    'profile_personal_info|profile_personal_info_insert_own|INSERT|authenticated',
    'profile_personal_info|profile_personal_info_select_own|SELECT|authenticated',
    'profile_personal_info|profile_personal_info_update_own|UPDATE|authenticated',
    'profiles|profiles_select_own|SELECT|authenticated',
    'profiles|profiles_update_own|UPDATE|authenticated',
    'role_permissions|role_permissions_delete|DELETE|authenticated',
    'role_permissions|role_permissions_insert|INSERT|authenticated',
    'role_permissions|role_permissions_select|SELECT|authenticated',
    'roles|roles_delete|DELETE|authenticated',
    'roles|roles_insert|INSERT|authenticated',
    'roles|roles_select|SELECT|authenticated',
    'roles|roles_update|UPDATE|authenticated',
    'survey_questions|Preguntas de encuestas activas visibles públicamente|SELECT|anon,authenticated',
    'survey_questions|survey_questions_delete|DELETE|authenticated',
    'survey_questions|survey_questions_insert|INSERT|authenticated',
    'survey_questions|survey_questions_select_dashboard|SELECT|authenticated',
    'survey_questions|survey_questions_update|UPDATE|authenticated',
    'surveys|Encuestas activas visibles públicamente|SELECT|anon,authenticated',
    'surveys|surveys_delete|DELETE|authenticated',
    'surveys|surveys_insert|INSERT|authenticated',
    'surveys|surveys_select_dashboard|SELECT|authenticated',
    'surveys|surveys_update|UPDATE|authenticated'
  ],
  'las políticas RLS son las de producción'
);

-- Triggers de public y el de auth.users que crea el perfil.
select set_eq(
  $$ select c.relname || '|' || t.tgname
     from pg_trigger t join pg_class c on c.oid = t.tgrelid join pg_namespace n on n.oid = c.relnamespace
     where not t.tgisinternal and (n.nspname = 'public' or t.tgname = 'on_auth_user_created') $$,
  array[
    'auction_notices|auction_notices_authorize', 'auction_notices|auction_notices_before_write',
    'auction_notices|auction_notices_sync_hearing', 'auction_notices|auction_notices_sync_hearing_delete',
    'customer_requests|customer_requests_assign_number', 'hearings|hearings_enqueue_change',
    'hearings|hearings_filed_rules', 'hearings|hearings_recording_author', 'hearings|hearings_reset_reminder',
    'hearings|hearings_rules', 'permissions|permissions_set_updated_at',
    'profile_personal_info|profile_personal_info_section_dates',
    'profile_personal_info|profile_personal_info_set_updated_at', 'profiles|profiles_check_court',
    'profiles|profiles_keep_last_superadmin', 'profiles|profiles_set_updated_at',
    'role_permissions|role_permissions_protect', 'roles|roles_protect', 'roles|roles_set_updated_at',
    'survey_questions|survey_questions_guard', 'users|on_auth_user_created'
  ],
  'los triggers son los de producción'
);

select * from finish();
rollback;
