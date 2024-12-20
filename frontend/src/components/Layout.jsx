// src/components/Layout.jsx
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
  const location = useLocation();
  
  // Add paths where you don't want the navbar to show
  const hideNavbarPaths = [
    '/review/:logId', // for the review submission form
  ];

  // Check if current path should hide navbar
  const shouldHideNavbar = hideNavbarPaths.some(path => 
    location.pathname.includes(path)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {!shouldHideNavbar && <Navbar />}
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}