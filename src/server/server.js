// server/server.js

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
app.use('/api/auth', authRoutes);

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// client/src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import SignIn from './pages/SignIn';
import Home from './pages/Home';
import CreateLog from './pages/CreateLog';
import ViewLog from './pages/ViewLog';

function App() {
  const [user, setUser] = useState(null);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/signin" element={<SignIn setUser={setUser} />} />
        <Route path="/" element={<Home user={user} />} />
        <Route path="/create" element={<CreateLog user={user} />} />
        <Route path="/log/:id" element={<ViewLog />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

// client/src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;