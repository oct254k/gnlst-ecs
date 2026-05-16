'use client'

import { useState } from 'react'
import { Icon } from '@/components/ui/icon'
import { deleteSchedule } from '@/lib/actions/schedules'

interface ConfirmDeleteModalProps {
  scheduleId: string
  onClose: () => void
  onDeleted?: () => void
}

export function ConfirmDeleteModal({
  scheduleId,
  onClose,
  onDeleted,
}: ConfirmDeleteModalProps) {
  const [toast, setToast] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleConfirm() {
    if (deleting) return
    setDeleting(true)
    const result = await deleteSchedule(scheduleId)
    if (!result.success) {
      setDeleting(false)
      setToast(result.error ?? '삭제에 실패했습니다')
      return
    }
    setToast('일정이 삭제되었습니다')
    setTimeout(() => {
      onDeleted?.()
      onClose()
    }, 600)
  }

  return (
    <>
      <div className="backdrop" onClick={onClose} />
      <div className="modal modal-sm" role="dialog" aria-labelledby="confirm-delete-title">
        <div className="modal-hd">
          <h2 className="modal-hd-title" id="confirm-delete-title">
            일정 삭제
          </h2>
          <button
            className="btn btn-tertiary btn-icon"
            onClick={onClose}
            aria-label="닫기"
          >
            <Icon name="x" />
          </button>
        </div>
        <div className="modal-bd">
          <div className="mb-3">이 일정을 삭제하시겠습니까?</div>
          <div className="muted text-sm">
            ※ 삭제 후에는 복원이 불가능합니다.
          </div>
          {toast && (
            <div className="muted text-sm mt-2" style={{ color: 'var(--c-success)' }}>
              {toast}
            </div>
          )}
        </div>
        <div className="modal-ft">
          <button className="btn btn-tertiary" type="button" onClick={onClose}>
            취소
          </button>
          <button
            className="btn btn-danger"
            type="button"
            onClick={handleConfirm}
            disabled={deleting}
          >
            <Icon name="trash" size={12} /> {deleting ? '삭제 중...' : '삭제'}
          </button>
        </div>
      </div>
    </>
  )
}
