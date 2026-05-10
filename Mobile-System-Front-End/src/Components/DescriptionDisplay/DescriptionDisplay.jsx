import React from 'react';
import './DescriptionDisplay.css';

const DescriptionDisplay = ({ 
  description = [], 
  className = "",
  title = "Description",
  showTitle = true
}) => {
  // If description is a string, split it by newlines
  const descriptionLines = Array.isArray(description) 
    ? description 
    : (typeof description === 'string' ? description.split('\n').filter(line => line.trim()) : []);

  if (!descriptionLines || descriptionLines.length === 0) {
    return null;
  }

  return (
    <div className={`description-display-container ${className}`}>
      {showTitle && (
        <h3 className="description-display-title">{title}</h3>
      )}
      <ul className="description-display-list">
        {descriptionLines.map((line, index) => (
          <li key={index} className="description-display-item">
            <span className="line-text">{line}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DescriptionDisplay;
