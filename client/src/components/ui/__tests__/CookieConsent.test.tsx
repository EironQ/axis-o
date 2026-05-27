import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import CookieConsentProvider, { useCookieConsent } from '../CookieConsent'
import { type ReactNode } from 'react'

const COOKIE_KEY = 'axis-o-cookie-consent'

function TestChild() {
  const { hasConsented, preferences, showSettings } = useCookieConsent()
  return (
    <div>
      <span data-testid="has-consented">{String(hasConsented)}</span>
      <span data-testid="pref-essential">{String(preferences.essential)}</span>
      <span data-testid="pref-analytics">{String(preferences.analytics)}</span>
      <span data-testid="pref-marketing">{String(preferences.marketing)}</span>
      <button data-testid="open-settings" onClick={showSettings}>
        Open Settings
      </button>
    </div>
  )
}

function renderWithProvider(ui: ReactNode) {
  return render(<CookieConsentProvider>{ui}</CookieConsentProvider>)
}

describe('CookieConsent', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('Banner display logic', () => {
    it('should show cookie banner on first visit when no consent is stored', async () => {
      renderWithProvider(<TestChild />)

      await waitFor(() => {
        expect(screen.getByText('Cookie 设置')).toBeTruthy()
      })
      expect(screen.getByText('接受全部')).toBeTruthy()
      expect(screen.getByText('仅必要')).toBeTruthy()
      expect(screen.getByText('自定义')).toBeTruthy()
      expect(screen.getByText(/我们使用 Cookie 来提升您的浏览体验/)).toBeTruthy()
    })

    it('should NOT show cookie banner when user has already consented', async () => {
      const existingPrefs = {
        preferences: { essential: true, analytics: false, marketing: false },
        version: 1,
      }
      localStorage.setItem(COOKIE_KEY, JSON.stringify(existingPrefs))

      renderWithProvider(<TestChild />)

      await waitFor(() => {
        expect(screen.getByTestId('has-consented').textContent).toBe('true')
      })
      expect(screen.queryByText('接受全部')).toBeNull()
      expect(screen.queryByText(/我们使用 Cookie/)).toBeNull()
    })

    it('should not show banner with malformed localStorage data', async () => {
      localStorage.setItem(COOKIE_KEY, 'invalid-json')

      renderWithProvider(<TestChild />)

      await waitFor(() => {
        expect(screen.getByText('Cookie 设置')).toBeTruthy()
      })
    })
  })

  describe('Accept All', () => {
    it('should save all preferences and hide banner when "接受全部" is clicked', async () => {
      renderWithProvider(<TestChild />)

      await waitFor(() => {
        expect(screen.getByText('接受全部')).toBeTruthy()
      })

      fireEvent.click(screen.getByText('接受全部'))

      await waitFor(() => {
        expect(screen.queryByText('接受全部')).toBeNull()
      })

      const stored = JSON.parse(localStorage.getItem(COOKIE_KEY)!)
      expect(stored.preferences.essential).toBe(true)
      expect(stored.preferences.analytics).toBe(true)
      expect(stored.preferences.marketing).toBe(true)
      expect(stored.version).toBe(1)

      expect(screen.getByTestId('has-consented').textContent).toBe('true')
      expect(screen.getByTestId('pref-analytics').textContent).toBe('true')
      expect(screen.getByTestId('pref-marketing').textContent).toBe('true')
    })
  })

  describe('Reject All', () => {
    it('should save only essential preferences and hide banner when "仅必要" is clicked', async () => {
      renderWithProvider(<TestChild />)

      await waitFor(() => {
        expect(screen.getByText('仅必要')).toBeTruthy()
      })

      fireEvent.click(screen.getByText('仅必要'))

      await waitFor(() => {
        expect(screen.queryByText('仅必要')).toBeNull()
      })

      const stored = JSON.parse(localStorage.getItem(COOKIE_KEY)!)
      expect(stored.preferences.essential).toBe(true)
      expect(stored.preferences.analytics).toBe(false)
      expect(stored.preferences.marketing).toBe(false)

      expect(screen.getByTestId('pref-analytics').textContent).toBe('false')
      expect(screen.getByTestId('pref-marketing').textContent).toBe('false')
    })
  })

  describe('Custom Settings Modal', () => {
    it('should open settings modal when "自定义" is clicked', async () => {
      renderWithProvider(<TestChild />)

      await waitFor(() => {
        expect(screen.getByText('自定义')).toBeTruthy()
      })

      fireEvent.click(screen.getByText('自定义'))

      await waitFor(() => {
        expect(screen.getByText('Cookie 设置')).toBeTruthy()
      })

      expect(screen.getByText('必要 Cookie')).toBeTruthy()
      expect(screen.getByText('分析 Cookie')).toBeTruthy()
      expect(screen.getByText('营销 Cookie')).toBeTruthy()
    })

    it('should close settings modal when clicking the close button', async () => {
      renderWithProvider(<TestChild />)

      await waitFor(() => {
        expect(screen.getByText('自定义')).toBeTruthy()
      })

      fireEvent.click(screen.getByText('自定义'))

      await waitFor(() => {
        expect(screen.getByLabelText('关闭')).toBeTruthy()
      })

      fireEvent.click(screen.getByLabelText('关闭'))

      await waitFor(() => {
        expect(screen.queryByLabelText('关闭')).toBeNull()
      })
    })

    it('should save custom preferences and hide banner on "保存设置"', async () => {
      renderWithProvider(<TestChild />)

      await waitFor(() => {
        expect(screen.getByText('自定义')).toBeTruthy()
      })

      fireEvent.click(screen.getByText('自定义'))

      await waitFor(() => {
        expect(screen.getByText('保存设置')).toBeTruthy()
      })

      fireEvent.click(screen.getByText('保存设置'))

      await waitFor(() => {
        expect(screen.queryByText('保存设置')).toBeNull()
      })

      const stored = JSON.parse(localStorage.getItem(COOKIE_KEY)!)
      expect(stored.preferences.essential).toBe(true)
      expect(stored.preferences.analytics).toBe(false)
      expect(stored.preferences.marketing).toBe(false)
    })

    it('should accept all via modal by toggling analytics and marketing on then saving', async () => {
      renderWithProvider(<TestChild />)

      await waitFor(() => {
        expect(screen.getByText('自定义')).toBeTruthy()
      })

      fireEvent.click(screen.getByText('自定义'))

      await waitFor(() => {
        expect(screen.getByText('保存设置')).toBeTruthy()
      })

      const checkboxes = screen.getAllByRole('checkbox')
      expect(checkboxes).toHaveLength(3)

      fireEvent.click(checkboxes[1])
      fireEvent.click(checkboxes[2])

      fireEvent.click(screen.getByText('保存设置'))

      await waitFor(() => {
        expect(screen.queryByText('保存设置')).toBeNull()
      })

      const stored = JSON.parse(localStorage.getItem(COOKIE_KEY)!)
      expect(stored.preferences.essential).toBe(true)
      expect(stored.preferences.analytics).toBe(true)
      expect(stored.preferences.marketing).toBe(true)
    })
  })

  describe('Essential cookie toggle is always disabled', () => {
    it('should have the essential checkbox disabled in the settings modal', async () => {
      renderWithProvider(<TestChild />)

      await waitFor(() => {
        expect(screen.getByText('自定义')).toBeTruthy()
      })

      fireEvent.click(screen.getByText('自定义'))

      await waitFor(() => {
        expect(screen.getByText('始终启用')).toBeTruthy()
      })

      const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[]
      expect(checkboxes).toHaveLength(3)
      expect(checkboxes[0].disabled).toBe(true)
      expect(checkboxes[0].checked).toBe(true)
    })
  })

  describe('Footer integration', () => {
    it('should open settings from useCookieConsent showSettings() without banner visible', async () => {
      const existingPrefs = {
        preferences: { essential: true, analytics: false, marketing: false },
        version: 1,
      }
      localStorage.setItem(COOKIE_KEY, JSON.stringify(existingPrefs))

      renderWithProvider(<TestChild />)

      await waitFor(() => {
        expect(screen.getByTestId('has-consented').textContent).toBe('true')
      })

      expect(screen.queryByText('接受全部')).toBeNull()

      fireEvent.click(screen.getByTestId('open-settings'))

      await waitFor(() => {
        expect(screen.getByText('必要 Cookie')).toBeTruthy()
      })
    })
  })

  describe('useCookieConsent outside provider', () => {
    it('should return default values when used outside provider', () => {
      function Standalone() {
        const { preferences, hasConsented } = useCookieConsent()
        return (
          <div>
            <span data-testid="outside-consented">{String(hasConsented)}</span>
            <span data-testid="outside-essential">{String(preferences.essential)}</span>
            <span data-testid="outside-analytics">{String(preferences.analytics)}</span>
          </div>
        )
      }

      render(<Standalone />)

      expect(screen.getByTestId('outside-consented').textContent).toBe('false')
      expect(screen.getByTestId('outside-essential').textContent).toBe('true')
      expect(screen.getByTestId('outside-analytics').textContent).toBe('false')
    })
  })
})
