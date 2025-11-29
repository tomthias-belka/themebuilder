import { usePreviewTheme } from './ThemePreviewProvider'

const mockData = [
  { name: 'John Doe', status: 'Active', date: '2024-01-15', amount: '$1,234' },
  { name: 'Jane Smith', status: 'Pending', date: '2024-01-14', amount: '$567' },
  { name: 'Bob Johnson', status: 'Active', date: '2024-01-13', amount: '$890' },
]

export function PreviewTable() {
  const { theme } = usePreviewTheme()

  return (
    <div
      className="bg-white border shadow-sm overflow-hidden"
      style={{
        borderRadius: `var(--preview-radius, ${theme.radius})`,
        fontFamily: `var(--preview-font, ${theme.fontFamily})`,
      }}
    >
      <table className="w-full text-sm">
        <thead>
          <tr
            style={{
              backgroundColor: `var(--preview-primary-soft, ${theme.primarySoft})`,
            }}
          >
            <th className="px-4 py-3 text-left font-medium text-gray-700">Name</th>
            <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
            <th className="px-4 py-3 text-left font-medium text-gray-700">Date</th>
            <th className="px-4 py-3 text-right font-medium text-gray-700">Amount</th>
          </tr>
        </thead>
        <tbody>
          {mockData.map((row, i) => (
            <tr key={i} className="border-t hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3">{row.name}</td>
              <td className="px-4 py-3">
                <span
                  className="inline-flex px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor:
                      row.status === 'Active'
                        ? `var(--preview-primary-soft, ${theme.primarySoft})`
                        : `var(--preview-accent-soft, ${theme.accentSoft})`,
                    color:
                      row.status === 'Active'
                        ? `var(--preview-primary-dark, ${theme.primaryDark})`
                        : `var(--preview-accent, ${theme.accent})`,
                    borderRadius: '9999px',
                  }}
                >
                  {row.status}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-500">{row.date}</td>
              <td className="px-4 py-3 text-right font-medium">{row.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
