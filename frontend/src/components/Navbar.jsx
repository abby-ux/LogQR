// src/components/Navbar.jsx
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

// nav bar component
export default function Navbar() {
  // function we can use to change route in the application
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // sign user out and redirect them to the home page
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="bg-white shadow">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-xl font-bold">LogQR</Link>
          <Link to="/create-log" className="text-xl">Create Log</Link>
          <Link to="/view-logs" className="text-xl">View Logs</Link>
          <div className="flex items-center space-x-4">
            <button onClick={handleLogout} className="text-gray-600 hover:text-gray-900">
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}