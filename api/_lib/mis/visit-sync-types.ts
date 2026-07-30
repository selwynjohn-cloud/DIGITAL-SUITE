export type SyncVisitsResult = {
  ok: boolean
  date: string
  fetched: number
  saved: number
  skipped?: boolean
  error?: string
}
