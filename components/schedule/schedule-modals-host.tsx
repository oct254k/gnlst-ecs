'use client'

import { useRef } from 'react'
import { useScheduleModals } from '@/lib/hooks/use-schedule-modals'
import { ScheduleFormModal } from './schedule-form-modal'
import { ScheduleDetailModal } from './schedule-detail-modal'
import { ConfirmDeleteModal } from './confirm-delete-modal'

/**
 * URL 파라미터를 읽어 활성 모달을 렌더링하는 호스트 컴포넌트.
 * app/(app)/layout.tsx 의 <Suspense> 내부에서 마운트한다.
 *
 * URL 규칙:
 *   ?modal=form&type=personal&date=2026-05-15  → 등록 폼
 *   ?modal=form&id=<uuid>                       → 수정 폼
 *   ?detail=<id>                                → 상세 보기
 *   ?detail=<id>&confirm=delete                 → 삭제 확인 (상세 위에 레이어)
 */
export function ScheduleModalsHost() {
  const { activeModal, closeModal, openForm, openDetail, openDeleteConfirm } =
    useScheduleModals()

  // 삭제 확인 모달에 전달할 일정 메타 (URL 변경 시에도 유지)
  const deleteMetaRef = useRef<{ scheduleType: 'personal' | 'common'; participantCount: number } | null>(null)

  if (!activeModal) return null

  if (activeModal.kind === 'form') {
    return (
      <ScheduleFormModal
        editId={activeModal.id}
        initialType={activeModal.scheduleType}
        initialDate={activeModal.date}
        initialParticipantIds={activeModal.participantIds}
        onClose={closeModal}
      />
    )
  }

  if (activeModal.kind === 'detail') {
    return (
      <ScheduleDetailModal
        scheduleId={activeModal.id}
        onClose={closeModal}
        onEdit={(id) => openForm({ id })}
        onDelete={(id, scheduleType, participantCount) => {
          deleteMetaRef.current = { scheduleType, participantCount }
          openDeleteConfirm(id)
        }}
      />
    )
  }

  if (activeModal.kind === 'delete') {
    const meta = deleteMetaRef.current
    return (
      <ConfirmDeleteModal
        scheduleId={activeModal.id}
        scheduleType={meta?.scheduleType}
        participantCount={meta?.participantCount}
        onClose={() => openDetail(activeModal.id)}
        onDeleted={closeModal}
      />
    )
  }

  return null
}
