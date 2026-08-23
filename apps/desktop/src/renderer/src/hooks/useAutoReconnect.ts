import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react'
import type { SessionInfo } from '@shared/types'
import { reportBestEffortFailure } from '../../../shared/bestEffort'

export interface AutoReconnectHook {
  panelOpen: boolean
  autoEnabled: boolean
  intervalSec: number
  maxAttempts: number
  soundEnabled: boolean
  countdown: number
  attemptsDone: number
  setPanelOpen: (v: boolean) => void
  enable: () => void
  disable: () => void
  setIntervalSec: (v: number) => void
  setMaxAttempts: (v: number) => void
  setSoundEnabled: (v: boolean) => void
}

function playSuccessBeep(): void {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
    osc.start()
    osc.stop(ctx.currentTime + 0.6)
    osc.addEventListener('ended', () => void ctx.close())
  } catch (error) {
    reportBestEffortFailure('reconnect success sound', error)
  }
}

export function useAutoReconnect(
  session: SessionInfo | undefined,
  onConnect: () => void
): AutoReconnectHook {
  const sessionId = session?.id
  const status = session?.status

  const [panelOpen, setPanelOpen] = useState(false)
  const [autoEnabled, setAutoEnabled] = useState(false)
  const [intervalSec, setIntervalSecState] = useState(30)
  const [maxAttempts, setMaxAttemptsState] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [countdown, setCountdown] = useState(30)
  const [attemptsDone, setAttemptsDone] = useState(0)
  const [trackedSessionId, setTrackedSessionId] = useState(sessionId)

  const countdownRef = useRef(30)
  const attemptsDoneRef = useRef(0)
  const intervalSecRef = useRef(intervalSec)
  const maxAttemptsRef = useRef(maxAttempts)
  const lastConnectWasAutoRef = useRef(false)
  const prevStatusRef = useRef(status)
  const onConnectRef = useRef(onConnect)
  const soundEnabledRef = useRef(soundEnabled)

  // Reset React state when the bound session identity changes (adjust during render).
  if (sessionId !== trackedSessionId) {
    setTrackedSessionId(sessionId)
    setAutoEnabled(false)
    setAttemptsDone(0)
    setCountdown(intervalSec)
  }

  const resetSessionRefs = useEffectEvent((): void => {
    attemptsDoneRef.current = 0
    countdownRef.current = intervalSecRef.current
    lastConnectWasAutoRef.current = false
    prevStatusRef.current = status
  })

  useEffect(() => {
    resetSessionRefs()
  }, [sessionId])

  useEffect(() => {
    onConnectRef.current = onConnect
  }, [onConnect])

  useEffect(() => {
    soundEnabledRef.current = soundEnabled
  }, [soundEnabled])

  useEffect(() => {
    const prev = prevStatusRef.current
    prevStatusRef.current = status

    if (!sessionId || !lastConnectWasAutoRef.current) return

    if (prev === 'connecting' && status === 'connected') {
      if (soundEnabledRef.current) playSuccessBeep()
      void window.consoleri.sessions.appendLog(
        sessionId,
        'info',
        `Auto-reconnect succeeded after ${attemptsDoneRef.current} attempt(s)`
      )
      lastConnectWasAutoRef.current = false
    }

    if (prev === 'connecting' && status === 'error') {
      void window.consoleri.sessions.appendLog(
        sessionId,
        'warn',
        `Auto-reconnect attempt ${attemptsDoneRef.current} failed`
      )
    }
  }, [status, sessionId])

  useEffect(() => {
    if (!autoEnabled || status !== 'error' || !sessionId) return

    const id = window.setInterval(() => {
      countdownRef.current -= 1
      setCountdown(countdownRef.current)

      if (countdownRef.current > 0) return

      const sec = intervalSecRef.current
      const max = maxAttemptsRef.current
      countdownRef.current = sec

      const nextAttempt = attemptsDoneRef.current + 1

      if (max > 0 && nextAttempt > max) {
        setAutoEnabled(false)
        void window.consoleri.sessions.appendLog(
          sessionId,
          'warn',
          `Auto-reconnect stopped: reached limit of ${max} attempt(s)`
        )
        return
      }

      attemptsDoneRef.current = nextAttempt
      setAttemptsDone(nextAttempt)
      lastConnectWasAutoRef.current = true
      const maxLabel = max > 0 ? ` / ${max}` : ''
      void window.consoleri.sessions.appendLog(
        sessionId,
        'info',
        `Auto-reconnect attempt ${nextAttempt}${maxLabel}…`
      )
      onConnectRef.current()
    }, 1000)

    return () => window.clearInterval(id)
  }, [autoEnabled, status, sessionId])

  const enable = useCallback(() => {
    const sec = intervalSecRef.current
    const max = maxAttemptsRef.current
    countdownRef.current = sec
    setCountdown(sec)
    setAttemptsDone(0)
    attemptsDoneRef.current = 0
    setAutoEnabled(true)

    if (sessionId) {
      const maxDesc = max > 0 ? `, max ${max} attempt(s)` : ', unlimited attempts'
      void window.consoleri.sessions.appendLog(
        sessionId,
        'info',
        `Auto-reconnect enabled: every ${sec} s${maxDesc}`
      )
    }
  }, [sessionId])

  const disable = useCallback(() => {
    setAutoEnabled(false)
    if (sessionId) {
      void window.consoleri.sessions.appendLog(sessionId, 'info', 'Auto-reconnect stopped by user')
    }
  }, [sessionId])

  const setIntervalSec = useCallback((v: number): void => {
    intervalSecRef.current = v
    setIntervalSecState(v)
    countdownRef.current = v
    setCountdown(v)
  }, [])

  const setMaxAttempts = useCallback((v: number): void => {
    maxAttemptsRef.current = v
    setMaxAttemptsState(v)
  }, [])

  return {
    panelOpen,
    autoEnabled,
    intervalSec,
    maxAttempts,
    soundEnabled,
    countdown,
    attemptsDone,
    setPanelOpen,
    enable,
    disable,
    setIntervalSec,
    setMaxAttempts,
    setSoundEnabled
  }
}
