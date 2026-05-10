import React from 'react';
import './ItemDisplay.css';

const ItemDisplay = () => {
  return (
    <div className="item-display">
      <div className="item-display-container">
        <h1>Items</h1>
        <p>This page will display items based on the selected category.</p>
        <div className="coming-soon">
          <h2>Coming Soon</h2>
          <p>Item display functionality will be implemented here.</p>
        </div>
      </div>
    </div>
  );
};

export default ItemDisplay;
