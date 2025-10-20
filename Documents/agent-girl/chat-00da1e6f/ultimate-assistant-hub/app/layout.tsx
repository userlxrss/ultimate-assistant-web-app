import './globals.css'

export const metadata = {
  title: 'Ultimate Assistant Hub API',
  description: 'Complete productivity and personal management system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}