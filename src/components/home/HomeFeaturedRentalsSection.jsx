import { Link } from "react-router-dom";
import {
  getHomeRentalBackground,
  getHomeRentalImage,
} from "/src/components/home/homeCatalog";

function HomeFeaturedRentalsSection({
  suggestedRentals,
  activeFeaturedRentalIndex,
  setActiveFeaturedRentalIndex,
}) {
  if (!suggestedRentals.length) return null;

  return (
    <section className="home-flow home-flow--featured">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">What People Are Booking Right Now</h2>
          <p className="section-description">A quick peek at crowd favorites this month.</p>
        </div>

        <div className="featured-rental-panels" role="list" aria-label="Most booked rentals">
          {suggestedRentals.map((rental, index) => {
            const isActive = index === activeFeaturedRentalIndex;
            const rentalCategory =
              rental.specificCategory ||
              rental.specificcategory ||
              rental.category ||
              "Popular rental";

            return (
              <Link
                key={rental.productId || rental.id || rental.slug || `${rental.name}-${index}`}
                to={`/Rentals/${rental.slug || rental.id || rental.productId}`}
                className={`featured-rental-panel ${isActive ? "is-active" : ""}`}
                role="listitem"
                onMouseEnter={() => setActiveFeaturedRentalIndex(index)}
                onFocus={() => setActiveFeaturedRentalIndex(index)}
                onTouchStart={() => setActiveFeaturedRentalIndex(index)}
                onClick={() => setActiveFeaturedRentalIndex(index)}
                aria-label={`${rental.name}. ${rentalCategory}. View rental details.`}
              >
                <div
                  className="featured-rental-media-shell"
                  style={{ "--rent-category-bg": `url("${getHomeRentalBackground(rental)}")` }}
                >
                  <img
                    src={getHomeRentalImage(rental)}
                    alt={rental.name}
                    className="featured-rental-media"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <span className="featured-rental-overlay" aria-hidden="true" />
                <div className="featured-rental-copy">
                  <p>{rentalCategory}</p>
                  <h3>{rental.name}</h3>
                  <span className="featured-rental-cta">View rental →</span>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="featured-more">
          <Link to="/Rentals" className="btn btn-primary btn-lg">Browse All Rentals</Link>
        </div>
      </div>
    </section>
  );
}

export default HomeFeaturedRentalsSection;
