'use client';

import { EventFilterProvider } from '@/components/events/EventFilterContext';

export default function AuditLayout({ children }: { children: React.ReactNode }) {
  return (
    <EventFilterProvider>
      <div className="dark min-h-screen bg-background text-foreground">
        {children}
      </div>
    </EventFilterProvider>
  );
}
