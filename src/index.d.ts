declare module 'd2b'

interface Filter {
  facetFilters?: lxr.FacetFilter[]
  fullTextSearch?: string
  ids?: string[]
}

type TagId = string

interface Tag {
  id: TagId
  name: string
  status: 'ACTIVE'
  color: string
  tagGroup: TagGroup | null
}

type TagGroupId = string

interface TagGroup {
  id: TagGroupId
  name: string
  shortName: string | null
  model: 'SINGLE' | 'MULTIPLE'
  tags: Tag[]
  /** fill color for tagGroup, added locally by this library */
  fill?: string
}

type TagGroupTagsIndex = Record<TagGroupId, TagId[]>

type FactSheetId = string

interface FactSheetNode {
  id: FactSheetId
  name: string
  type: string
  tags: Tag[]
}

interface Node {
  
}
interface Dataset {
  nodes: any
  links: any
}

interface FetchDatasetParameters {
  factSheetType: string | null
  tagGroupId: string | null
  tagsByTagGroupIndex: TagGroupTagsIndex
  filter: Filter | null
}

interface FactSheetTypeViewModel {
  bgColor: string
  color: string
}

interface ReportCustomState {
  factSheetType?: string | null
  showLabels?: boolean
  selectedTagGroupId?: TagGroupId | null
}

interface ReportSavedState {
  customState?: ReportCustomState
}

interface ReportConfig extends ReportCustomState {
  factSheetType: string
  showUntaggedFactSheets?: boolean
  filterBySubscriptionRole?: string | string[]
  zoomable?: boolean
}

interface UseReport {
  initializeReport: () => Promise<void>
  clickHandler: (chart: any) => void
  chartData: any
}
