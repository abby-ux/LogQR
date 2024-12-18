// src/components/PrivateRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';

export default function PrivateRoute({ user }) {
  //  outlet displays which route is currently acitve
  return user ? <Outlet /> : <Navigate to="/login" />;
}