import { Maximize2, Minimize2 } from 'lucide-react'
import { MosaicToolbarButton } from './MosaicToolbarButton'
import { MosaicToolbarMenu } from './MosaicToolbarMenu'

const iconSplitSideBySide = (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <rect x="2" y="3" width="5.5" height="10" rx="1" stroke="currentColor" strokeWidth="1.25" />
    <rect x="8.5" y="3" width="5.5" height="10" rx="1" stroke="currentColor" strokeWidth="1.25" />
  </svg>
)

const iconSplitStacked = (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <rect x="3" y="2" width="10" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.25" />
    <rect x="3" y="8.5" width="10" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.25" />
  </svg>
)

const iconSplit = (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <rect x="2" y="3" width="5.5" height="10" rx="1" stroke="currentColor" strokeWidth="1.25" />
    <rect x="8.5" y="3" width="5.5" height="10" rx="1" stroke="currentColor" strokeWidth="1.25" />
  </svg>
)

const iconConnect = (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M5 8h6M11 6l2 2-2 2M5 10l-2-2 2-2"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const iconLog = (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M4 2.5h6l3 3V13.5H4V2.5z"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinejoin="round"
    />
    <path d="M10 2.5V5.5H13" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
    <path d="M6 8h4M6 10.5h4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
  </svg>
)

const iconClose = (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M4.5 4.5l7 7M11.5 4.5l-7 7"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
)

export function splitToolbarMenu(
  onSideBySide: () => void,
  onStacked: () => void
): React.JSX.Element {
  return (
    <MosaicToolbarMenu
      key="split"
      className="split-menu"
      label="Split"
      title="Split pane"
      icon={iconSplit}
      items={[
        {
          key: 'side-by-side',
          label: 'Side by side',
          icon: iconSplitSideBySide,
          onClick: onSideBySide
        },
        {
          key: 'stacked',
          label: 'Top & bottom',
          icon: iconSplitStacked,
          onClick: onStacked
        }
      ]}
    />
  )
}

export function maximizeToolbarButton(
  maximized: boolean,
  onClick: () => void,
  shortcutHint?: string
): React.JSX.Element {
  const label = maximized ? 'Restore' : 'Maximize'
  const title = shortcutHint ? `${label} (${shortcutHint})` : label
  return (
    <MosaicToolbarButton
      key="maximize"
      className="maximize-button"
      label={label}
      title={title}
      onClick={onClick}
      icon={
        maximized ? (
          <Minimize2 className="h-3.5 w-3.5" aria-hidden />
        ) : (
          <Maximize2 className="h-3.5 w-3.5" aria-hidden />
        )
      }
      iconOnly
    />
  )
}

export function connectToolbarButton(onClick: () => void): React.JSX.Element {
  return (
    <MosaicToolbarButton
      key="connect"
      className="connect-button"
      label="Connect"
      title="Connect session"
      onClick={onClick}
      icon={iconConnect}
    />
  )
}

export function logToolbarButton(onClick: () => void): React.JSX.Element {
  return (
    <MosaicToolbarButton
      key="log"
      className="log-button"
      label="Log"
      title="View connection log"
      onClick={onClick}
      icon={iconLog}
    />
  )
}

export function closeToolbarButton(onClick: () => void): React.JSX.Element {
  return (
    <MosaicToolbarButton
      key="close"
      className="close-button"
      label="Close"
      title="Close pane"
      onClick={onClick}
      icon={iconClose}
      variant="danger"
    />
  )
}
