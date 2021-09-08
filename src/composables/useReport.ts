import '@leanix/reporting'

/**
 * Loads the Axiforma font files served by LeanIX host.
 */
const loadAxiformaFonts = async (): Promise<void> => {
  // @ts-expect-error
  const baseUrl: string = lx.currentSetup.settings.baseUrl
  const fonts = [
    { fontName: 'Axiforma-Regular', fileName: '39568C_F_0.228641b0955040e351ea.woff2' },
    { fontName: 'Axiforma-Bold', fileName: '39568C_0_0.adaeb02b1e875fd68248.woff2' }
  ]
  try {
    const loadFontFace = ({ fontName, fileName }: { fontName: string, fileName: string }): any => new FontFace(fontName, `url(${baseUrl}/${fileName})`).load()
    const fontFaces = await Promise.all(fonts.map(({ fontName, fileName }) => loadFontFace({ fontName, fileName })))
    // @ts-expect-error
    fontFaces.forEach(face => document.fonts.add(face))
  } catch (error) {
    lx.showToastr('warning', 'Could not load Axiforma font')
    console.warn(error)
  }
}

const getReportConfig = (fixedFactSheetType?: string): lxr.ReportConfiguration => {
  return {}
}

/**
 * Report initialization method. Should be executed as soon as the report launches.
 */
const initializeReport = async (): Promise<void> => {
  await lx.init()
  // setReportConfig()
  await Promise.all([lx.ready(getReportConfig()), loadAxiformaFonts()])
}

const chartData = {
  nodes: [
    { name: 'Node A' },
    { name: 'Node B' },
    { name: 'Node C' },
    { name: 'Node D' },
    { name: 'Node E' }
  ],
  links: [
    { source: 'Node A', target: 'Node E', value: 2 },
    { source: 'Node A', target: 'Node C', value: 2 },
    { source: 'Node B', target: 'Node C', value: 2 },
    { source: 'Node B', target: 'Node D', value: 2 },
    { source: 'Node C', target: 'Node D', value: 2 },
    { source: 'Node C', target: 'Node E', value: 2 },
    { source: 'Node D', target: 'Node E', value: 4 }
  ]
}

const chartConfig = (chart: any) => {
  chart
    .sankey()
    .sankey()
    .nodePadding(100)

  chart
    .sankey()
    .nodeDraggableY(true)
}

export default (): UseReport => ({
  initializeReport,
  chartData,
  chartConfig
})
