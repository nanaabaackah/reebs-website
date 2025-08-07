import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Navbar from './components/Navbar';
import Footer from './components/Footer';

import Home from './pages/Home';
import About from './pages/About';
import Shop from './pages/Shop';
import Rentals from './pages/Rentals';
import Gallery from './pages/Gallery';
import FAQ from './pages/faq';
import Contact from './pages/Contact';
import PrivacyPolicy from './pages/privacy-policy';

function AppLayout() {
  return (
    <>
    <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/About" element={<About />} />
          <Route path="/Shop" element={<Shop />} />
          <Route path="/Rentals" element={<Rentals />} />
          <Route path="/Gallery" element={<Gallery />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/Contact" element={<Contact />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}
export default App;

