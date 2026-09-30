export default async function SettingsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
      {children}
    </div>
  );
}
