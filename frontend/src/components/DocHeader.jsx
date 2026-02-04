import React from "react";

export const Header = () => {
  return (
    <div>
      <div>
        <div>
          <h2>Good morning, Dr. Smith!</h2>
          <p>Here's what's happening with your patients today.</p>
        </div>
        <div>
          <div>
            <input
              type="text"
              placeholder="Search patients..."
            />
          </div>
          <button>
            🔔
            <span></span>
          </button>
          <div>👤</div>
        </div>
      </div>
    </div>
  );
};

export default Header;