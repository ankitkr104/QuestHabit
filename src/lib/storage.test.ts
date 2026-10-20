import { beforeEach, describe, expect, it, vi } from 'vitest'
import { STORAGE_KEY, loadState, saveState } from './storage'
import { blankState } from './game'

// Build a minimal valid state from the app's own helper
const validState = () => ({
  ...blankState(),
  profile: { ...blankState().profile, name: 'Tester' },
})

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('loadState', () => {
  it('returns a blank state when storage is empty', () => {
    const { state, recovered } = loadState()
    expect(recovered).toBe(false)
    expect(state).toEqual(blankState())
  })

  it('loads valid stored data', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(validState()))
    const { state, recovered } = loadState()
    expect(recovered).toBe(false)
    expect(state.profile.name).toBe('Tester')
  })

  it('recovers to a blank state on malformed JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{not valid json')
    const { state, recovered } = loadState()
    expect(recovered).toBe(true)
    expect(state).toEqual(blankState())
  })

  it('recovers when required top-level fields are missing', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ profile: { name: 'x' } }))
    const { recovered } = loadState()
    expect(recovered).toBe(true)
  })
})

describe('saveState', () => {
  it('serializes state under the questhabit.state key', () => {
    expect(saveState(validState())).toBe(true)
    expect(localStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify(validState()))
  })

  it('returns false when localStorage.setItem throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceeded')
    })
    expect(saveState(validState())).toBe(false)
  })
})