import { describe, expect, test } from 'bun:test'
import { formatCountdown, formatDuration, formatHuman, parseDuration } from './time'

describe('parseDuration', () => {
  test('accepts a bare seconds count', () => {
    expect(parseDuration('5')).toBe(5)
    expect(parseDuration('90')).toBe(90)
  })

  test('accepts mm:ss and hh:mm:ss', () => {
    expect(parseDuration('1:30')).toBe(90)
    expect(parseDuration('2:05:00')).toBe(7500)
    expect(parseDuration('00:00:05')).toBe(5)
  })

  test('lets the leading unit overflow but not the rest', () => {
    expect(parseDuration('90:00')).toBe(5400)
    expect(parseDuration('1:90')).toBeNull()
    expect(parseDuration('1:00:75')).toBeNull()
  })

  test('rejects junk', () => {
    expect(parseDuration('')).toBeNull()
    expect(parseDuration('abc')).toBeNull()
    expect(parseDuration('1:2:3:4')).toBeNull()
    expect(parseDuration('-5')).toBeNull()
    expect(parseDuration('1.5')).toBeNull()
  })

  test('tolerates surrounding whitespace', () => {
    expect(parseDuration('  1:30  ')).toBe(90)
  })
})

describe('formatting', () => {
  test('formatDuration is always canonical hh:mm:ss', () => {
    expect(formatDuration(5)).toBe('00:00:05')
    expect(formatDuration(90)).toBe('00:01:30')
    expect(formatDuration(7500)).toBe('02:05:00')
  })

  test('formatCountdown widens only past an hour', () => {
    expect(formatCountdown(0)).toBe('00:00')
    expect(formatCountdown(1500)).toBe('00:02') // ceil — the last second still reads 1
    expect(formatCountdown(90_000)).toBe('01:30')
    expect(formatCountdown(3_600_000)).toBe('1:00:00')
  })

  test('formatHuman picks a sensible unit', () => {
    expect(formatHuman(45)).toBe('45s')
    expect(formatHuman(200)).toBe('3m 20s')
    expect(formatHuman(3840)).toBe('1h 04m')
  })
})

describe('round-tripping', () => {
  test('parse(format(n)) === n', () => {
    for (const n of [0, 1, 59, 60, 61, 3599, 3600, 7500, 86_399]) {
      expect(parseDuration(formatDuration(n))).toBe(n)
    }
  })
})
