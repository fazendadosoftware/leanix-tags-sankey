declare module 'd2b'

interface UseReport {
  initializeReport: () => Promise<void>
  chartData: any
  chartConfig: any
}
