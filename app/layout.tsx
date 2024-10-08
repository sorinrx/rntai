import { Inter } from "next/font/google";
import "./globals.css";
import Warnings from "./components/warnings";
import { assistantId } from "./assistant-config";
import ClientLayout from "./client-layout";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Assistants API Quickstart",
  description: "A quickstart template using the Assistants API with OpenAI",
  icons: {
    icon: "/openai.svg",
  },
};

function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientLayout>
          {assistantId ? children : <Warnings />}
          {/* eslint-disable @next/next/no-img-element */}
          <img className="logo" src="/logoR.svg" alt="Renet Logo" />
          {/* eslint-enable @next/next/no-img-element */}
        </ClientLayout>
      </body>
    </html>
  );
}

export default RootLayout;