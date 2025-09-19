import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ClickSpark from './components/ClickSpark';

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
      <Footer />
    </>
  );
}

function App() {
  return (
    <ClickSpark
          sparkColor='#f1620b'
          sparkSize={14}
          sparkRadius={25}
          sparkCount={8}
          duration={400}
        >
        <Router>
          <AppLayout />
        </Router>
    </ClickSpark>
  );
}
export default App;

