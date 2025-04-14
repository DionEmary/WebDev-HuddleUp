import "./globals.css";

export const metadata = {
  title: "HuddleUp",
  description: "A Website for scheduling and sorting out availability for any equation.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="">
        {children}
      </body>
    </html>
  );
}
