import { usePreviewTheme } from './ThemePreviewProvider'
import { PreviewButton } from './PreviewButton'

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
      <div className="flex gap-2 flex-wrap">
        <PreviewButton variant="primary">Get Started</PreviewButton>
        <PreviewButton variant="outline">Learn More</PreviewButton>
        <PreviewButton variant="primary" disabled>Disabled</PreviewButton>
      </div>
    </div>
  )
}
