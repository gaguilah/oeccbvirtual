// Tutoriales de /tutoriales. El orden de la lista es el orden en que se muestran
// y el que siguen los botones Anterior / Siguiente.

export type TutorialStep = {
  title?: string
  // Sin numeración ("1.1."): el componente numera los pasos.
  text: string
  // Enlace externo; se muestra como botón que abre en una pestaña nueva.
  link?: { href: string; label: string }
  // Captura de apoyo. `src` es una ruta de public/, p. ej. tutorialImage('estados', 'estadosprincipal.svg').
  image?: { src: string; alt: string }
}

export type Tutorial = {
  // Parte final de la URL: /tutoriales/<slug>. Debe ser única.
  slug: string
  title: string
  // Resumen corto que se muestra en la tarjeta del listado y bajo el título.
  description: string
  // true mientras el contenido sea de prueba: la página muestra un aviso.
  draft?: boolean
  // Slugs de los tutoriales que conviene leer antes ("Antes de empezar").
  prerequisites?: string[]
  // Aclaración opcional bajo la lista de requisitos.
  prerequisitesNote?: string
  // Párrafo opcional antes de los pasos.
  intro?: string
  // Retroalimentación al terminar ("¡Felicidades!").
  summary: string
  // Slug del tutorial recomendado a continuación.
  next?: string
  steps: TutorialStep[]
}

export const TUTORIALS_PATH = '/tutoriales'

// Las capturas viven en public/img/tutoriales/<slug>/.
export function tutorialImage(slug: string, file: string) {
  return `/img/tutoriales/${slug}/${file}`
}

export const tutorials: Tutorial[] = [
  {
    slug: 'publicaciones-procesales',
    title: 'Publicaciones Procesales',
    description: 'Aprenda a encontrar las publicaciones procesales de los juzgados.',
    summary: 'De esta forma ha aprendido a buscar las publicaciones procesales realizadas por la OECCB.',
    steps: [
      {
        text: 'Desde su navegador preferido ingrese a la página de la Rama Judicial.',
        link: { href: 'https://www.ramajudicial.gov.co/', label: 'www.ramajudicial.gov.co' },
        image: {
          src: tutorialImage('publicaciones-procesales', 'ramajudicialprincipal.svg'),
          alt: 'Página principal de la Rama Judicial',
        },
      },
      {
        text: 'Busque la opción Publicaciones procesales o ingrese directamente al portal. Recuerde agregarlo a favoritos para futuras consultas.',
        link: {
          href: 'https://publicacionesprocesales.ramajudicial.gov.co/',
          label: 'publicacionesprocesales.ramajudicial.gov.co',
        },
        image: {
          src: tutorialImage('publicaciones-procesales', 'ramajudicialpublicaciones.svg'),
          alt: 'Opción Publicaciones procesales en la página de la Rama Judicial',
        },
      },
      {
        text: 'Diríjase a la sección de filtros, dé clic en el campo Despacho y en la casilla de búsqueda digite: Juzgado 001 de Ejecución Civil del Circuito de Bucaramanga o Juzgado 002 de Ejecución Civil del Circuito de Bucaramanga.',
        image: {
          src: tutorialImage('publicaciones-procesales', 'ramajudicialjuzgadotexto.svg'),
          alt: 'Campo Despacho con el nombre del juzgado escrito en la casilla de búsqueda',
        },
      },
      {
        text: 'La página hace un autocompletado del nombre del despacho. Dé clic cuando encuentre el despacho judicial que desea ver, como se muestra a continuación:',
        image: {
          src: tutorialImage('publicaciones-procesales', 'ramajudicialjuzgado.svg'),
          alt: 'Lista de autocompletado con el despacho judicial',
        },
      },
      {
        text: 'Observe que la sección de filtros mantiene el nombre del despacho judicial seleccionado. En la sección principal, donde antes se mostraba un ícono de satélite, ahora se muestran las publicaciones procesales en orden de fecha, de la más reciente a la más antigua, como se muestra a continuación:',
        image: {
          src: tutorialImage('publicaciones-procesales', 'ramajudicialjuzgadoresultado.svg'),
          alt: 'Publicaciones procesales del despacho ordenadas por fecha',
        },
      },
      {
        text: 'Puede hacer un filtro adicional con las etiquetas resaltadas en color gris, por ejemplo: Edictos. Como se observa en la siguiente imagen, el filtro seleccionado queda resaltado en color azul y solo se muestran las publicaciones asociadas a él. Puede hacerlo con cualquier etiqueta que desee.',
        image: {
          src: tutorialImage('publicaciones-procesales', 'ramajudicialjuzgadofiltros.svg'),
          alt: 'Filtro Edictos seleccionado, resaltado en azul',
        },
      },
    ],
  },
  {
    slug: 'estados',
    title: 'Consulta de Estados',
    description: 'Aprenda a consultar los estados publicados por la oficina y los autos de cada expediente.',
    prerequisites: ['publicaciones-procesales'],
    summary: 'De esta forma ha aprendido a buscar y abrir los estados publicados por la OECCB.',
    steps: [
      {
        text: 'Como se explicó en el paso 6 del tutorial Publicaciones Procesales, puede filtrar las publicaciones por etiqueta. Para ver los estados, dé clic en la etiqueta Notificaciones por Estados; la página mostrará los resultados de la fecha más reciente a la más antigua. La OECCB usa un nombre estándar para los títulos: [ESTADOS] [NÚMERO DEL ESTADO] [FECHA DE PUBLICACIÓN] [JUZGADO], como se muestra en la siguiente imagen: ESTADOS 126 23-07-2024 J1.',
        image: {
          src: tutorialImage('estados', 'estadosprincipal.svg'),
          alt: 'Publicaciones filtradas por la etiqueta Notificaciones por Estados',
        },
      },
      {
        text: 'Para ver el contenido de la publicación, dé clic en el botón VER DETALLE. Allí se mostrarán los datos del estado, como el número, la fecha y el documento en formato PDF, como se muestra a continuación:',
        image: {
          src: tutorialImage('estados', 'estadosdetalle.svg'),
          alt: 'Detalle de un estado con su número, fecha y documento PDF',
        },
      },
      {
        text: 'Dé clic en el nombre del documento para desplegar el listado de expedientes. Se mostrará algo similar a la siguiente imagen:',
        image: {
          src: tutorialImage('estados', 'estadoslistado.svg'),
          alt: 'Listado de expedientes incluidos en el estado',
        },
      },
      {
        text: 'Para ver el auto asociado a un expediente del listado, dé clic en el ícono de color rojo y podrá visualizarlo:',
        image: {
          src: tutorialImage('estados', 'estadoscontenido.svg'),
          alt: 'Auto del expediente abierto desde el listado del estado',
        },
      },
    ],
  },
  {
    slug: 'traslados',
    title: 'Consulta de Traslados',
    description: 'Aprenda a consultar los traslados publicados por la oficina y el documento de cada expediente.',
    prerequisites: ['publicaciones-procesales'],
    summary: 'De esta forma ha aprendido a buscar y abrir los traslados publicados por la OECCB.',
    steps: [
      {
        text: 'Como se explicó en el paso 6 del tutorial Publicaciones Procesales, puede filtrar las publicaciones por etiqueta. Para ver los traslados, dé clic en la etiqueta Traslados especiales y Ordinarios; la página mostrará los resultados de la fecha más reciente a la más antigua. La OECCB usa un nombre estándar para los títulos: [TRASLADOS] [NÚMERO DEL TRASLADO] [FECHA DE PUBLICACIÓN] [JUZGADO], como se muestra en la siguiente imagen: TRASLADOS 120 23-07-2024 J1.',
        image: {
          src: tutorialImage('traslados', 'trasladosprincipal.svg'),
          alt: 'Publicaciones filtradas por la etiqueta Traslados especiales y Ordinarios',
        },
      },
      {
        text: 'Para ver el contenido de la publicación, dé clic en el botón VER DETALLE. Allí se mostrarán los datos del traslado, como el número, la fecha y el documento en formato PDF, como se muestra a continuación:',
        image: {
          src: tutorialImage('traslados', 'trasladosdetalle.svg'),
          alt: 'Detalle de un traslado con su número, fecha y documento PDF',
        },
      },
      {
        text: 'Dé clic en el nombre del documento para desplegar el listado de expedientes. Se mostrará algo similar a la siguiente imagen:',
        image: {
          src: tutorialImage('traslados', 'trasladoslistado.svg'),
          alt: 'Listado de expedientes incluidos en el traslado',
        },
      },
      {
        text: 'Para ver el traslado asociado a un expediente del listado, dé clic en el ícono de color rojo y podrá visualizarlo:',
        image: {
          src: tutorialImage('traslados', 'trasladoscontenido.svg'),
          alt: 'Documento del traslado abierto desde el listado',
        },
      },
    ],
  },
  {
    slug: 'audiencias-remate',
    title: 'Audiencias de Remate',
    description: 'Aprenda a consultar las audiencias de remate programadas y su enlace de conexión.',
    prerequisites: ['publicaciones-procesales'],
    summary: 'De esta forma ha aprendido a buscar y abrir la información de las audiencias de remate publicadas por la OECCB.',
    next: 'realizacion-audiencias',
    steps: [
      {
        text: 'Como se explicó en el paso 6 del tutorial Publicaciones Procesales, puede filtrar las publicaciones por etiqueta. Para ver las audiencias de remate, dé clic en la etiqueta Remates; la página mostrará los resultados de la fecha más reciente a la más antigua. La OECCB usa un nombre estándar para los títulos: [REMATES] [FECHA DE REALIZACIÓN], como se muestra en la siguiente imagen: Remates 22 de julio a 26 de julio.',
        image: {
          src: tutorialImage('audiencias-remate', 'rematesprincipal.svg'),
          alt: 'Publicaciones filtradas por la etiqueta Remates',
        },
      },
      {
        text: 'Para ver el contenido de la publicación, dé clic en el botón VER DETALLE. Allí se mostrará una tabla con la información de cada remate en 4 columnas: Fecha, Hora, Radicado y Link de conexión a la audiencia.',
        image: {
          src: tutorialImage('audiencias-remate', 'rematesdetalle.svg'),
          alt: 'Tabla de remates con fecha, hora, radicado y enlace de conexión',
        },
      },
    ],
  },
  {
    slug: 'otras-audiencias',
    title: 'Avisos (otras audiencias)',
    description: 'Aprenda a consultar los avisos de audiencias distintas a las de remate.',
    prerequisites: ['publicaciones-procesales'],
    summary: 'De esta forma ha aprendido a buscar y abrir la información de otras audiencias publicadas por la OECCB.',
    next: 'realizacion-audiencias',
    steps: [
      {
        text: 'Como se explicó en el paso 6 del tutorial Publicaciones Procesales, puede filtrar las publicaciones por etiqueta. Para ver las audiencias diferentes a las de remate (otras audiencias), dé clic en la etiqueta Avisos; la página mostrará los resultados de la fecha más reciente a la más antigua. La OECCB usa un nombre estándar para los títulos: [AUDIENCIA DE TEMA] [FECHA DE REALIZACIÓN], como se muestra en la siguiente imagen: Audiencia de Incidente de Oposición 09-07-2024.',
        image: {
          src: tutorialImage('otras-audiencias', 'audienciasprincipal.svg'),
          alt: 'Publicaciones filtradas por la etiqueta Avisos',
        },
      },
      {
        text: 'Para ver el contenido de la publicación, dé clic en el botón VER DETALLE. Allí se mostrará una tabla con la información de cada audiencia en 4 columnas: Fecha, Hora, Radicado y Link de conexión a la audiencia.',
        image: {
          src: tutorialImage('otras-audiencias', 'audienciasdetalle.svg'),
          alt: 'Tabla de audiencias con fecha, hora, radicado y enlace de conexión',
        },
      },
    ],
  },
  {
    slug: 'realizacion-audiencias',
    title: 'Realización de Audiencias',
    description: 'Conozca cómo instalar Microsoft Teams y conectarse a una audiencia virtual.',
    prerequisites: ['publicaciones-procesales', 'audiencias-remate', 'otras-audiencias'],
    prerequisitesNote: 'De Audiencias de Remate y Avisos (otras audiencias), lea el que corresponda a su audiencia.',
    intro:
      'De acuerdo con la Circular PCSJC24-10, emitida el 15 de marzo de 2024, la plataforma para el servicio de audiencias virtuales es Microsoft Teams Premium. Por lo tanto, se sugiere que instale Microsoft Teams en su dispositivo.',
    summary: 'De esta forma ha aprendido a descargar Microsoft Teams y a ingresar a las audiencias publicadas por la OECCB.',
    steps: [
      {
        text: 'Visite el sitio oficial de Microsoft Teams.',
        link: {
          href: 'https://www.microsoft.com/es-co/microsoft-teams/download-app',
          label: 'Descargar Microsoft Teams',
        },
        image: {
          src: tutorialImage('realizacion-audiencias', 'audienciasteams.svg'),
          alt: 'Página de descarga de Microsoft Teams',
        },
      },
      {
        text: 'Haga clic en el botón “Descargar Teams” (se recomienda “Teams para el trabajo o el ámbito educativo”) y siga los pasos de instalación para completar la descarga e instalación en su computadora.',
        image: {
          src: tutorialImage('realizacion-audiencias', 'audienciasdescarga.svg'),
          alt: 'Botón Descargar Teams en el sitio de Microsoft',
        },
      },
      {
        text: 'Si va a usar un celular o tableta, acceda a la tienda de aplicaciones de su dispositivo (Google Play Store para Android o App Store para iOS). Digite “Microsoft Teams” en la barra de búsqueda y, una vez encontrada, siga las instrucciones para descargar e instalar la aplicación.',
        image: {
          src: tutorialImage('realizacion-audiencias', 'audienciasmovil.svg'),
          alt: 'Microsoft Teams en la tienda de aplicaciones del celular',
        },
      },
      {
        text: 'Como se explicó en el tutorial Audiencias de Remate, la OECCB usa un nombre estándar para los títulos: [REMATES] [FECHA DE REALIZACIÓN], como se muestra en la siguiente imagen: Remates 22 de julio a 26 de julio.',
        image: {
          src: tutorialImage('realizacion-audiencias', 'audienciasdetalle.svg'),
          alt: 'Tabla de audiencias con el enlace de conexión',
        },
      },
      {
        text: 'Para ingresar a la audiencia de remate que le interesa, basta con dar clic en Ingresar. Si instaló correctamente Microsoft Teams, en el cuadro de diálogo que se muestra a continuación seleccione Abrir Microsoft Teams.',
        image: {
          src: tutorialImage('realizacion-audiencias', 'audienciaspermiso.svg'),
          alt: 'Cuadro de diálogo del navegador para abrir Microsoft Teams',
        },
      },
      {
        text: 'Si no instaló Microsoft Teams, dé clic en el botón Continuar en el navegador (opción resaltada con color violeta).',
        image: {
          src: tutorialImage('realizacion-audiencias', 'audienciaswebmodo.svg'),
          alt: 'Opción Continuar en el navegador resaltada en violeta',
        },
      },
      {
        text: 'Active la cámara y el audio en las opciones correspondientes y, una vez hecho, dé clic en Unirte ahora.',
        image: {
          src: tutorialImage('realizacion-audiencias', 'audienciasactivaropciones.svg'),
          alt: 'Opciones de cámara y audio antes de unirse a la audiencia',
        },
      },
    ],
  },
]

export function tutorialPath(slug: string) {
  return `${TUTORIALS_PATH}/${slug}`
}

export function findTutorial(slug: string) {
  return tutorials.find((tutorial) => tutorial.slug === slug)
}

export function findTutorialIndex(slug: string | undefined) {
  return tutorials.findIndex((tutorial) => tutorial.slug === slug)
}
