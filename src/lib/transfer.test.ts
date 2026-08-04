import { describe, expect, test } from 'bun:test'
import { decodeScore, encodeScore } from './transfer'
import type { Draft } from '../types'

const draft: Draft = {
  id: 'ignored',
  name: 'Box breathing',
  segments: [
    { id: 'a', seconds: 5, text: 'Breathe in.\nHold it.' },
    { id: 'b', seconds: 8, text: 'Now let it go slowly, all the way out.' },
    { id: 'c', seconds: 8, text: 'Again.' },
  ],
}

describe('encodeScore', () => {
  test('produces a single-line token', async () => {
    const token = await encodeScore(draft)
    expect(token.startsWith('PS1.')).toBe(true)
    expect(token).not.toInclude('\n')
    expect(token).not.toInclude(' ')
    expect(token).not.toInclude('"')
  })

  test('is compact enough to paste into a chat', async () => {
    const token = await encodeScore(draft)
    const pretty = JSON.stringify(draft, null, 2)
    expect(token.length).toBeLessThan(pretty.length / 2)
  })
})

describe('round trip', () => {
  test('restores name and segments', async () => {
    const back = await decodeScore(await encodeScore(draft))
    expect(back).not.toBeNull()
    expect(back!.name).toBe('Box breathing')
    expect(back!.segments.map((s) => [s.seconds, s.text])).toEqual(
      draft.segments.map((s) => [s.seconds, s.text]),
    )
  })

  test('newlines in the text survive', async () => {
    const back = await decodeScore(await encodeScore(draft))
    expect(back!.segments[0].text).toBe('Breathe in.\nHold it.')
  })

  test('imports arrive unsaved with fresh ids', async () => {
    const back = await decodeScore(await encodeScore(draft))
    expect(back!.id).toBeNull()
    expect(back!.segments.map((s) => s.id)).not.toEqual(['a', 'b', 'c'])
  })

  test('tolerates surrounding whitespace from a sloppy paste', async () => {
    const token = await encodeScore(draft)
    expect(await decodeScore(`  \n${token}\n  `)).not.toBeNull()
  })

  test('an unnamed score round-trips', async () => {
    const back = await decodeScore(await encodeScore({ ...draft, name: '   ' }))
    expect(back!.name).toBe('')
  })
})

describe('hand-written JSON still imports', () => {
  test('verbose form', async () => {
    const back = await decodeScore('{"name":"Hi","segments":[{"seconds":3,"text":"Go"}]}')
    expect(back!.name).toBe('Hi')
    expect(back!.segments).toHaveLength(1)
    expect(back!.segments[0].seconds).toBe(3)
  })

  test('compact form', async () => {
    const back = await decodeScore('{"n":"Hi","s":[[3,"Go"]]}')
    expect(back!.segments[0].text).toBe('Go')
  })

  test('a bare array of segments', async () => {
    const back = await decodeScore('[[3,"Go"],[4,"Stop"]]')
    expect(back!.segments).toHaveLength(2)
    expect(back!.name).toBe('')
  })
})

describe('rejects what is not a score', () => {
  test.each([
    ['empty', ''],
    ['whitespace', '   '],
    ['prose', 'hey, what time are we meeting?'],
    ['a bare number', '42'],
    ['unrelated json', '{"foo":"bar"}'],
    ['no segments', '{"name":"Hi","segments":[]}'],
    ['a negative duration', '{"s":[[-1,"Go"]]}'],
    ['a missing text', '{"s":[[5]]}'],
    ['a corrupt token', 'PS1.notreallybase64!!'],
  ])('%s', async (_label, input) => {
    expect(await decodeScore(input)).toBeNull()
  })
})
