import type {Metadata} from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-display' });

export const metadata: Metadata = {
  title: 'Multi-Agent AI Hub',
  description: 'Plataforma profissional com múltiplos agentes de IA especializados.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="font-sans antialiased bg-zinc-50 text-zinc-900" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
