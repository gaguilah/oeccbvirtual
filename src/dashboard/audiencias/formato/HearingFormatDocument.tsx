import type { ReactNode } from 'react'
import { Document, Image, Link, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { HearingFormatData } from './data'
import logo from './logo-rama-judicial.jpg'

// Formato "Referencia cruzada" de CENDOJ para una audiencia realizada, en papel oficio. La fuente
// Roboto se registra en render.ts antes de generar el PDF.
const BORDER = '1pt solid #000'

const styles = StyleSheet.create({
  page: { paddingTop: 40, paddingBottom: 60, paddingHorizontal: 40, fontSize: 10, fontFamily: 'Roboto' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    border: BORDER,
    padding: 10,
    marginBottom: 5,
  },
  logo: { width: '35%', objectFit: 'contain' },
  headerText: { width: '65%', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 10, fontWeight: 700 },
  subtitle: { fontSize: 8, marginTop: 4 },
  block: {
    fontSize: 11,
    fontWeight: 700,
    textAlign: 'center',
    backgroundColor: '#e5e7eb',
    border: BORDER,
    borderBottom: 'none',
    paddingVertical: 10,
    paddingHorizontal: 5,
    marginTop: 5,
  },
  section: { border: BORDER, borderBottom: 'none' },
  row: { flexDirection: 'row' },
  label: {
    width: '35%',
    fontSize: 8,
    fontWeight: 700,
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderRight: BORDER,
    borderBottom: BORDER,
  },
  value: { width: '65%', paddingVertical: 10, paddingHorizontal: 5, borderBottom: BORDER },
  link: { color: '#1d4ed8' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, fontSize: 8, textAlign: 'center' },
})

// Los enlaces no tienen espacios: se parten cada tantos caracteres para que no se salgan de la celda.
const URL_LINE = 58
const urlLines = (url: string) => url.match(new RegExp(`.{1,${URL_LINE}}`, 'g'))?.join('\n') ?? url

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.row} wrap={false}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.value}>{children}</View>
    </View>
  )
}

export default function HearingFormatDocument({ data }: { data: HearingFormatData }) {
  return (
    <Document title={data.title} author="OECCB Virtual" subject="Formato referencia cruzada" language="es-CO">
      <Page size="LEGAL" style={styles.page}>
        <View style={styles.header}>
          <Image src={logo} style={styles.logo} />
          <View style={styles.headerText}>
            <Text style={styles.title}>Centro de Documentación Judicial</Text>
            <Text style={styles.title}>-CENDOJ-</Text>
            <Text style={styles.subtitle}>FORMATO REFERENCIA CRUZADA</Text>
          </View>
        </View>

        <Text style={styles.block}>1. DATOS DE REGISTRO</Text>
        <View style={styles.section}>
          <Field label="Fecha de elaboración:">
            <Text>{data.preparedOn}</Text>
          </Field>
          <Field label="Elaborado por:">
            <Text>{data.preparedBy}</Text>
          </Field>
          <Field label="Cargo:">
            <Text>{data.position}</Text>
          </Field>
        </View>

        <Text style={styles.block}>2. IDENTIFICACIÓN EXPEDIENTE</Text>
        <View style={styles.section}>
          <Field label="No. Radicación del Proceso:">
            <Text>{data.caseNumber}</Text>
          </Field>
        </View>

        <Text style={styles.block}>3. DESCRIPCIÓN DEL DOCUMENTO O ELEMENTO</Text>
        <View style={styles.section}>
          <Field label="Descripción del documento o elemento:">
            <Text>{data.description}</Text>
          </Field>
          <Field label="Fecha del documento o elemento (AAAA/MM/DD):">
            <Text>{data.documentDate}</Text>
          </Field>
          <Field label="Fotografía del documento o elemento:">
            <Text>N/A</Text>
          </Field>
          <Field label="Ubicación del documento o elemento:">
            <Link src={data.recordingUrl} style={styles.link}>
              {urlLines(data.recordingUrl)}
            </Link>
          </Field>
        </View>

        <Text
          style={styles.footer}
          fixed
          render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
        />
      </Page>
    </Document>
  )
}
