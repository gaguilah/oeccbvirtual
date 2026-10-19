import { CASE_NUMBER_LENGTH, REALIZADO_DESPUES_DE_MIN } from '../../components/remates/constants'
import { CLOSE_AFTER_MINUTES, FIRST_HOUR, LAST_HOUR, timeLabel } from '../audiencias/data'
import { MAX_RANGE_MONTHS } from '../encuestas/period'
import { RESPONSE_MAX_CHARS } from '../pqrs/data'
import { RESPONSE_BUSINESS_DAYS } from '../pqrs/deadline'
import type { GuideContent, GuideSlug } from './types'

// Contenido de la Ayuda (docs/plan-ayuda.md), para funcionarios: lenguaje sencillo, sin nombres de
// tablas ni de código, el superadmin se llama "Administrador de Sistema" y los permisos se
// presentan como los de hoy (la tabla "Quién puede hacer qué" sale en vivo de la base). Las cifras
// que existen en el código se toman de él; las que solo viven en SQL o en Edge Functions se anotan.
// Si cambia una regla, actualizar también docs/modulos/.

const hour = (h: number) => timeLabel(`${String(h).padStart(2, '0')}:00`)
const minutes = (n: number) => (n === 60 ? '1 hora' : `${n} minutos`)
const number = (n: number) => n.toLocaleString('es-CO')

const HOURS = `${hour(FIRST_HOUR)} a ${hour(LAST_HOUR)}`
const REALIZE_AFTER = minutes(CLOSE_AFTER_MINUTES)
// Margen público de Audiencias y Avisos de Remate (list_public_hearings usa el mismo).
const PUBLIC_MARGIN = minutes(REALIZADO_DESPUES_DE_MIN)
const EXAMPLE_END = hour(10 + REALIZADO_DESPUES_DE_MIN / 60)

const rolesIntro = 'Lo que puede hacer cada rol en esta sección, tal como está configurado hoy:'

export const GUIDE_CONTENT: Record<GuideSlug, GuideContent> = {
  'mi-perfil': {
    summary: 'Su cuenta, el primer ingreso, su perfil y lo que ve en el dashboard.',
    sections: [
      {
        id: 'cuenta',
        title: 'Su cuenta',
        blocks: [
          {
            type: 'paragraph',
            text: 'Las cuentas las crea el Administrador de Sistema. No hay registro desde la página pública. Al crearla, el administrador le entrega una **contraseña temporal** por un canal seguro.',
          },
          {
            type: 'paragraph',
            text: 'Si olvida su contraseña, la puede recuperar usted mismo desde **Iniciar sesión** con **¿Olvidó su contraseña?** (vea las preguntas frecuentes).',
          },
        ],
      },
      {
        id: 'primer-ingreso',
        title: 'Primer ingreso',
        blocks: [
          {
            type: 'steps',
            items: [
              'Entre a **Iniciar sesión** con su correo y la contraseña temporal.',
              'El sistema lo lleva a **Mi perfil**. El menú queda bloqueado hasta terminar estos pasos; esta Ayuda sí se puede abrir.',
              'Revise su nombre y elija su **cargo** en la lista. Guárdelo.',
              'Cambie la contraseña: escriba la temporal como contraseña actual y luego la nueva dos veces.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Cuando termine, el menú se habilita y verá las secciones que le corresponden.',
          },
        ],
      },
      {
        id: 'perfil',
        title: 'Mi perfil',
        blocks: [
          { type: 'paragraph', text: 'Se abre con el botón **Mi perfil** de la barra superior.' },
          {
            type: 'list',
            items: [
              // Reglas de profile/schema.ts y de la restricción profiles_full_name_format.
              '**Nombre:** como quiere que aparezca en el sistema (de 3 a 120 caracteres, solo letras y separadores como espacio o guion).',
              '**Cargo:** se usa en los formatos de referencia cruzada de Audiencias. Manténgalo actualizado.',
              '**Correo:** no se puede cambiar desde aquí.',
              '**Contraseña:** pide la actual. La nueva debe tener al menos 8 caracteres y ser distinta de la actual.',
            ],
          },
        ],
      },
      {
        id: 'lo-que-ve',
        title: 'Lo que ve en el dashboard',
        blocks: [
          {
            type: 'paragraph',
            text: 'El menú muestra solo las secciones a las que su rol tiene acceso. Si pertenece a un juzgado, verá solo la información de su juzgado.',
          },
          {
            type: 'paragraph',
            text: 'Los permisos de cada rol no son fijos: se ajustan según lo que defina el Director de oficina o lo que se acuerde con los funcionarios. Por eso, de un día a otro puede ver opciones nuevas o dejar de ver algunas.',
          },
          {
            type: 'paragraph',
            text: 'Esta **Ayuda** muestra todas las guías a todos los usuarios, aunque hoy usted no use todas las secciones. El botón **Ayuda** de la barra superior abre la guía de la pantalla en la que usted está.',
          },
        ],
      },
      {
        id: 'cerrar-sesion',
        title: 'Cerrar sesión',
        blocks: [
          {
            type: 'paragraph',
            text: 'Use el botón **Cerrar sesión** de la barra superior. El sistema le pide confirmar con **¿Cerrar sesión?** para que no salga por error. Cierre la sesión siempre que use un equipo compartido.',
          },
        ],
      },
    ],
    faq: [
      {
        q: 'Olvidé mi contraseña.',
        // Vigencia (panel de Auth) y límite (MIN_INTERVAL_MS / DAILY_LIMIT en la Edge Function
        // password-reset): docs/modulos/mi-perfil.md.
        a: 'En **Iniciar sesión**, use **¿Olvidó su contraseña?**: escriba su correo y le llegará un enlace, válido por 1 hora y de un solo uso, para crear una contraseña nueva. Al guardarla se cierran las sesiones abiertas en otros equipos y le llega un correo de aviso. Si no recibe el enlace, revise el correo no deseado; puede pedir otro cada 5 minutos (hasta 5 al día) y solo vale el último. Si aun así no le llega, pídale al Administrador de Sistema que restablezca su contraseña.',
      },
      {
        q: 'Me llegó un correo de cambio de contraseña que yo no pedí.',
        a: 'Si es el aviso **Su contraseña se cambió** y usted no la cambió, avise de inmediato al Administrador de Sistema. Si es un enlace para crear una contraseña nueva que no pidió, ignórelo: su contraseña actual sigue funcionando.',
      },
      { q: 'No puedo cambiar la contraseña en el primer ingreso.', a: 'Primero elija y guarde su cargo.' },
      {
        q: 'Mi cargo no está en la lista.',
        a: 'Comuníquese con el Administrador de Sistema para que lo agregue.',
      },
      {
        q: 'Cambié de cargo. ¿Se corrigen los formatos anteriores?',
        a: 'No. Cada formato conserva el cargo que usted tenía cuando registró la grabación. Los nuevos usarán el cargo actualizado.',
      },
      {
        q: 'Entro y me dice que mi cuenta no tiene acceso.',
        a: 'Su cuenta no tiene un rol asignado o fue desactivada. Comuníquese con el Administrador de Sistema.',
      },
      {
        q: 'No veo una sección que necesito.',
        a: 'Su rol no la incluye en este momento. En la guía de cada sección, la tabla **Quién puede hacer qué** muestra qué rol la tiene. Si la necesita, coméntelo con el Director de oficina o el Administrador de Sistema.',
      },
    ],
  },

  audiencias: {
    summary:
      'Programar, cerrar y consultar las audiencias y diligencias, el formato de referencia cruzada y los correos automáticos.',
    sections: [
      {
        id: 'para-que',
        title: '¿Para qué sirve?',
        blocks: [
          {
            type: 'paragraph',
            text: 'En esta sección se programan las audiencias y diligencias de los juzgados, se registra si se realizaron o se cancelaron y se descarga el formato de referencia cruzada. Lo que se programa aparece también en la página pública de Audiencias y se avisa por correo a los funcionarios del juzgado.',
          },
        ],
      },
      {
        id: 'quien',
        title: 'Quién puede hacer qué',
        blocks: [{ type: 'paragraph', text: rolesIntro }, { type: 'roles' }],
      },
      {
        id: 'estados',
        title: 'Los estados de una audiencia',
        blocks: [
          {
            type: 'table',
            headers: ['Estado', 'Qué significa'],
            rows: [
              ['**Programada**', 'Está agendada y todavía no se ha registrado qué pasó.'],
              ['**Realizada**', 'Se llevó a cabo y tiene el enlace de la grabación.'],
              ['**Cancelada**', 'No se realizó.'],
            ],
          },
          {
            type: 'paragraph',
            text: 'Realizada y Cancelada son estados finales: después de cerrarla ya no se puede editar, salvo corregir el enlace de la grabación de una Realizada.',
          },
        ],
      },
      {
        id: 'programar',
        title: 'Programar una audiencia',
        blocks: [
          {
            type: 'paragraph',
            text: 'Use el botón **Programar audiencia** y complete juzgado, tipo, radicado, fecha, hora y, si aplica, el enlace de conexión.',
          },
          {
            type: 'list',
            items: [
              'Solo se puede programar en fechas futuras, de lunes a viernes y en días hábiles. Si elige un festivo o un día de cierre, el sistema le dice el motivo.',
              `La hora va de **${HOURS}**, en punto, y cuarto, y media o menos cuarto.`,
              'Si el juzgado ya tiene otra audiencia en esa misma hora, verá un aviso. Puede guardar igual.',
              'Si el tipo de audiencia es virtual y todavía no tiene el enlace de conexión, puede guardarla, pero **no se comunicará por correo** hasta que agregue el enlace. La audiencia mostrará "Sin enlace de conexión: no se comunicará".',
            ],
          },
        ],
      },
      {
        id: 'editar',
        title: 'Cambiar la fecha o los datos',
        blocks: [
          {
            type: 'paragraph',
            text: 'Mientras esté Programada, se puede editar cualquier dato desde el menú ⋮ de la audiencia. Si la audiencia se aplaza, **edite la fecha**: no la cancele.',
          },
        ],
      },
      {
        id: 'cerrar',
        title: 'Cerrar una audiencia',
        blocks: [
          {
            type: 'paragraph',
            text: 'Las audiencias Programadas cuya hora ya llegó aparecen en la pestaña **Por cerrar**. Se cierran desde el menú ⋮:',
          },
          {
            type: 'list',
            items: [
              `**Marcar realizada:** disponible **${REALIZE_AFTER} después** de la hora programada. Pide el enlace de la grabación.`,
              '**Marcar cancelada:** disponible **desde la hora programada**. Puede escribir el motivo en observaciones.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Mientras no se cierre, en la página pública seguirá apareciendo como pendiente (vea las preguntas frecuentes).',
          },
        ],
      },
      {
        id: 'eliminar',
        title: 'Eliminar una audiencia',
        blocks: [
          {
            type: 'paragraph',
            text: 'Eliminar es solo para corregir un error de registro. Se puede eliminar únicamente si la audiencia es futura, está Programada y no tiene enlace de conexión ni grabación. En cualquier otro caso, se cancela cuando llegue su hora. El menú ⋮ indica por qué no se puede eliminar.',
          },
        ],
      },
      {
        id: 'formato',
        title: 'Formato de referencia cruzada y expediente',
        blocks: [
          {
            type: 'paragraph',
            text: 'Cuando una audiencia está **Realizada** se puede descargar el formato de referencia cruzada (PDF) desde el detalle o desde el menú ⋮.',
          },
          {
            type: 'list',
            items: [
              'En "Elaborado por" y "Cargo" aparece quien registró la grabación, con el cargo que tenía en su perfil en ese momento. Por eso es importante tener el cargo actualizado en **Mi perfil**.',
              'Después de cargar el formato al expediente, active **Cargado al expediente** en el detalle de la audiencia. Las pendientes se ven con la etiqueta "Pendiente de cargar" y en el contador del Inicio.',
              'Si se corrige el enlace de la grabación, el formato cambia y la audiencia vuelve a "Pendiente de cargar": hay que descargarlo y cargarlo de nuevo.',
            ],
          },
        ],
      },
      {
        id: 'publico',
        title: 'Lo que ve el ciudadano en la página pública',
        blocks: [
          {
            type: 'table',
            headers: ['Situación', 'Pestaña', 'Etiqueta'],
            rows: [
              [`Antes de la hora y hasta ${PUBLIC_MARGIN} después, sin cerrar`, 'Próximas', 'Programada'],
              [`Más de ${PUBLIC_MARGIN} después de su hora y sin cerrar`, 'Anteriores', '**Por confirmar**'],
              ['Ya marcada Realizada o Cancelada', 'Anteriores', 'Realizada / Cancelada'],
            ],
          },
          {
            type: 'paragraph',
            text: 'El ciudadano ve fecha, hora, radicado, juzgado, tipo, estado y los enlaces de conexión y de grabación. **Nunca ve las observaciones.** La página muestra las audiencias desde tres meses atrás.',
          },
        ],
      },
      {
        id: 'correos',
        title: 'Correos automáticos',
        blocks: [
          {
            type: 'paragraph',
            text: 'Los reciben los funcionarios con acceso a Audiencias del juzgado y el correo institucional del juzgado.',
          },
          {
            type: 'list',
            // Horarios de las tareas de pg_cron y de hearings-mailer (docs/modulos/audiencias.md).
            items: [
              '**Listado de la semana:** el primer día hábil de cada semana a las 7:30 a. m., con todas las audiencias programadas de lunes a viernes.',
              '**Aviso de cambio:** si después de enviado el listado se agrega, cambia, mueve o elimina una audiencia de esa misma semana.',
              '**Recordatorio:** unos 15 minutos antes de cada audiencia.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Solo se comunican las audiencias Programadas que tienen enlace de conexión, o cuyo tipo no lo necesita (por ejemplo, las diligencias presenciales).',
          },
        ],
      },
      {
        id: 'remates',
        title: 'Avisos de remate',
        blocks: [
          {
            type: 'paragraph',
            text: 'Al crear un aviso de remate con fecha futura se puede marcar **Crear también la audiencia de remate**. Si después cambia la fecha, el juzgado o el radicado del aviso, la audiencia se actualiza sola mientras siga Programada. Si se elimina el aviso, la audiencia se elimina también cuando se puede; si no, queda con la marca "Aviso de remate eliminado".',
          },
        ],
      },
    ],
    faq: [
      {
        q: 'Son las 10:30 y la audiencia de las 10:00 sigue en "Próximas" en la página pública. ¿Es un error?',
        a: `No. En la página pública una audiencia sigue en Próximas durante ${PUBLIC_MARGIN} después de su inicio, porque puede estar en curso. Pasa a Anteriores apenas se marque Realizada o Cancelada, o sola después de ese tiempo (en el ejemplo, a las ${EXAMPLE_END}) con la etiqueta "Por confirmar".`,
      },
      {
        q: '¿Por qué en el dashboard ya aparece en "Por cerrar" y en la página pública no?',
        a: `El dashboard avisa en cuanto llega la hora, para que no se olvide cerrarla. La página pública espera ${PUBLIC_MARGIN} para no mostrar como pasada una audiencia que se está realizando.`,
      },
      {
        q: '¿Qué significa "Por confirmar" en la página pública?',
        a: `Que ya pasó más de ${PUBLIC_MARGIN} y todavía no se ha registrado si se realizó o se canceló. Se corrige cerrándola en el dashboard.`,
      },
      {
        q: 'No me deja marcar la audiencia como realizada.',
        a: `Esa opción se habilita ${REALIZE_AFTER} después de la hora programada. El menú ⋮ indica desde qué hora. Si no le aparece, su rol no incluye ese permiso.`,
      },
      {
        q: 'La audiencia no se hará. ¿La cancelo ya?',
        a: 'Si se va a reprogramar, edite la fecha. Si no tiene enlace de conexión ni grabación, se puede eliminar. Si no, la opción de cancelar se habilita cuando llega su hora.',
      },
      {
        q: 'No llegó el correo de una audiencia.',
        a: 'Revise que tenga el enlace de conexión, si su tipo lo necesita: sin enlace no se comunica. Los avisos de cambio solo se envían para audiencias de la semana en curso y después de que salió el listado semanal.',
      },
      {
        q: 'En el formato aparece otra persona o un cargo anterior.',
        a: 'El formato toma a quien registró o corrigió por última vez la grabación, con su cargo de ese momento. Mantenga su cargo al día en Mi perfil. Si un formato ya generado quedó con datos que no corresponden, comuníquese con el Administrador de Sistema.',
      },
    ],
  },

  'avisos-remates': {
    summary: 'Crear, publicar y consultar los avisos de remate que ve el ciudadano.',
    sections: [
      {
        id: 'para-que',
        title: '¿Para qué sirve?',
        blocks: [
          {
            type: 'paragraph',
            text: 'En esta sección se registran los avisos de remate de los juzgados para que el ciudadano los consulte en la página pública. Cada aviso tiene el radicado, la fecha y la hora del remate y el enlace al PDF del aviso publicado en el portal de publicaciones procesales de la Rama Judicial.',
          },
        ],
      },
      {
        id: 'quien',
        title: 'Quién puede hacer qué',
        blocks: [
          { type: 'paragraph', text: rolesIntro },
          { type: 'roles' },
          { type: 'paragraph', text: 'Los pasos de abajo aplican a quien tenga permiso para gestionar los avisos.' },
        ],
      },
      {
        id: 'antes',
        title: 'Antes de crear el aviso',
        blocks: [
          {
            type: 'paragraph',
            text: 'El sistema **no sube el PDF**: arma el enlace al documento del portal. Por eso, primero se publica el PDF en el portal de publicaciones procesales y después se crea el aviso aquí.',
          },
        ],
      },
      {
        id: 'crear',
        title: 'Crear un aviso',
        blocks: [
          {
            type: 'paragraph',
            text: `Use el botón **Crear aviso** y complete radicado (${CASE_NUMBER_LENGTH} dígitos; puede pegarlo con puntos o guiones), juzgado, fecha y hora.`,
          },
          {
            type: 'list',
            items: [
              'El formulario muestra cómo quedará el enlace del PDF. Use **Abrir** para comprobar que el documento ya está en el portal.',
              'Si usted puede publicar, la casilla **Publicado** viene marcada y el aviso aparece de inmediato en la página pública. Si no tiene ese permiso, el aviso se guarda **oculto** hasta que alguien con permiso lo publique.',
              `Si el remate es en una fecha futura, puede marcar **Crear también la audiencia de remate** para agendarla en Audiencias al mismo tiempo. Si la fecha u hora no sirven para una audiencia (por ejemplo, un festivo o fuera del horario de ${HOURS}), la casilla aparece desactivada con el motivo; el aviso se puede guardar igual.`,
            ],
          },
        ],
      },
      {
        id: 'acciones',
        title: 'Editar, publicar, ocultar o eliminar',
        blocks: [
          { type: 'paragraph', text: 'Desde el menú ⋮ de cada aviso:' },
          {
            type: 'list',
            items: [
              '**Editar:** cambia radicado, juzgado, fecha u hora. El enlace del PDF se vuelve a armar solo. Si el aviso tiene una audiencia de remate vinculada, también se mueve.',
              '**Publicar / Ocultar:** decide si el ciudadano lo ve. Ocultar no borra el aviso.',
              '**Eliminar:** lo borra definitivamente; no se puede deshacer. Si tenía audiencia vinculada, también se elimina cuando es posible; si no, la audiencia queda con la marca "Aviso de remate eliminado".',
            ],
          },
          { type: 'paragraph', text: 'En el dashboard los avisos solo dicen **Publicado** u **Oculto**.' },
        ],
      },
      {
        id: 'publico',
        title: 'Lo que ve el ciudadano',
        blocks: [
          {
            type: 'table',
            headers: ['Momento', 'Pestaña', 'Etiqueta'],
            rows: [
              [`Antes de la hora y hasta ${PUBLIC_MARGIN} después`, 'Próximos', 'Agendado'],
              [`Más de ${PUBLIC_MARGIN} después de la hora`, 'Pasados', 'Realizado'],
            ],
          },
          {
            type: 'paragraph',
            text: 'El ciudadano solo ve los avisos publicados. Puede filtrar por juzgado, buscar por radicado, ver el PDF y descargarlo.',
          },
        ],
      },
      {
        id: 'carpetas',
        title: 'Carpetas de publicación',
        blocks: [
          {
            type: 'paragraph',
            text: 'Las carpetas son los números del enlace del portal donde se publican los PDF. Cuando el portal cambia de carpeta, se agrega una nueva desde la fecha en que empieza a usarse; los avisos ya creados conservan su enlace.',
          },
        ],
      },
    ],
    faq: [
      {
        q: 'Creé un aviso y no aparece en la página pública.',
        a: 'Está oculto. Si usted no tiene permiso para publicar, pídale a quien lo tenga que lo publique.',
      },
      {
        q: 'El botón "Ver aviso" muestra un error o una página que no existe.',
        a: 'El PDF todavía no está en el portal, o se publicó con otro nombre. Revise que la fecha y la hora del aviso coincidan con las del documento publicado. Si el enlace sigue fallando, avise al Administrador de Sistema.',
      },
      {
        q: 'Ya pasó la hora del remate y el aviso sigue en "Próximos".',
        a: `Es normal: pasa a "Pasados" ${PUBLIC_MARGIN} después de la hora del remate.`,
      },
      {
        q: '¿Por qué en el dashboard no dice Agendado o Realizado?',
        a: 'Ese estado es para el ciudadano. En el dashboard lo importante es si el aviso está publicado u oculto.',
      },
      {
        q: 'No me deja guardar el cambio de fecha.',
        a: `El aviso tiene una audiencia de remate vinculada y la nueva fecha no sirve para una audiencia (fin de semana, festivo u hora fuera de ${HOURS}). El formulario indica el motivo.`,
      },
      {
        q: 'Me equivoqué al crear un aviso. ¿Lo elimino?',
        a: 'Si solo hay un dato errado, edítelo. Elimínelo únicamente si el aviso no debía existir.',
      },
    ],
  },

  pqrs: {
    summary: 'Estados, plazo y respuesta de las peticiones, quejas, reclamos, sugerencias y felicitaciones.',
    sections: [
      {
        id: 'para-que',
        title: '¿Para qué sirve?',
        blocks: [
          {
            type: 'paragraph',
            text: 'Aquí llegan las peticiones, quejas, reclamos, sugerencias y felicitaciones que los ciudadanos envían desde la página pública. Desde esta sección se revisan, se les da trámite y se responden por correo.',
          },
          { type: 'paragraph', text: 'Las PQRS son de la oficina, no de un juzgado.' },
        ],
      },
      {
        id: 'quien',
        title: 'Quién puede hacer qué',
        blocks: [{ type: 'paragraph', text: rolesIntro }, { type: 'roles' }],
      },
      {
        id: 'llegada',
        title: 'Cómo llega una PQRS',
        blocks: [
          {
            type: 'paragraph',
            text: 'El ciudadano llena el formulario en tres pasos: tipo, nombre y correo, y mensaje con la aceptación del tratamiento de datos. Al enviarla:',
          },
          {
            type: 'list',
            items: [
              'recibe un **radicado** (por ejemplo, PQRS-2026-000123) en pantalla y un correo de confirmación;',
              'la oficina recibe un aviso en su buzón;',
              'la PQRS aparece aquí como **Recibida**.',
            ],
          },
        ],
      },
      {
        id: 'estados',
        title: 'Los estados',
        blocks: [
          {
            type: 'table',
            headers: ['Estado', 'Qué significa'],
            rows: [
              ['**Recibida**', 'Llegó y nadie la ha tomado.'],
              ['**En trámite**', 'Alguien la está atendiendo.'],
              ['**Respondida**', 'Se envió la respuesta al ciudadano. Es definitiva.'],
              [
                '**Cerrada**',
                'Se cerró sin respuesta escrita, con un motivo (por ejemplo, una felicitación o un duplicado).',
              ],
            ],
          },
          {
            type: 'paragraph',
            text: 'Las PQRS Recibidas y En trámite son las **pendientes**: aparecen primero, de la más antigua a la más nueva.',
          },
        ],
      },
      {
        id: 'plazo',
        title: 'El plazo de respuesta',
        blocks: [
          {
            type: 'paragraph',
            text: `Cada PQRS pendiente tiene **${RESPONSE_BUSINESS_DAYS} días hábiles** para responderse, contados desde el día siguiente a su llegada. No cuentan sábados, domingos, festivos ni los días de cierre registrados en Días no hábiles.`,
          },
          {
            type: 'paragraph',
            text: 'La lista muestra cuántos días quedan, avisa cuando faltan 3 o menos, cuando vence hoy y cuando ya está **vencida**. El Inicio muestra cuántas pendientes y cuántas vencidas hay.',
          },
        ],
      },
      {
        id: 'responder',
        title: 'Responder una PQRS',
        blocks: [
          {
            type: 'paragraph',
            text: `Abra la PQRS y escriba la respuesta (hasta ${number(RESPONSE_MAX_CHARS)} caracteres). Antes de enviar puede ver cómo le llegará el correo al ciudadano.`,
          },
          {
            type: 'list',
            items: [
              'La respuesta se envía **una sola vez** y **no se puede modificar** después. Revísela bien antes de confirmar.',
              'El correo incluye el radicado, la respuesta y, debajo, la solicitud original.',
              'Si el correo no se pudo enviar, la respuesta queda guardada y aparece **Reenviar respuesta**.',
            ],
          },
        ],
      },
      {
        id: 'estado',
        title: 'Cambiar el estado',
        blocks: [
          { type: 'paragraph', text: 'Desde el menú ⋮:' },
          {
            type: 'list',
            items: [
              '**Marcar en trámite:** indica que alguien ya la está atendiendo.',
              '**Cerrar:** para las que no requieren respuesta escrita. Pide un motivo.',
              '**Reabrir:** devuelve una PQRS cerrada a En trámite.',
            ],
          },
          { type: 'paragraph', text: 'Una PQRS **Respondida** ya no cambia de estado.' },
        ],
      },
    ],
    faq: [
      {
        q: 'Reabrí una PQRS cerrada. ¿El plazo vuelve a empezar?',
        a: 'No. El plazo siempre se cuenta desde el día en que llegó.',
      },
      {
        q: 'El ciudadano dice que no le llegó la respuesta.',
        a: 'Abra la PQRS y revise el historial de correos. Si el envío falló o el ciudadano no lo encuentra, use **Reenviar respuesta**. Pídale también que revise la carpeta de correo no deseado.',
      },
      {
        q: 'Envié la respuesta con un error. ¿La puedo corregir?',
        a: 'No desde el sistema: la respuesta enviada es la oficial. Si hace falta una aclaración, envíela desde el buzón institucional de la oficina, citando el radicado.',
      },
      {
        q: '¿Por qué no puedo responder ni cambiar el estado?',
        a: 'Su rol no incluye esos permisos en este momento: la tabla **Quién puede hacer qué** muestra qué rol los tiene. Puede consultar las PQRS y avisar de las que están por vencer. Si su trabajo requiere más permisos, coméntelo con el Director de oficina.',
      },
      {
        q: 'El ciudadano respondió el correo de confirmación.',
        a: 'Ese buzón solo envía mensajes y no recibe respuestas. El correo le indica al ciudadano que use los canales de Contacto.',
      },
      {
        q: '¿Cuándo cierro una PQRS en lugar de responderla?',
        a: 'Cuando no requiere respuesta escrita: una felicitación, un duplicado de otra PQRS o un mensaje sin contenido. Escriba siempre el motivo.',
      },
      {
        q: 'El plazo no coincide con mis cuentas.',
        a: 'El sistema descuenta los días registrados en Días no hábiles. Si falta un festivo o un cierre, avise al Administrador de Sistema.',
      },
    ],
  },

  encuestas: {
    summary: 'Resultados de la encuesta de satisfacción y administración de las encuestas.',
    sections: [
      {
        id: 'para-que',
        title: '¿Para qué sirve?',
        blocks: [
          {
            type: 'paragraph',
            text: 'Aquí se consultan los resultados de la encuesta de satisfacción que los ciudadanos responden en la página pública, y se administran las encuestas.',
          },
        ],
      },
      {
        id: 'quien',
        title: 'Quién puede hacer qué',
        blocks: [{ type: 'paragraph', text: rolesIntro }, { type: 'roles' }],
      },
      {
        id: 'ciudadano',
        title: 'Cómo responde el ciudadano',
        blocks: [
          {
            type: 'paragraph',
            text: 'En la página pública aparece **una sola encuesta**: la que esté activa. El ciudadano responde una pregunta por pantalla, revisa sus respuestas al final y las envía. La encuesta es **anónima**: no se guarda quién respondió.',
          },
          { type: 'paragraph', text: 'Hay dos tipos de preguntas:' },
          {
            type: 'list',
            items: [
              '**Sí / no.**',
              '**Escala:** una calificación entre dos extremos, por ejemplo de 1 (Mala) a 5 (Excelente).',
            ],
          },
        ],
      },
      {
        id: 'resultados',
        title: 'Consultar los resultados',
        blocks: [
          { type: 'paragraph', text: 'Abra la encuesta desde la lista y elija el periodo:' },
          {
            type: 'list',
            items: [
              '**Mes:** por defecto, el mes actual.',
              `**Rango de meses:** hasta ${MAX_RANGE_MONTHS} meses.`,
              '**Año.**',
            ],
          },
          {
            type: 'paragraph',
            text: 'Verá el número de respuestas del periodo y un gráfico por pregunta: torta para las de sí / no y barras para las de escala, con su promedio. Cada gráfico tiene **Ver como tabla**.',
          },
          {
            type: 'paragraph',
            text: 'Con **Descargar CSV** obtiene los totales del periodo en un archivo que se abre en Excel.',
          },
          { type: 'paragraph', text: 'El Inicio muestra cuántas respuestas lleva la encuesta activa en el año.' },
        ],
      },
      {
        id: 'administrar',
        title: 'Administrar encuestas',
        blocks: [
          { type: 'paragraph', text: 'Para quien tenga permiso de gestionar encuestas:' },
          {
            type: 'list',
            items: [
              '**Crear:** título y preguntas (sí / no o escala, con sus etiquetas). Puede ordenarlas y verlas como las verá el ciudadano.',
              '**Activar:** la encuesta pasa a mostrarse en la página pública y reemplaza a la que estaba activa.',
              '**Editar una encuesta que ya tiene respuestas:** solo se pueden corregir textos (título, preguntas, ayudas y etiquetas). No se pueden agregar, quitar ni reordenar preguntas ni cambiar su tipo, para no alterar los resultados.',
              '**Duplicar:** crea una copia nueva, inactiva y sin respuestas. Es la forma de cambiar las preguntas de una encuesta que ya tiene respuestas: duplíquela, edite la copia y actívela.',
              '**Eliminar:** solo una encuesta sin respuestas y que no esté activa.',
            ],
          },
        ],
      },
    ],
    faq: [
      {
        q: 'La página pública dice que la encuesta no está disponible.',
        a: 'No hay ninguna encuesta activa. Quien gestiona las encuestas debe activar una.',
      },
      {
        q: 'Quiero agregar una pregunta, pero no me deja.',
        a: 'La encuesta ya tiene respuestas. Duplíquela, agregue la pregunta en la copia y active la copia. Los resultados anteriores siguen consultándose en la encuesta original.',
      },
      {
        q: 'Activé una encuesta nueva. ¿Se pierden los resultados de la anterior?',
        a: 'No. La anterior queda inactiva con todos sus resultados.',
      },
      { q: '¿Puedo saber quién respondió?', a: 'No. La encuesta es anónima.' },
      {
        q: 'Los resultados del mes no coinciden con lo que esperaba.',
        a: 'Revise el periodo elegido. Las fechas se cuentan en hora de Colombia.',
      },
    ],
  },

  administracion: {
    summary: 'Usuarios, roles, permisos y días no hábiles.',
    sections: [
      {
        id: 'quien',
        title: 'Quién puede hacer qué',
        blocks: [
          {
            type: 'paragraph',
            text: 'Estas secciones están en el menú bajo **Administración**. Desde **Roles** se decide qué puede hacer cada rol en todo el dashboard. Hoy están configuradas así:',
          },
          { type: 'roles' },
        ],
      },
      {
        id: 'usuarios',
        title: 'Usuarios',
        blocks: [
          {
            type: 'paragraph',
            text: 'Lista de las personas que pueden entrar al dashboard, con su rol, su dependencia (Juzgado 1, Juzgado 2 u Oficina) y su estado.',
          },
          {
            type: 'table',
            headers: ['Estado', 'Qué significa'],
            rows: [
              ['**Activo**', 'Puede entrar normalmente.'],
              ['**Contraseña temporal**', 'Aún no ha hecho su primer ingreso o tiene una contraseña restablecida.'],
              ['**Desactivado**', 'No puede iniciar sesión.'],
              ['**Sin rol**', 'Tiene cuenta pero no tiene rol: no ve ninguna sección.'],
            ],
          },
          { type: 'paragraph', text: 'Acciones del menú ⋮:' },
          {
            type: 'list',
            items: [
              '**Crear usuario:** nombre, correo, rol y, si el rol es de juzgado, el juzgado. El sistema genera una **contraseña temporal** que se muestra **una sola vez** arriba de la lista: cópiela y entréguela por un canal seguro. No se guarda en ningún lado.',
              '**Editar / Asignar rol:** cambia nombre, rol o juzgado.',
              '**Restablecer contraseña:** genera una nueva contraseña temporal. Quien olvida su contraseña puede recuperarla solo desde **Iniciar sesión**; esta opción queda para quien no recibe el enlace en su correo.',
              '**Desactivar / Reactivar:** desactivar impide iniciar sesión sin borrar la cuenta.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Su propia fila solo ofrece **Ir a Mi perfil**: nadie se edita ni se desactiva a sí mismo desde aquí.',
          },
          {
            type: 'paragraph',
            text: 'La lista se actualiza sola cada minuto; use **Actualizar** para ver de inmediato los cambios de otros.',
          },
        ],
      },
      {
        id: 'roles',
        title: 'Roles',
        blocks: [
          { type: 'paragraph', text: 'Un rol es un conjunto de permisos. Cada usuario tiene **un solo rol**.' },
          {
            type: 'list',
            items: [
              '**Alcance:** "Todos los juzgados" o "Solo el juzgado del usuario".',
              '**Permisos:** se marcan por sección (por ejemplo, ver, crear, editar o publicar avisos).',
              'El rol del **Administrador de Sistema** tiene todo y no se puede modificar.',
              'Un rol con usuarios asignados no se puede eliminar ni cambiar de alcance: primero se reasignan esos usuarios.',
            ],
          },
          {
            type: 'note',
            text: 'Los permisos no son fijos: se ajustan según lo que defina el Director de oficina o lo que se acuerde con los funcionarios. Cuando se acuerda un cambio, se aplica en **Roles** y rige desde que cada usuario recarga el dashboard. Las tablas **Quién puede hacer qué** de esta Ayuda se actualizan solas.',
          },
        ],
      },
      {
        id: 'permisos',
        title: 'Permisos',
        blocks: [
          {
            type: 'paragraph',
            text: 'Catálogo de todos los permisos, agrupados por sección, con los roles que tiene cada uno. Aquí solo se cambian el **nombre** y la **descripción** de cada permiso; ese nombre es el que aparece en las tablas de esta Ayuda. Los permisos no se crean desde esta pantalla: cada sección nueva trae los suyos.',
          },
        ],
      },
      {
        id: 'dias-no-habiles',
        title: 'Días no hábiles',
        blocks: [
          { type: 'paragraph', text: 'Calendario de festivos y cierres. Estos días no cuentan para:' },
          {
            type: 'list',
            items: [
              `el plazo de ${RESPONSE_BUSINESS_DAYS} días hábiles de las PQRS;`,
              'programar audiencias;',
              'el listado semanal de audiencias (si el lunes es festivo, sale el siguiente día hábil).',
            ],
          },
          { type: 'paragraph', text: 'Acciones:' },
          {
            type: 'list',
            items: [
              '**Agregar:** un día o un rango, con tipo (Festivo, Cierre u Otro) y motivo. Los sábados y domingos se omiten.',
              '**Cargar calendario del año:** propone los festivos de Colombia y los días de la Rama Judicial (lunes a miércoles santos, 17 de diciembre y la vacancia judicial). Revíselos y guárdelos. Los días ya registrados no se duplican.',
              '**Eliminar** desde el menú ⋮.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Agregar o eliminar un día corre automáticamente el plazo de las PQRS pendientes que lo incluyan.',
          },
        ],
      },
    ],
    faq: [
      {
        q: 'Creé un usuario y no copié la contraseña temporal.',
        a: 'Use **Restablecer contraseña** para generar otra.',
      },
      {
        q: 'Un usuario olvidó su contraseña.',
        a: 'Indíquele que use **¿Olvidó su contraseña?** en Iniciar sesión: le llegará un enlace a su correo. Si no le llega (revise que su cuenta esté activa y con rol), use **Restablecer contraseña** y entréguele la contraseña temporal.',
      },
      {
        q: 'Un usuario dice que no ve una sección.',
        a: 'Revise su rol en Usuarios y, en Roles, que ese rol tenga el permiso de ver esa sección. Si es de un juzgado, revise también que tenga el juzgado correcto.',
      },
      { q: 'Di un permiso y el usuario sigue sin verlo.', a: 'Pídale que recargue la página.' },
      {
        q: '¿Cuándo cargo el calendario del año siguiente?',
        a: 'En diciembre, para que los plazos y las audiencias de enero ya lo tengan en cuenta.',
      },
    ],
  },
}
