import './globals.css'; // Your global styles

export const metadata = {
  title: 'HuddleUp',
  description: 'Availability App',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}