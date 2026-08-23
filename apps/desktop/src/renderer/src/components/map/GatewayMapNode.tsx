import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { Host } from '@shared/types'
import { HostConnectControl } from '../hosts/HostConnectControl'
import { osIcon } from '../hosts/osIcon'

function GatewayMapNodeComponent({ data }: NodeProps): React.JSX.Element {
  const host = data.host as Host | undefined
  const onConnect = data.onConnect as ((host: Host, profileId?: string) => void) | undefined
  const selected = Boolean(data.selected)

  return (
    <div
      className={`min-w-[140px] rounded-lg border-2 border-dashed px-3 py-2 shadow-lg ${
        selected ? 'border-brand bg-brand/15' : 'border-brand/40 bg-surface-raised'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-amber-600" />
      <div className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-brand/80">
        Gateway
      </div>
      <div className="flex items-center gap-2">
        {host && <span className="text-base">{osIcon(host.osType)}</span>}
        <div className="truncate text-sm font-medium text-fg">{data.label as string}</div>
      </div>
      {host && onConnect && <HostConnectControl host={host} onConnect={onConnect} />}
      <Handle type="source" position={Position.Bottom} className="!bg-amber-600" />
    </div>
  )
}

export const GatewayMapNode = memo(GatewayMapNodeComponent)
