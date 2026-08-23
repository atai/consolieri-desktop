import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, fireEvent } from '@testing-library/react'
import { HostActionsMenu } from './HostActionsMenu'

const noop = vi.fn()

function openMoreActions(): void {
  const button = screen.getByTitle('More actions')
  fireEvent.click(button)
}

describe('HostActionsMenu local shells', () => {
  afterEach(() => cleanup())

  it('renders only Bash when PowerShell is unavailable', () => {
    render(
      <HostActionsMenu
        onAddHost={noop}
        onImport={noop}
        onExport={noop}
        onOpenLocalShell={noop}
        availableLocalShells={{ powershell: false, bash: true }}
        wslDistros={[]}
        onOpenWsl={noop}
      />
    )

    openMoreActions()

    expect(screen.queryByRole('menuitem', { name: 'PowerShell' })).toBeNull()
    expect(screen.getByRole('menuitem', { name: 'Bash' })).toBeTruthy()
  })

  it('renders nothing for local shells when both are unavailable', () => {
    render(
      <HostActionsMenu
        onAddHost={noop}
        onImport={noop}
        onExport={noop}
        onOpenLocalShell={noop}
        availableLocalShells={{ powershell: false, bash: false, zsh: false, sh: false }}
        wslDistros={[]}
        onOpenWsl={noop}
      />
    )

    openMoreActions()

    expect(screen.queryByRole('menuitem', { name: 'PowerShell' })).toBeNull()
    expect(screen.queryByRole('menuitem', { name: 'Bash' })).toBeNull()
  })

  it('does not render WSL items when wslDistros is empty', () => {
    render(
      <HostActionsMenu
        onAddHost={noop}
        onImport={noop}
        onExport={noop}
        onOpenLocalShell={noop}
        availableLocalShells={{ powershell: true, bash: true }}
        wslDistros={[]}
        onOpenWsl={noop}
      />
    )

    openMoreActions()

    expect(screen.queryByText(/WSL:/)).toBeNull()
  })

  it('renders useful unix shells when available', () => {
    render(
      <HostActionsMenu
        onAddHost={noop}
        onImport={noop}
        onExport={noop}
        onOpenLocalShell={noop}
        availableLocalShells={{
          powershell: false,
          bash: true,
          zsh: true,
          sh: true,
          cmd: false,
          pwsh: false
        }}
        wslDistros={[]}
        onOpenWsl={noop}
      />
    )

    openMoreActions()

    expect(screen.getByRole('menuitem', { name: 'Bash' })).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: 'zsh' })).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: 'sh' })).toBeTruthy()
    expect(screen.queryByRole('menuitem', { name: 'PowerShell' })).toBeNull()
  })
})
