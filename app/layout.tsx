import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Trent's Command Center",
  description: 'Agent operations hub — Michael Shelden',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#020408' }}>
        {children}
      </body>
    </html>
  )
}
