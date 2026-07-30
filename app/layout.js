import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import BootstrapClient from "@/components/BootstrapClient";

export const metadata = {
  title: "Brew & Bean Coffee",
  description: "Order your coffee online",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <CartProvider>{children}</CartProvider>
        </AuthProvider>
        <BootstrapClient />
      </body>
    </html>
  );
}
