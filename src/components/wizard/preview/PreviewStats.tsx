import { usePreviewTheme } from './ThemePreviewProvider'

export function PreviewStats() {
  const { theme } = usePreviewTheme()

  return (
    <div
      className="p-4 bg-white border shadow-sm"
      style={{
        borderRadius: `var(--preview-radius, ${theme.radius})`,
        fontFamily: `var(--preview-font, ${theme.fontFamily})`,
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500">Total Revenue</span>
        <span
          className="text-xs font-medium px-2 py-0.5"
          style={{
            backgroundColor: `var(--preview-accent-soft, ${theme.accentSoft})`,
            color: `var(--preview-accent, ${theme.accent})`,
            borderRadius: '9999px',
          }}
        >
          +12.5%
        </span>
      </div>

      <div
        className="text-3xl font-bold mb-3"
        style={{ color: `var(--preview-primary, ${theme.primary})` }}
      >
        $48,352
      </div>

      {/* Mini bar chart */}
      <div className="flex items-end gap-1 h-12">
        {[40, 65, 45, 80, 55, 70, 90].map((height, i) => (
          <div
            key={i}
            className="flex-1 transition-all"
            style={{
              height: `${height}%`,
              backgroundColor:
                i === 6
                  ? `var(--preview-primary, ${theme.primary})`
                  : `var(--preview-primary-soft, ${theme.primarySoft})`,
              borderRadius: '2px',
            }}
          />
        ))}
      </div>

      <div className="flex justify-between mt-2 text-xs text-gray-400">
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
        <span>Sun</span>
      </div>
    </div>
  )
}
