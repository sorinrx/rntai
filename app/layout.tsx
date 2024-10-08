import './globals.css';
import { Inter } from 'next/font/google';
import Warnings from './components/warnings';
import { assistantId } from './assistant-config';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Asistent AI - RENET',
  description: 'Asistent OpenAi pentru agentii Renet',
  icons: {
    icon: '/logoR.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {assistantId ? children : <Warnings />}
        <img src="/logoR.svg" alt="Renet Logo" />
      </body>
    </html>
  );
}