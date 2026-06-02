// (main) group layout — 後續放 Nav + Sidebar
export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col h-full bg-bg">
      {children}
    </div>
  )
}
