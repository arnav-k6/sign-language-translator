import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Intro from './pages/Intro';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Workspace from './pages/Workspace';
import './App.css';

function App() {
  const location = useLocation();
  const isProductPage = location.pathname === '/product';

  return (
    <div className="app-shell">
      <Navbar />
      <main className="content" style={{ paddingTop: '80px' }}>
        <AnimatePresence mode="sync">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Intro />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/product" element={<Workspace />} />
          </Routes>
        </AnimatePresence>
      </main>
      {!isProductPage && <Footer />}
    </div>
  );
}

export default App;
