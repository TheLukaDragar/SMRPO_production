"use client"

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="min-h-[500px]">
        {children}
      </div>
    </div>
  );
} 