import './globals.css';
import Script from 'next/script';

export const metadata = {
  title: 'Bukan Hannz Membership',
  description: 'Membership System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <Script 
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" 
          strategy="afterInteractive" 
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
