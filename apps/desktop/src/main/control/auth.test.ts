import { describe, expect, it } from 'vitest'
import {
  extractBearerToken,
  isLoopbackRemoteAddress,
  tokensEqual,
  validateHostHeader,
  validateOriginHeader
} from './auth'
import type { IncomingMessage } from 'node:http'

function fakeReq(headers: Record<string, string | undefined>, remoteAddress = '127.0.0.1'): IncomingMessage {
  return {
    headers,
    socket: { remoteAddress }
  } as unknown as IncomingMessage
}

describe('control auth', () => {
  it('extracts bearer token', () => {
    expect(extractBearerToken(fakeReq({ authorization: 'Bearer abc.def' }))).toBe('abc.def')
    expect(extractBearerToken(fakeReq({}))).toBeNull()
  })

  it('compares tokens in constant time for equal length', () => {
    expect(tokensEqual('aaaa', 'aaaa')).toBe(true)
    expect(tokensEqual('aaaa', 'bbbb')).toBe(false)
    expect(tokensEqual('a', 'aa')).toBe(false)
  })

  it('validates Host header against loopback + port', () => {
    expect(validateHostHeader(fakeReq({ host: '127.0.0.1:19847' }), 19847)).toBe(true)
    expect(validateHostHeader(fakeReq({ host: 'localhost:19847' }), 19847)).toBe(true)
    expect(validateHostHeader(fakeReq({ host: 'evil.example:19847' }), 19847)).toBe(false)
    expect(validateHostHeader(fakeReq({ host: '127.0.0.1:9999' }), 19847)).toBe(false)
  })

  it('allows missing Origin and rejects non-loopback Origin', () => {
    expect(validateOriginHeader(fakeReq({}))).toBe(true)
    expect(validateOriginHeader(fakeReq({ origin: 'http://127.0.0.1:3000' }))).toBe(true)
    expect(validateOriginHeader(fakeReq({ origin: 'https://evil.example' }))).toBe(false)
  })

  it('detects loopback remote addresses', () => {
    expect(isLoopbackRemoteAddress('127.0.0.1')).toBe(true)
    expect(isLoopbackRemoteAddress('::1')).toBe(true)
    expect(isLoopbackRemoteAddress('::ffff:127.0.0.1')).toBe(true)
    expect(isLoopbackRemoteAddress('192.168.1.1')).toBe(false)
  })
})
