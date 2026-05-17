'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@/components/ui/icon'
import type { RelationshipHistory } from '@/lib/types'

interface RelationshipPopoverProps {
  target: { id: string; name: string; type: 'contact' | 'company' }
  history: RelationshipHistory | null
  loading: boolean
  error: string | null
  onRetry: () => void
  onClose: () => void
  anchorRect?: DOMRect | null
}

const POPOVER_WIDTH = 440
const POPOVER_MAX_HEIGHT = 420
const MARGIN = 8

export function RelationshipPopover({ target, history, loading, error, onRetry, onClose, anchorRect }: RelationshipPopoverProps) {
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  function computeCardStyle(): React.CSSProperties {
    if (isMobile) {
      return {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        maxHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 201,
        borderRadius: '16px 16px 0 0',
        boxShadow: 'var(--shadow-lg)',
      }
    }
    if (anchorRect) {
      const vw = window.innerWidth
      const vh = window.innerHeight

      let left = anchorRect.left
      if (left + POPOVER_WIDTH > vw - MARGIN) {
        left = Math.max(MARGIN, vw - POPOVER_WIDTH - MARGIN)
      }

      let top = anchorRect.bottom + MARGIN
      if (top + POPOVER_MAX_HEIGHT > vh - MARGIN) {
        top = Math.max(MARGIN, anchorRect.top - POPOVER_MAX_HEIGHT - MARGIN)
      }

      return {
        position: 'fixed',
        top,
        left,
        width: POPOVER_WIDTH,
        maxWidth: `calc(100vw - ${MARGIN * 2}px)`,
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 201,
        boxShadow: 'var(--shadow-lg)',
      }
    }
    return {
      width: POPOVER_WIDTH,
      maxWidth: '90vw',
      maxHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: 'var(--shadow-lg)',
    }
  }

  const cardContent = (
    <>
      {/* 헤더 */}
      <div className="card-hd">
        <span className="card-hd-title">
          <Icon name={target.type === 'company' ? 'company' : 'contact'} size={14} />
          {' '}@{target.name} 관계 히스토리
        </span>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={onClose}
          aria-label="닫기"
        >
          <Icon name="x" size={14} />
        </button>
      </div>

      {/* 바디 */}
      <div className="card-bd" style={{ overflowY: 'auto' }}>
        {loading && (
          <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[80, 60, 100].map((w, i) => (
              <div
                key={i}
                style={{
                  height: 14,
                  width: `${w}%`,
                  background: 'var(--c-divider)',
                  borderRadius: 4,
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              />
            ))}
          </div>
        )}
        {!loading && error && (
          <div className="empty" style={{ padding: 32 }}>
            <div className="muted text-sm" style={{ color: 'var(--c-warn)', marginBottom: 12 }}>{error}</div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>
              다시 시도
            </button>
          </div>
        )}
        {!loading && !error && !history && (
          <div className="empty" style={{ padding: 32 }}>
            <div className="muted text-sm">관련 미팅 기록이 없습니다</div>
          </div>
        )}
        {!loading && !error && history && (
          <>
            {/* 요약 */}
            <div
              style={{
                display: 'flex',
                gap: 24,
                padding: '12px 0',
                borderBottom: '1px solid var(--c-divider)',
                marginBottom: 12,
              }}
            >
              <div>
                <div className="text-sm muted">총 미팅</div>
                <div className="fw-6">{history.total_count}건</div>
              </div>
              {history.last_meeting_date && (
                <div>
                  <div className="text-sm muted">마지막 미팅</div>
                  <div className="fw-6">{history.last_meeting_date}</div>
                </div>
              )}
              {history.last_executive && (
                <div>
                  <div className="text-sm muted">담당 임원</div>
                  <div className="fw-6">{history.last_executive}</div>
                </div>
              )}
            </div>

            {/* 미팅 목록 */}
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {history.meetings.map((m) => (
                <li
                  key={m.schedule_id}
                  role="button"
                  tabIndex={0}
                  style={{
                    padding: '10px 12px',
                    background: 'var(--c-bg)',
                    borderRadius: 6,
                    border: '1px solid var(--c-divider)',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    onClose()
                    router.push(`/list?detail=${m.schedule_id}`)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onClose()
                      router.push(`/list?detail=${m.schedule_id}`)
                    }
                  }}
                >
                  <div className="fw-6 text-sm" style={{ marginBottom: 2 }}>{m.title}</div>
                  <div className="text-sm muted" style={{ display: 'flex', gap: 12 }}>
                    <span>{m.date}</span>
                    <span>{m.executive_name}</span>
                    {m.location && <span><Icon name="location" size={12} /> {m.location}</span>}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  )

  if (isMobile) {
    return (
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.4)' }}
        onClick={onClose}
      >
        <div
          ref={ref}
          className="card"
          role="dialog"
          aria-label={`@${target.name} 관계 히스토리`}
          style={computeCardStyle()}
          onClick={(e) => e.stopPropagation()}
        >
          {cardContent}
        </div>
      </div>
    )
  }

  if (anchorRect) {
    return (
      <>
        <div style={{ position: 'fixed', inset: 0, zIndex: 200 }} />
        <div
          ref={ref}
          className="card"
          role="dialog"
          aria-label={`@${target.name} 관계 히스토리`}
          style={computeCardStyle()}
        >
          {cardContent}
        </div>
      </>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.3)',
      }}
    >
      <div
        ref={ref}
        className="card"
        role="dialog"
        aria-label={`@${target.name} 관계 히스토리`}
        style={{
          width: POPOVER_WIDTH,
          maxWidth: '90vw',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {cardContent}
      </div>
    </div>
  )
}
