import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Statistics from './pages/Statistics';
import Logs from './pages/Logs';
import Redirect from './pages/Redirect';
import { logger } from './utils/logger';

function App() {
  useEffect(() => {
    // Initialize the logger
    logger.initialize();
    logger.info('Application started', { version: '1.0.0' }, 'App');
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Header />
        <main className="py-8 px-4 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="/s/:shortCode" element={<Redirect />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;