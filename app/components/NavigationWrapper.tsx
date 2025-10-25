'use client';

import dynamic from 'next/dynamic';

// ✅ Dynamic import mit ssr:false in Client Component
const Navigation = dynamic(() => import('./Navigation'), {
  ssr: false,
  loading: () => <div className="h-20 bg-slate-900" />,
});

export default function NavigationWrapper() {
  return <Navigation />;
}