// (auth) group layout — 全螢幕置中
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      {children}
    </div>
  )
}
