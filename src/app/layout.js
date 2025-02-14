import { AuthProvider } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import './globals.css';

export const metadata = {
  title: 'Site d\'annonces',
  description: 'Plateforme pour poster et répondre aux annonces',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main>
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
