import { useState } from 'react'
import { usePreviewTheme } from './ThemePreviewProvider'
import { PreviewButton } from './PreviewButton'

export function PreviewForm() {
  const { theme } = usePreviewTheme()
  const [checked, setChecked] = useState(true)

  // Shared input styling with focus state handlers
  const getInputFocusHandlers = () => ({
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
      e.target.style.borderColor = theme.primary
      e.target.style.boxShadow = `0 0 0 2px ${theme.primarySoft}`
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
      e.target.style.borderColor = '#e5e7eb'
      e.target.style.boxShadow = 'none'
    },
  })

  return (
    <div
      className="p-4 bg-white border shadow-sm"
      style={{
        borderRadius: `var(--preview-radius, ${theme.radius})`,
        fontFamily: `var(--preview-font, ${theme.fontFamily})`,
      }}
    >
      <h3 className="font-semibold text-base mb-3">Contact Form</h3>

      <div className="space-y-3">
        {/* Input */}
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">
            Email
          </label>
          <input
            type="email"
            placeholder="you@example.com"
            className="w-full px-3 py-2 text-sm border focus:outline-none transition-all"
            style={{
              borderRadius: `var(--preview-radius, ${theme.radius})`,
              borderColor: '#e5e7eb',
            }}
            {...getInputFocusHandlers()}
          />
        </div>

        {/* Select */}
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">
            Subject
          </label>
          <select
            className="w-full px-3 py-2 text-sm border bg-white focus:outline-none transition-all"
            style={{
              borderRadius: `var(--preview-radius, ${theme.radius})`,
              borderColor: '#e5e7eb',
            }}
            {...getInputFocusHandlers()}
          >
            <option>General Inquiry</option>
            <option>Support</option>
            <option>Feedback</option>
          </select>
        </div>

        {/* Checkbox */}
        <label className="flex items-center gap-2 cursor-pointer group">
          <div
            className="w-4 h-4 border-2 flex items-center justify-center transition-all"
            style={{
              borderRadius: '4px',
              borderColor: checked ? theme.primary : '#d1d5db',
              backgroundColor: checked ? theme.primary : 'transparent',
            }}
            onClick={() => setChecked(!checked)}
          >
            {checked && (
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
          <span className="text-sm group-hover:text-gray-900 transition-colors">Subscribe to newsletter</span>
        </label>

        {/* Submit button */}
        <PreviewButton variant="primary" className="w-full">
          Send Message
        </PreviewButton>
      </div>
    </div>
  )
}
