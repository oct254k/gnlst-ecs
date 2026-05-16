interface KpiData {
  todayTotal: number
  todayCommon: number
  unreadNotifs: number
  execCount: number
}

interface KpiCardsProps {
  data: KpiData
}

export function KpiCards({ data }: KpiCardsProps) {
  const todayPersonal = data.todayTotal - data.todayCommon

  return (
    <div className="dash-kpi-row">
      <div className="kpi-card">
        <div className="kpi-lbl">오늘 일정</div>
        <div className="kpi-val">
          {data.todayTotal}
          <span className="unit">건</span>
        </div>
        <div className="kpi-sub">
          공통 {data.todayCommon}건 · 개인 {todayPersonal}건
        </div>
      </div>

      <div className="kpi-card">
        <div className="kpi-lbl">오늘 공통 일정</div>
        <div className="kpi-val">
          {data.todayCommon}
          <span className="unit">건</span>
        </div>
        <div className="kpi-sub">전 임원 참석 일정</div>
      </div>

      <div className="kpi-card kpi-accent">
        <div className="kpi-lbl">미확인 알림</div>
        <div className="kpi-val">
          {data.unreadNotifs}
          <span className="unit">건</span>
        </div>
        <div className="kpi-sub">확인이 필요한 알림</div>
      </div>

      <div className="kpi-card">
        <div className="kpi-lbl">담당 임원</div>
        <div className="kpi-val">
          {data.execCount}
          <span className="unit">명</span>
        </div>
        <div className="kpi-sub">활성 임원 수</div>
      </div>
    </div>
  )
}
