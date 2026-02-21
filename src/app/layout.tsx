import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import { loadCurrentUser } from "@/features/auth/server/load-current-user";
import { CurrentUserProvider } from "@/features/auth/context/current-user-context";
import { CapstoneAuthProvider } from "@/features/capstone-auth";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Capstone Topic Explorer",
  description: "AI-powered research topic discovery for KDI School students",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentUser = await loadCurrentUser();

  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="antialiased font-sans">
        <Providers>
          <CurrentUserProvider initialState={currentUser}>
            <CapstoneAuthProvider>
              {children}
              <Toaster />
            </CapstoneAuthProvider>
          </CurrentUserProvider>
        </Providers>
      </body>
    </html>
  );
}
