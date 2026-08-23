import { Toaster } from "@/components/ui/toaster";
import "@/app/globals.css";
import StoreProvider from "../(app)/StoreProvider";
export const metadata = {
  title: "Anonytalks",
  description: "Developed by bharatesh",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <StoreProvider>{children}</StoreProvider>
        <Toaster />
      </body>
    </html>
  );
}
