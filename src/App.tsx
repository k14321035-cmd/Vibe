import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import LobbyPage from './pages/LobbyPage';
import RoomPage from './pages/RoomPage';
import ProtectedRoute from './components/ProtectedRoute';

import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useNavigate, useLocation } from 'react-router-dom';

function BackButtonHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const setupListener = async () => {
      const listener = await CapacitorApp.addListener('backButton', ({ canGoBack }) => {
        // Exit app if on root or lobby
        if (location.pathname === '/' || location.pathname === '/lobby') {
          CapacitorApp.exitApp();
        } else if (canGoBack) {
          navigate(-1);
        } else {
          CapacitorApp.exitApp();
        }
      });
      return listener;
    };

    const listenerPromise = setupListener();

    return () => {
      listenerPromise.then(l => l.remove());
    };
  }, [location, navigate]);

  return null;
}

export default function App() {

  return (
    <Router>
      <BackButtonHandler />
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/lobby" element={<LobbyPage />} />
          <Route 
            path="/room/:roomId" 
            element={
              <ProtectedRoute>
                <RoomPage />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
