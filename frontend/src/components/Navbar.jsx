// src/components/Navbar.jsx
import { useState, useEffect } from 'react';
// useState - for maintaining component-level states, like is the user logged in
// useEffect - perform tasks at certain times/when certain dependencies change within the component 
import { Link, useNavigate } from 'react-router-dom';
// link - creates links, useNavigate - gives navigation control
import { auth } from '../firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { UserCircle } from 'lucide-react';

// nav bar component
export default function Navbar() {
  // function we can use to change route in the application
  const navigate = useNavigate(); // sets up navigation
  const [user, setUser] = useState(null); // sets user to null

  // sets up a subscription to firebase authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  // logs out using firebase and navigates to login page
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
          {/* if a user is signed in, then show the log links */}
          {user ? (
            <div className="flex items-center space-x-6">
              <Link 
                to="/create-log" 
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Create Log
              </Link>
              <Link 
                to="/view-logs" 
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                View Logs
              </Link>
            </div>
          ) : null}
        <div className="flex items-center space-x-4">
          {/* if user is signed in, show user's name, otherwise show sign in link */}
            {user ? (
              <>
                <div className="flex items-center space-x-2">
                  <UserCircle className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-700">{user.displayName || user.email}</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link 
                to="/login"
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Sign in
              </Link>
            )}
          </div>

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