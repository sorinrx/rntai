// app/layout.tsx
import { Inter } from "next/font/google";
import "./globals.css";
import Warnings from "./components/warnings";
import { assistantId } from "./assistant-config";
import ClientLayout from "./client-layout";  // Importăm componenta client-side


const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Asistent AI - RENET",
  description: "Asistent OpenAi pentru agentii Renet",
  icons: {
    icon: "/logoR.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientLayout>
          {assistantId ? children : <Warnings />}
          <img className="logo" src="/logoR.svg" alt="Renet Logo" />
        </ClientLayout>
      </body>
    </html>
  );
}
