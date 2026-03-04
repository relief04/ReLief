import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { ClerkProvider } from '@clerk/nextjs'
import { LiveBackground } from "@/components/features/LiveBackground";
// import { AuthProvider } from "@/components/providers/AuthProvider";
import { GlobalAudioProvider } from "@/components/providers/GlobalAudioProvider";
import { AutoLogout } from "@/components/providers/AutoLogout";
import { AIAssistant } from "@/components/ai/AIAssistant";
import { ProfileSyncWrapper } from "@/components/providers/ProfileSyncWrapper";
import { Footer } from "@/components/layout/Footer";
import { ToastProvider } from "@/context/ToastContext";
import { RefreshProvider } from "@/context/RefreshContext";
import { Toaster } from "react-hot-toast";


const outfit = Outfit({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ReLief",
  description: "Track your carbon footprint, join eco-challenges, and visualize your impact on the planet.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.variable} ${jakarta.variable}`} suppressHydrationWarning>
        <ClerkProvider>
          {/* <AutoLogout /> - Removed to fix session persistence */}
          <GlobalAudioProvider>
            <ToastProvider>
              <RefreshProvider>
                <ProfileSyncWrapper>
                  <div className="desktop-content-wrapper">
                    <LiveBackground />
                    <Navbar />
                    <main className="animate-fade-in-up" style={{ flexGrow: 1, paddingTop: 'var(--nav-height)' }}>
                      {children}
                    </main>
                    <Footer />
                  </div>

                  {/* Mobile Blocker View */}
                  <div className="mobile-blocker-wrapper">
                    <div className="mobile-blocker-icon">💻</div>
                    <h1 className="mobile-blocker-title">Desktop Only Experience</h1>
                    <p className="mobile-blocker-text">
                      ReLief is currently optimized for desktop viewing to provide the best possible experience with our advanced eco-dashboard.
                      <br /><br />
                      Please access this platform on a device with a larger screen (desktop or laptop).
                    </p>
                  </div>

                  <AIAssistant />
                  <Toaster position="bottom-right" toastOptions={{
                    style: {
                      background: 'var(--color-bg-200)',
                      color: 'var(--color-text-100)',
                      border: '1px solid var(--color-border)',
                    }
                  }} />
                </ProfileSyncWrapper>
              </RefreshProvider>
            </ToastProvider>
          </GlobalAudioProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
