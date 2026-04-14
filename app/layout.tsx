import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'StrategyAI - Premium Business Strategy Consulting',
  description: 'Get expert strategic insights powered by advanced AI. Market analysis, competitive positioning, and actionable recommendations in minutes.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="ambient-orb orb-1" />
        <div className="ambient-orb orb-2" />
        <div className="layout-container">
          <nav style={{
            position: 'sticky',
            top: 0,
            zIndex: 50,
            borderBottom: '1px solid var(--divider-color)',
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)', /* for Safari Support */
            padding: '16px 24px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              maxWidth: '90rem',
              margin: '0 auto'
            }}>
              <Link href="/" style={{ textDecoration: 'none' }}>
                <div className="font-display gradient-text" style={{ fontSize: '24px', fontWeight: 800 }}>
                  StrategyAI
                </div>
              </Link>
              
              {/* Optional: Render navigation if we had multiple pages. We can build it as a unified portal. */}
              <div style={{ display: 'flex', gap: '32px' }}>
                <Link href="/" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '14px', fontWeight: 500, transition: 'color 0.2s', borderBottom: '2px solid transparent' }}>
                  Consultant Portal
                </Link>
                {/* We'll use one unified app interface for simplicity and slickness */}
              </div>
            </div>
          </nav>
          
          <main style={{ flex: 1, padding: '40px 0' }}>
            {children}
          </main>
          
          <footer style={{
            borderTop: '1px solid var(--divider-color)',
            padding: '32px 24px',
            textAlign: 'center',
            color: 'var(--text-secondary)',
            fontSize: '14px'
          }}>
            <div className="max-w-6xl">
              © {new Date().getFullYear()} StrategyAI. Engineered with Next.js & Google Gemini Free Tier.
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
