import "./globals.css";
import Navbar from "../components/Navbar";
import { AuthProvider } from "../components/AuthProvider";

export const metadata = {
  title: "Codelens — AI Code Review",
  description:
    "Paste your code and get an instant, structured review: bugs, style issues, and fixes, powered by an AI review engine.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
