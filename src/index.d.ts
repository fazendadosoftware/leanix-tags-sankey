declare module 'd2b'

interface UseReport {
  initializeReport: () => Promise<void>
  clickHandler: (event: any) => void
  chartData: any
  chartConfig: any
}
