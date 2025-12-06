import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { MainContent } from './MainContent'

interface AppLayoutProps {
  onUploadTokens: () => void
  onUploadSemanticBrand: () => void
  onAddTheme: () => void
  onDeleteTheme: (brandName: string) => void
  onAddColorFamily: () => void
  onOpenExporter?: () => void
  children?: React.ReactNode
}

export function AppLayout({
  onUploadTokens,
  onUploadSemanticBrand,
  onAddTheme,
  onDeleteTheme,
  onAddColorFamily,
  onOpenExporter,
  children,
}: AppLayoutProps) {
  return (
    <div className="h-screen w-screen flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar onAddTheme={onAddTheme} onDeleteTheme={onDeleteTheme} onAddColorFamily={onAddColorFamily} />

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onUploadTokens={onUploadTokens}
          onUploadSemanticBrand={onUploadSemanticBrand}
          onOpenExporter={onOpenExporter}
        />
        <MainContent onUploadTokens={onUploadTokens}>
          {children}
        </MainContent>
      </div>
    </div>
  )
}
