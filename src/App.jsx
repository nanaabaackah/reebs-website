import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ClickSpark from './components/ClickSpark';

import { CartProvider } from "./components/CartContext";
import Navbar from "./components/Navbar";
import CartOverlay from "./components/CartOverlay";

import Footer from './components/Footer';

import Home from './pages/Home';
import About from './pages/About';
import Shop from './pages/Shop';
import Rentals from './pages/Rentals';
import Gallery from './pages/Gallery';
import FAQ from './pages/faq';
import Contact from './pages/Contact';
import PrivacyPolicy from './pages/privacy-policy';
import Cart from "./pages/Cart";

function AppLayout() {
  const [cartOpen, setCartOpen] = useState(false);
  return (
    <>
     <CartProvider>
        <Navbar onCartToggle={() => setCartOpen(true)} />
       
          <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/Cart" element={<Cart />} />
              <Route path="/About" element={<About />} />
              <Route path="/Shop" element={<Shop />} />
              <Route path="/Rentals" element={<Rentals />} />
              <Route path="/Gallery" element={<Gallery />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/Contact" element={<Contact />} />
          </Routes>
          <CartOverlay 
            open={cartOpen} 
            onClose={() => setCartOpen(false)} 
            convertPrice={(p) => p} // pass your conversion fn
            formatCurrency={(p) => p} // pass your format fn
          />
        <Footer />
      </CartProvider>
      
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

