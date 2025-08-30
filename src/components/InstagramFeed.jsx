import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const sheetApiUrl = "https://api.sheetbest.com/sheets/19c80589-7844-45d8-8ec4-79d0d264bf1b";

const InstagramFeed = () => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetch(sheetApiUrl)
      .then((res) => res.json())
      .then((data) => {
        // Reverse to get newest posts first, then take latest 3
        const latestPosts = [...data].reverse().slice(0, 3);
        setPosts(latestPosts);
      })
      .catch((err) => console.error("Failed to fetch Instagram posts:", err));
  }, []);

  return (
    <div className="instagram-feed">
      <h2 className="info-back-heading">Our Highlights</h2>
      <div className="feed-grid">
        {posts.map((post, index) => (
          <a
            key={index}
            href={post.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="post-card"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            {post.media_type === "VIDEO" ? (
              <video
                src={post.media_url}
                alt={post.caption || "Instagram video"}
              />
            ) : (
              <img
                src={post.media_url}
                alt={post.caption || "Instagram post"}
              />
            )}
            <p>{post.caption}</p>
            {post.timestamp && (
              <span>{new Date(post.timestamp).toLocaleDateString()}</span>
            )}
          </a>
        ))}
      </div>
      <div className="social">
        <h3>Follow Us</h3>
        <div className="social-icons">
          <Link
            to="https://www.facebook.com/reebspartythemes"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src="/imgs/icons/facebook.svg" alt="Facebook" />
          </Link>
          <Link
            to="https://www.instagram.com/reebspartythemes_/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src="/imgs/icons/instagram.svg" alt="Instagram" />
          </Link>
          <Link
            to="https://www.tiktok.com/@reebspartythemes_"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src="/imgs/icons/tiktok.svg" alt="TikTok" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default InstagramFeed;
