import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { RendererErrorBoundary } from './RendererErrorBoundary'

function Boom(): React.JSX.Element {
  throw new Error('boom from child')
}

describe('RendererErrorBoundary', () => {
  afterEach(() => cleanup())

  it('renders a recoverable error UI when a child throws', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <RendererErrorBoundary title="Session crashed">
        <Boom />
      </RendererErrorBoundary>
    )
    expect(screen.getByText('Session crashed')).toBeTruthy()
    expect(screen.getByText('boom from child')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Reload' })).toBeTruthy()
    spy.mockRestore()
  })

  it('reloads the window when Reload is clicked', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const reload = vi.fn()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, reload }
    })

    render(
      <RendererErrorBoundary>
        <Boom />
      </RendererErrorBoundary>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Reload' }))
    expect(reload).toHaveBeenCalled()
    spy.mockRestore()
  })
})
