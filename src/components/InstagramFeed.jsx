import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import Papa from 'papaparse';

const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRPIRMd64886Y_7O6UXTTKhjHaXAsjqQTht0VQgiX5AgT3If31uQBvsmzNx0cyWGFajv4vKWUiLOHMw/pub?gid=0&single=true&output=csv';

const InstagramFeed = () => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    Papa.parse(sheetUrl, {
      download: true,
      header: true,
      complete: (results) => {
        setPosts(results.data);
      },
    });
  }, []);

  return (
    <div className="instagram-feed">
      <h2 className='info-back-heading'>Our Highlights</h2>
      <div className="feed-grid">
        {posts.map((post, index) => (
          <div key={index} className="post-card">
            <video src={post.image_url} alt={post.caption} controls />
            <p>{post.caption}</p>
            <span>{new Date(post.timestamp).toLocaleDateString()}</span>
          </div>
        ))}
      </div>
      <div className='social'>
        <h3>Follow Us</h3>
        <div className="social-icons">
          <Link to="https://www.facebook.com/reebspartythemes" target="_blank"><img src='/imgs/icons/facebook.svg' /></Link>
          <Link to="https://www.instagram.com/reebspartythemes_/" target="_blank"><img src='/imgs/icons/instagram.svg' /></Link>
          <Link to="https://www.tiktok.com/@reebspartythemes_" target="_blank"><img src='/imgs/icons/tiktok.svg' /></Link>
        </div>
      </div>
    </div>
  );
};

export default InstagramFeed;
