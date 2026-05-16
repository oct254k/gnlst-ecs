'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useMemo } from 'react'
import type { ScheduleType } from '@/lib/types'

export type ActiveModal =
  | { kind: 'form'; scheduleType?: ScheduleType; date?: string; id?: string; participantIds?: string[] }
  | { kind: 'detail'; id: string }
  | { kind: 'delete'; id: string }
  | null

export interface OpenFormOptions {
  date?: string
  type?: ScheduleType
  id?: string
  participantIds?: string[]
}

export function useScheduleModals() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const activeModal: ActiveModal = useMemo(() => {
    const modal = searchParams.get('modal')
    const detail = searchParams.get('detail')
    const confirm = searchParams.get('confirm')
    const id = searchParams.get('id')

    if (detail && confirm === 'delete') {
      return { kind: 'delete', id: detail }
    }
    if (detail) {
      return { kind: 'detail', id: detail }
    }
    if (modal === 'form') {
      const type = searchParams.get('type') as ScheduleType | null
      const date = searchParams.get('date') ?? undefined
      const pids = searchParams.get('participant_ids')
      return {
        kind: 'form',
        scheduleType: type ?? undefined,
        date,
        id: id ?? undefined,
        participantIds: pids ? pids.split(',').filter(Boolean) : undefined,
      }
    }
    return null
  }, [searchParams])

  const openForm = useCallback(
    (opts: OpenFormOptions = {}) => {
      const params = new URLSearchParams(searchParams.toString())
      params.delete('detail')
      params.delete('confirm')
      params.set('modal', 'form')
      if (opts.id) {
        params.set('id', opts.id)
        params.delete('type')
        params.delete('date')
        params.delete('participant_ids')
      } else {
        params.delete('id')
        if (opts.type) params.set('type', opts.type)
        else params.delete('type')
        if (opts.date) params.set('date', opts.date)
        else params.delete('date')
        if (opts.participantIds && opts.participantIds.length > 0)
          params.set('participant_ids', opts.participantIds.join(','))
        else params.delete('participant_ids')
      }
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams],
  )

  const openDetail = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.delete('modal')
      params.delete('id')
      params.delete('type')
      params.delete('date')
      params.delete('confirm')
      params.set('detail', id)
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams],
  )

  const openDeleteConfirm = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.delete('modal')
      params.delete('id')
      params.delete('type')
      params.delete('date')
      params.set('detail', id)
      params.set('confirm', 'delete')
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams],
  )

  const closeModal = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('modal')
    params.delete('id')
    params.delete('type')
    params.delete('date')
    params.delete('participant_ids')
    params.delete('detail')
    params.delete('confirm')
    router.push(`${pathname}?${params.toString()}`)
  }, [router, pathname, searchParams])

  return { openForm, openDetail, openDeleteConfirm, closeModal, activeModal }
}
