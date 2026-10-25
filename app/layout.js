import './globals.css';

export const metadata = {
  title: 'Bukan Hannz Membership',
  description: 'Membership System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
      </head>
      <body>{children}</body>
    </html>
  );
}
