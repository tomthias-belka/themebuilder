import { usePreviewTheme } from './ThemePreviewProvider'

export function PreviewChat() {
  const { theme } = usePreviewTheme()

  return (
    <div
      className="p-4 bg-white border shadow-sm flex flex-col"
      style={{
        borderRadius: `var(--preview-radius, ${theme.radius})`,
        fontFamily: `var(--preview-font, ${theme.fontFamily})`,
      }}
    >
      <h3 className="font-semibold text-base mb-3">Messages</h3>

      <div className="flex-1 space-y-3">
        {/* Received message */}
        <div className="flex gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0"
            style={{ backgroundColor: `var(--preview-secondary, ${theme.secondary})` }}
          >
            JD
          </div>
          <div
            className="px-3 py-2 text-sm max-w-[80%]"
            style={{
              backgroundColor: `var(--preview-secondary-soft, ${theme.secondarySoft})`,
              borderRadius: `var(--preview-radius, ${theme.radius})`,
            }}
          >
            Hey! How's the project going?
          </div>
        </div>

        {/* Sent message */}
        <div className="flex gap-2 justify-end">
          <div
            className="px-3 py-2 text-sm text-white max-w-[80%]"
            style={{
              backgroundColor: `var(--preview-primary, ${theme.primary})`,
              borderRadius: `var(--preview-radius, ${theme.radius})`,
            }}
          >
            Great! Almost finished with the design.
          </div>
        </div>

        {/* Received message */}
        <div className="flex gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0"
            style={{ backgroundColor: `var(--preview-secondary, ${theme.secondary})` }}
          >
            JD
          </div>
          <div
            className="px-3 py-2 text-sm max-w-[80%]"
            style={{
              backgroundColor: `var(--preview-secondary-soft, ${theme.secondarySoft})`,
              borderRadius: `var(--preview-radius, ${theme.radius})`,
            }}
          >
            Awesome! Can't wait to see it 🎉
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="mt-3 flex gap-2">
        <input
          type="text"
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 text-sm border"
          style={{
            borderRadius: `var(--preview-radius, ${theme.radius})`,
            borderColor: '#e5e7eb',
          }}
        />
        <button
          className="px-3 py-2 text-white"
          style={{
            backgroundColor: `var(--preview-primary, ${theme.primary})`,
            borderRadius: `var(--preview-radius, ${theme.radius})`,
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}
