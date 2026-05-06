'use client';

import * as React from 'react';
import { SessionProvider } from 'next-auth/react';

export default function AppSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider>{children}</SessionProvider>;
}
