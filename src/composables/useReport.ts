import { ref, unref, Ref, watch, computed, ComputedRef } from 'vue'
import { scale } from 'chroma-js'
import { print } from 'graphql/language/printer'
import debounce from 'lodash.debounce'
import cloneDeep from 'lodash.clonedeep'
import isequal from 'lodash.isequal'
import '@leanix/reporting'
import { ChartSankeyConfig, ChartSankeyData, ChartSankeyNodeData, ChartSankeyLinkData } from 'd2b/src/types'

// holder for the selected report factsheet type
const factSheetType: Ref<string | null> = ref(null)
// holder for valid tag groups for the given factsheet type
const tagGroups: Ref<TagGroup[]> = ref([])
// index of tags by tagGroupId
const tagsByTagGroupIndex: Ref<TagGroupTagsIndex> = ref({})
// holder for the selected tagGroup id
const selectedTagGroupId: Ref<TagGroupId | null> = ref(null)
// holder for lxr filter state
const filter: Ref<Filter | null> = ref(null)
// holder for chart data
const chartData: Ref<ChartSankeyConfig | null> = ref(null)

// report settings
const showUntaggedFactSheets: Ref<boolean> = ref(false)

// computed report state, will triger a lx.update on every change through an watcher
const reportState: ComputedRef<ReportCustomState> = computed(() => ({
  factSheetType: unref(factSheetType),
  showUntaggedFactSheets: unref(showUntaggedFactSheets),
  selectedTagGroupId: unref(selectedTagGroupId)
}))

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

// @ts-expect-error
const getCurrentWorkspaceSetup = (): any => lx?.currentSetup

/*
* Throws an error if the specified factsheet type is not included in the workspace data model
*/
const validateFactSheetType = (factSheetType: string): void => {
  const dataModelFactSheetTypes: string[] = Object.keys(getCurrentWorkspaceSetup().settings.dataModel.factSheets)
  if (!dataModelFactSheetTypes.includes(factSheetType)) throw Error(`unrecognized factSheet type ${factSheetType}. Valid types are: ${dataModelFactSheetTypes.join(', ')}`)
}

/*
* Get a list of valid factsheet types for the current workspace
*/
const getWorkspaceFactSheetTypes = (): lxr.FormModalSingleSelectFieldOption[] => {
  const factSheets = Object.keys(getCurrentWorkspaceSetup().settings.dataModel.factSheets)
    .map(factSheetType => ({ value: factSheetType, label: lx.translateFactSheetType(factSheetType, 'singular') }))
    .sort(({ value: a }, { value: b }) => a > b ? 1 : a < b ? -1 : 0)
  return factSheets
}

/*
* Get a list of valid tag groups for a given factsheet type
*/
const getTagGroupsForFactSheetType = (factSheetType: string | null): TagGroup[] => {
  if (factSheetType === null) return []
  validateFactSheetType(factSheetType)
  let tagGroups: TagGroup[] | undefined = getCurrentWorkspaceSetup().settings.tagModel[factSheetType]
  if (tagGroups === undefined) throw Error(`could not find tagModel for factSheetType ${factSheetType}`)
  /*
  *   Note: tagGroups without any tags are filtered out here...
  */
  tagGroups = tagGroups
    .filter(({ name, tags }) => {
      if (tags.length === 0) console.warn(`Filtering out tag group ${name} as it contains no tags...`)
      return tags.length > 0
    })
    .sort(({ name: a }, { name: b }) => a > b ? 1 : a < b ? -1 : 0)
  const colorScale = scale(['#fafa6e', '#2A4858']).mode('lch').colors(tagGroups.length)

  tagGroups = tagGroups.map((tagGroup, idx) => ({ ...tagGroup, fill: colorScale[idx] }))
  return tagGroups
}

const getReportConfig = (fixedFactSheetType?: string): lxr.ReportConfiguration => {
  if (fixedFactSheetType === undefined) fixedFactSheetType = unref(factSheetType) ?? ''
  validateFactSheetType(fixedFactSheetType)
  tagGroups.value = getTagGroupsForFactSheetType(fixedFactSheetType)
  tagsByTagGroupIndex.value = unref(tagGroups)
    .reduce((accumulator: Record<TagGroupId, TagId[]>, { id: tagGroupId, tags }) => ({ ...accumulator, [tagGroupId]: tags.map(({ id }) => id) }), {})
  const tagGroupEntries = unref(tagGroups).map(({ id, name }) => ({ id, label: name }))

  let _selectedTagGroupId = unref(selectedTagGroupId)
  if (_selectedTagGroupId !== null) {
    // validate selectedTagGroupId
    const validTagGroupIds = tagGroupEntries.map(({ id }) => id)
    if (!validTagGroupIds.includes(_selectedTagGroupId)) _selectedTagGroupId = null
  }
  const defaultSelectedTagGroupId = _selectedTagGroupId ?? tagGroupEntries[0].id

  return {
    allowTableView: false,
    menuActions: {
      showConfigure: true,
      configureCallback: async () => {
        const factSheetTypeField: lxr.FormModalSingleSelectField = { type: 'SingleSelect', label: 'FactSheet Type', options: getWorkspaceFactSheetTypes() }
        const showUntaggedFactSheetsField: lxr.FormModalCheckboxField = { type: 'Checkbox', label: 'Show Untagged FactSheets' }
        const fields = { factSheetType: factSheetTypeField, showUntaggedFactSheets: showUntaggedFactSheetsField }
        const variables = { factSheetType, showUntaggedFactSheets }
        const values: lxr.FormModalValues = Object.entries(variables)
          // @ts-expect-error
          .reduce((accumulator, [key, value]) => ({ ...accumulator, [key]: unref(value) }), {})
        const formResult = await lx.openFormModal(fields, values, undefined)
        if (formResult !== false) {
          Object.entries(formResult)
            .forEach(([key, value]: [key: string, value: lxr.FormModalValue]) => {
              // @ts-expect-error
              if (values[key] !== value) variables[key].value = value
            })
        }
      }
    },
    ui: {
      elements: {
        root: {
          items: [
            {
              id: 'tagGroupId',
              type: 'groupDropdown',
              label: 'Tag Group',
              sections: [
                {
                  id: 'filters',
                  label: '',
                  entries: tagGroupEntries
                }
              ]
            }
          ],
          style: { justifyContent: 'start' }
        },
        values: {
          tagGroupId: defaultSelectedTagGroupId,
          factSheetType: unref(factSheetType)
        }
      },
      async update (selection: lxr.UISelection): Promise<undefined> {
        const tagGroupId = selection.elements?.values.tagGroupId
        if (typeof tagGroupId === 'string') {
          selectedTagGroupId.value = tagGroupId === '__noSelection__' ? null : tagGroupId
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        } else throw Error(`selectedTagGroupId should be a string, got ${tagGroupId}: ${typeof tagGroupId}`)
        return undefined
      }
    },
    facets: [{
      key: fixedFactSheetType,
      fixedFactSheetType,
      facetFiltersChangedCallback: ({ facets: facetFilters, fullTextSearchTerm: fullTextSearch, directHits }) => {
        filter.value = { facetFilters, fullTextSearch, ids: directHits.map(({ id }) => id) }
      }
    }]
  }
}

const fetchDataset = async (params: FetchDatasetParameters): Promise<ChartSankeyData> => {
  const { factSheetType, tagGroupId, tagsByTagGroupIndex, filter: allFactSheetsFilter } = params

  if (factSheetType === null) throw Error('factsheetType is null')
  else if (tagGroupId === null) throw Error('selectedTagGroupId is null')
  else if (allFactSheetsFilter === null) throw Error('filter is null')

  const tagGroupIndex: Record<string, TagGroup> = getTagGroupsForFactSheetType(factSheetType)
    .reduce((accumulator, tagGroup) => ({ ...accumulator, [tagGroup.id]: tagGroup }), {})

  lx.showSpinner()

  const requiredTags = tagsByTagGroupIndex[tagGroupId]
  const facetFilters = [{ facetKey: 'FactSheetTypes', keys: [factSheetType] }]
  facetFilters.push({ facetKey: tagGroupId, keys: requiredTags })

  const query = await import('@/graphql/FetchDatasetQuery.gql').then(query => print(query.default))

  try {
    const taggedFactSheetsFilter = cloneDeep(allFactSheetsFilter)

    if (!Array.isArray(taggedFactSheetsFilter.facetFilters)) taggedFactSheetsFilter.facetFilters = []
    if (requiredTags !== null) taggedFactSheetsFilter.facetFilters.push({ facetKey: tagGroupId, keys: requiredTags })

    const variables = JSON.stringify({ allFactSheetsFilter, taggedFactSheetsFilter })

    const { totalCount: totalFactSheetCount, taggedFactSheets }: { totalCount: number, taggedFactSheets: FactSheetNode[] } = await lx.executeGraphQL(query, variables)
      .then(({ totalFactSheetCount: { totalCount }, taggedFactSheets: { edges: taggedFactSheets } }) => ({
        totalCount,
        taggedFactSheets: taggedFactSheets.map(({ node }: { node: any }) => node)
      }))

    // eslint-disable-next-line
    const totalCount = totalFactSheetCount
    const missingCount = totalFactSheetCount - taggedFactSheets.length

    const factSheetName = lx.translateFactSheetType(factSheetType, 'plural')

    const tagGroup = tagGroupIndex[tagGroupId]
    const fsTypeViewModel: FactSheetTypeViewModel = getCurrentWorkspaceSetup().settings.viewModel.factSheets.find(({ type }: { type: string }) => type === factSheetType)
    const nodes: ChartSankeyNodeData[] = [
      { name: factSheetName, color: fsTypeViewModel.bgColor, type: 'factSheetType' },
      { name: tagGroup.name, color: tagGroup.fill, type: 'tagGroup', id: tagGroup.id },
      ...tagGroup.tags.map(({ id, name, color }) => ({ name, color, type: 'tag', id }))
    ]
    const multipleTaggedName = 'Multiple Tagged'
    if (tagGroup.mode === 'MULTIPLE') nodes.push({ name: multipleTaggedName, color: 'black', type: 'multiple' })

    const accumulator: Record<string, ChartSankeyLinkData> = {}
    if (unref(showUntaggedFactSheets) && missingCount > 0) {
      const untaggedName = 'Untagged'
      nodes.push({ name: untaggedName, color: 'black', type: '_UNTAGGED_' })
      accumulator[`${factSheetType}_MISSING_`] = { source: factSheetName, target: untaggedName, value: missingCount }
    }
    const linkIndex: Record<string, ChartSankeyLinkData> = taggedFactSheets
      .reduce((accumulator, factSheet: FactSheetNode) => {
        const scopedTags = factSheet.tags.filter(tag => (tag?.tagGroup?.id === tagGroupId) || (tagGroupId === '_TAGS_' && tag.tagGroup === null))
        if (scopedTags.length === 0) return accumulator
        else if (scopedTags.length === 1) {
          const linkId = `${factSheetType}${tagGroup.id}`
          if (accumulator[linkId] === undefined) accumulator[linkId] = { source: factSheetName, target: tagGroup.name, value: 0 }
          accumulator[`${factSheetType}${tagGroup.id}`].value++
          const [tag] = scopedTags
          const tagLinkId = `${tagGroupId}${tag.id}`
          if (accumulator[tagLinkId] === undefined) accumulator[tagLinkId] = { source: tagGroup.name, target: tag.name, value: 0 }
          accumulator[tagLinkId].value++
        } else if (scopedTags.length > 1) {
          const multipleTaggedLinkId = `${factSheetType}_MULTIPLE_`
          if (accumulator[multipleTaggedLinkId] === undefined) accumulator[multipleTaggedLinkId] = { source: factSheetName, target: multipleTaggedName, value: 0 }
          accumulator[multipleTaggedLinkId].value++
          const tagGroupLinkId = `_MULTIPLE_${tagGroupId}`
          if (accumulator[tagGroupLinkId] === undefined) accumulator[tagGroupLinkId] = { source: multipleTaggedName, target: tagGroup.name, value: 0 }
          scopedTags.forEach(tag => {
            accumulator[tagGroupLinkId].value++
            const tagLinkId = `${tagGroupId}${tag.id}`
            if (accumulator[tagLinkId] === undefined) accumulator[tagLinkId] = { source: tagGroup.name, target: tag.name, value: 0 }
            accumulator[tagLinkId].value++
          })
        }
        return accumulator
      }, accumulator)

    const links = Object.values(linkIndex)

    return { nodes, links }
  } finally {
    lx.hideSpinner()
  }
}

const computeChartData = (dataset: ChartSankeyData): ChartSankeyConfig | null => {
  const _factSheetType = unref(factSheetType)
  if (_factSheetType === null) return null
  else if (dataset.nodes.length === 0 || dataset.links.length === 0) return null

  // https://docs.d2bjs.org/chartsAdvanced/sankey.html#typescript
  const chartData: ChartSankeyConfig = {
    ...dataset,
    // iterations: 10,
    node: {
      draggableX: false,
      draggableY: false,
      padding: 50
    },
    link: {
      // sourceColor: (data, sourceColor) => sourceColor,
      // targetColor: (data, targetColor) => targetColor
    }
  }
  return chartData
}

const setReportConfig = (): void => {
  console.debug('workspace setup', getCurrentWorkspaceSetup())
  const [{ value: defaultFactSheetType }] = getWorkspaceFactSheetTypes()
  const { config, savedState }: { config: ReportConfig, savedState: ReportSavedState | null } = getCurrentWorkspaceSetup()
  factSheetType.value = savedState?.customState?.factSheetType ??
    ((config.factSheetType === 'Default' || config.factSheetType === null) ? defaultFactSheetType : config.factSheetType) ??
    defaultFactSheetType
  showUntaggedFactSheets.value = config.showUntaggedFactSheets ?? unref(showUntaggedFactSheets)
}

/**
 * Report initialization method. Should be executed as soon as the report launches.
 */
const initializeReport = async (): Promise<void> => {
  await lx.init()
  setReportConfig()
  await Promise.all([lx.ready(getReportConfig()), loadAxiformaFonts()])
}

interface ChartEvent {
  key: string
  event: {
    type: 'click' | 'mouseover' | 'mouseleave'
  }
}

interface ChartLinkEvent extends ChartEvent {
  keyTrim: string
  source: ChartSankeyNodeData
  sourceColor: string
  sourceKey: string
  target: ChartSankeyNodeData
  targetColor: string
  targetKey: string
  value: number
  data: ChartSankeyLinkData
}

interface ChartNodeEvent extends ChartEvent {
  label: string
  color: string
  data: ChartSankeyNodeData
  sourceLinks: ChartSankeyLinkData[]
  targetLinks: ChartSankeyLinkData[]
}

const clickHandler = (e: ChartLinkEvent | ChartNodeEvent): void => {
  if ((e as ChartNodeEvent).label !== undefined) {
    console.log('NODE EVENT', e)
  } else {
    console.log('LINK EVNET', e)
  }
  const sidePaneElements: lxr.SidePaneElements = {
    teste: {
      type: 'ShowInventory',
      factSheetType: 'Application',
      label: 'selected factsheets',
      facetFilters: [],
      factSheetIds: [],
      tableColumns: []
    }
  }
  const update: (factSheetUpdate: lxr.FactSheetUpdate) => void = factSheetUpdate => {
    console.log('UPDATED', factSheetUpdate)
  }
  lx.openSidePane(sidePaneElements, update)
}

const updateData = async (): Promise<void> => {
  const dataset = await fetchDataset({
    factSheetType: unref(factSheetType),
    tagGroupId: unref(selectedTagGroupId),
    tagsByTagGroupIndex: unref(tagsByTagGroupIndex),
    filter: unref(filter)
  })
  chartData.value = computeChartData(dataset)
}

watch(factSheetType, (factSheetType, oldFactSheetType) => {
  if (factSheetType === null || oldFactSheetType === null) return
  const config = getReportConfig(factSheetType)
  // after configuration is updated, a filter callback will happen, which will trigger the updateData method
  lx.updateConfiguration(config)
})

watch([selectedTagGroupId, showUntaggedFactSheets, filter], debounce(updateData, 500))

watch(reportState, reportState => {
  if (!isequal(reportState, lx.latestPublishedState)) {
    lx.publishState(reportState)
    console.debug('published state', reportState)
  }
})

export default (): UseReport => ({
  initializeReport,
  clickHandler,
  chartData
})
