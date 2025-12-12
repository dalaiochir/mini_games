import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import "./globals.css";

export const metadata = {
  title: "Games Web App",
  description: "Simple web games built with Next.js",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <div className="container">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
