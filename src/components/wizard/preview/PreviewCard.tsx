import { usePreviewTheme } from './ThemePreviewProvider'

export function PreviewCard() {
  const { theme } = usePreviewTheme()

  return (
    <div
      className="p-4 bg-white border shadow-sm"
      style={{
        borderRadius: `var(--preview-radius, ${theme.radius})`,
        fontFamily: `var(--preview-font, ${theme.fontFamily})`,
      }}
    >
      <h3 className="font-semibold text-base mb-1">Welcome Back</h3>
      <p className="text-sm text-gray-600 mb-4">
        Your dashboard is ready. Start exploring your data.
      </p>
      <div className="flex gap-2">
        <button
          className="px-4 py-2 text-sm font-medium text-white transition-colors"
          style={{
            backgroundColor: `var(--preview-primary, ${theme.primary})`,
            borderRadius: `var(--preview-radius, ${theme.radius})`,
          }}
        >
          Get Started
        </button>
        <button
          className="px-4 py-2 text-sm font-medium border transition-colors"
          style={{
            borderColor: `var(--preview-secondary, ${theme.secondary})`,
            color: `var(--preview-secondary, ${theme.secondary})`,
            borderRadius: `var(--preview-radius, ${theme.radius})`,
          }}
        >
          Learn More
        </button>
      </div>
    </div>
  )
}
