import './globals.css';
export const metadata = { title: 'IFAGRITHM | Company memory', description: 'Internal operating system MVP', robots: { index: false, follow: false } };
export default function Layout({children}: {children: React.ReactNode}) { return <html lang="en"><body>{children}</body></html>; }
