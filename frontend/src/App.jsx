import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'; // router
import { useState, useEffect } from 'react'; // react hooks
import { onAuthStateChanged } from 'firebase/auth'; // firebase
import { auth } from './firebase';
import Layout from './components/Layout';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Home from './pages/Home';
import CreateLog from './pages/CreateLog';
import ViewLogs from './pages/ViewLogs';
import PrivateRoute from './components/PrivateRoute';

export default function App() {
    // initial value of user is set to null, we can use setUser to change that value
  const [user, setUser] = useState(null); // who is logged in
  const [loading, setLoading] = useState(true); // are we checking for information currently 

  // useEffect , [] - tells react to run this only when the component first appears
  useEffect(() => {
    // user is a function firebase will call whenever the auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user); // set the user (to a user or none)
      setLoading(false); // done checking for a user
    });

    // stop watching for changes in who logs in/out, (unsubcribe is a firebase function) when the component goes away
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        {/* login/signup can be accessed by everyone, and logging in users will automatically be redirected to the home page */}
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/signup" element={!user ? <SignUp /> : <Navigate to="/" />} />
        {/* wrap all protected routes in a layout component, containing the basic structure of the website */}
        <Route element={<Layout />}>
            {/* check if user is authenticated before accessing private routes */}
          <Route element={<PrivateRoute user={user} />}>
            <Route path="/" element={<Home />} />
            <Route path="/create-log" element={<CreateLog />} />
            <Route path="/view-logs" element={<ViewLogs />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}