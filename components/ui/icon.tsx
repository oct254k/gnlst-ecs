type IconName =
  | 'menu' | 'chevL' | 'chevR' | 'chevD' | 'chevU'
  | 'bell' | 'search' | 'plus' | 'x' | 'check' | 'dot'
  | 'cal' | 'list' | 'dashboard' | 'radar' | 'users'
  | 'contact' | 'company' | 'shield' | 'holiday' | 'notif_log'
  | 'audit' | 'download' | 'filter' | 'more' | 'moreV'
  | 'edit' | 'trash' | 'pin' | 'location' | 'settings'
  | 'eye' | 'logout' | 'user' | 'sun' | 'moon' | 'refresh'
  | 'arrow_back' | 'info'

interface IconProps {
  name: IconName
  size?: number
  stroke?: string
}

const paths: Record<IconName, React.ReactNode> = {
  menu:      <><line x1="3" y1="6" x2="17" y2="6"/><line x1="3" y1="10" x2="17" y2="10"/><line x1="3" y1="14" x2="17" y2="14"/></>,
  chevL:     <polyline points="12 4 6 10 12 16"/>,
  chevR:     <polyline points="8 4 14 10 8 16"/>,
  chevD:     <polyline points="5 8 10 13 15 8"/>,
  chevU:     <polyline points="5 12 10 7 15 12"/>,
  bell:      <><path d="M5 8a5 5 0 0 1 10 0v4l1.5 2.5h-13L5 12z"/><path d="M8.5 16.5a1.5 1.5 0 0 0 3 0"/></>,
  search:    <><circle cx="9" cy="9" r="5"/><line x1="13" y1="13" x2="17" y2="17"/></>,
  plus:      <><line x1="10" y1="4" x2="10" y2="16"/><line x1="4" y1="10" x2="16" y2="10"/></>,
  x:         <><line x1="5" y1="5" x2="15" y2="15"/><line x1="15" y1="5" x2="5" y2="15"/></>,
  check:     <polyline points="4 10 8 14 16 5"/>,
  dot:       <circle cx="10" cy="10" r="3" fill="currentColor"/>,
  cal:       <><rect x="3" y="4" width="14" height="13" rx="1"/><line x1="3" y1="8" x2="17" y2="8"/><line x1="7" y1="2" x2="7" y2="5"/><line x1="13" y1="2" x2="13" y2="5"/></>,
  list:      <><line x1="6" y1="5" x2="17" y2="5"/><line x1="6" y1="10" x2="17" y2="10"/><line x1="6" y1="15" x2="17" y2="15"/><circle cx="3" cy="5" r="1" fill="currentColor"/><circle cx="3" cy="10" r="1" fill="currentColor"/><circle cx="3" cy="15" r="1" fill="currentColor"/></>,
  dashboard: <><rect x="3" y="3" width="6" height="7"/><rect x="11" y="3" width="6" height="4"/><rect x="11" y="9" width="6" height="8"/><rect x="3" y="12" width="6" height="5"/></>,
  radar:     <><circle cx="10" cy="10" r="2"/><circle cx="10" cy="10" r="5" fill="none" opacity="0.6"/><circle cx="10" cy="10" r="8" fill="none" opacity="0.35"/></>,
  users:     <><circle cx="7" cy="7" r="3"/><path d="M2 16c0-3 2.5-5 5-5s5 2 5 5"/><circle cx="14" cy="7" r="2"/><path d="M18 14c0-2-1.5-3-3.5-3"/></>,
  contact:   <><rect x="3" y="3" width="14" height="14" rx="1"/><circle cx="10" cy="8" r="2"/><path d="M6 15c0-2 1.5-3.5 4-3.5s4 1.5 4 3.5"/></>,
  company:   <><rect x="3" y="3" width="14" height="14"/><line x1="7" y1="6" x2="9" y2="6"/><line x1="11" y1="6" x2="13" y2="6"/><line x1="7" y1="10" x2="9" y2="10"/><line x1="11" y1="10" x2="13" y2="10"/><line x1="7" y1="14" x2="9" y2="14"/><line x1="11" y1="14" x2="13" y2="14"/></>,
  shield:    <path d="M10 2 4 5v5c0 4 6 8 6 8s6-4 6-8V5z"/>,
  holiday:   <><circle cx="10" cy="10" r="6"/><line x1="10" y1="4" x2="10" y2="16"/><line x1="4" y1="10" x2="16" y2="10"/></>,
  notif_log: <><rect x="3" y="4" width="14" height="13" rx="1"/><line x1="6" y1="8" x2="14" y2="8"/><line x1="6" y1="11" x2="14" y2="11"/><line x1="6" y1="14" x2="11" y2="14"/></>,
  audit:     <><circle cx="10" cy="10" r="6"/><polyline points="10 6 10 10 13 12"/></>,
  download:  <><polyline points="10 3 10 13"/><polyline points="6 10 10 14 14 10"/><line x1="4" y1="17" x2="16" y2="17"/></>,
  filter:    <><polygon points="3 4 17 4 12 11 12 16 8 16 8 11"/></>,
  more:      <><circle cx="5" cy="10" r="1" fill="currentColor"/><circle cx="10" cy="10" r="1" fill="currentColor"/><circle cx="15" cy="10" r="1" fill="currentColor"/></>,
  moreV:     <><circle cx="10" cy="5" r="1" fill="currentColor"/><circle cx="10" cy="10" r="1" fill="currentColor"/><circle cx="10" cy="15" r="1" fill="currentColor"/></>,
  edit:      <><path d="M3 17 7 13l9-9 4 4-9 9-4 0z"/></>,
  trash:     <><polyline points="4 6 16 6"/><line x1="8" y1="6" x2="8" y2="3"/><line x1="12" y1="6" x2="12" y2="3"/><rect x="6" y="6" width="8" height="11"/></>,
  pin:       <path d="M10 2v6l3 2v2H7v-2l3-2V2zM10 12v6"/>,
  location:  <><path d="M10 18s6-5 6-10a6 6 0 1 0-12 0c0 5 6 10 6 10z"/><circle cx="10" cy="8" r="2"/></>,
  settings:  <><circle cx="10" cy="10" r="2.5"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M4.2 15.8l1.4-1.4M14.4 5.6l1.4-1.4"/></>,
  eye:       <><path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z"/><circle cx="10" cy="10" r="2.5"/></>,
  logout:    <><path d="M11 4H4v12h7"/><polyline points="13 7 16 10 13 13"/><line x1="9" y1="10" x2="16" y2="10"/></>,
  user:      <><circle cx="10" cy="7" r="3"/><path d="M3 17c0-4 3-6 7-6s7 2 7 6"/></>,
  sun:       <><circle cx="10" cy="10" r="3"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M4.2 15.8l1.4-1.4M14.4 5.6l1.4-1.4"/></>,
  moon:      <path d="M14 4a7 7 0 1 0 2 12 6 6 0 0 1-2-12z"/>,
  refresh:   <><polyline points="14 3 17 6 14 9"/><path d="M17 6H7a4 4 0 0 0 0 8h7"/></>,
  arrow_back:<><polyline points="9 4 4 10 9 16"/><line x1="4" y1="10" x2="17" y2="10"/></>,
  info:      <><circle cx="10" cy="10" r="7"/><circle cx="10" cy="6.5" r="0.7" fill="currentColor"/><line x1="10" y1="9" x2="10" y2="14"/></>,
}

export function Icon({ name, size = 16, stroke = 'currentColor' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke={stroke}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle' }}
    >
      {paths[name]}
    </svg>
  )
}
