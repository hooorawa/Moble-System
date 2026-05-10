import React, { useState, useRef } from 'react';
import './DescriptionInput.css';

const DescriptionInput = ({ 
  value = [], 
  onChange, 
  placeholder = "Type description and press Enter...",
  maxLines = 50,
  className = ""
}) => {
  const [inputValue, setInputValue] = useState('');
  const [lines, setLines] = useState(value || []);
  const inputRef = useRef(null);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      addLine(inputValue.trim());
    }
  };

  const addLine = (text) => {
    if (lines.length >= maxLines) {
      alert(`Maximum ${maxLines} lines allowed`);
      return;
    }

    const newLines = [...lines, text];
    setLines(newLines);
    setInputValue('');
    onChange && onChange(newLines);
  };

  const removeLine = (index) => {
    const newLines = lines.filter((_, i) => i !== index);
    setLines(newLines);
    onChange && onChange(newLines);
  };

  const clearAll = () => {
    setLines([]);
    onChange && onChange([]);
    inputRef.current?.focus();
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  return (
    <div className={`description-input-container ${className}`}>
      <label className="description-label">Description</label>
      
      <div className="description-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="description-input"
          maxLength={200}
          aria-label="Add description line"
        />
      </div>

      {lines.length > 0 && (
        <div className="description-lines">
          {lines.map((line, index) => (
            <div key={index} className="description-line">
              <span className="line-text">{line}</span>
              <button
                type="button"
                onClick={() => removeLine(index)}
                className="line-delete-btn"
                aria-label={`Remove line: ${line}`}
                title="Remove this line"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M9 3L3 9M3 3L9 9"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {lines.length > 0 && (
        <div className="description-actions">
          <button
            type="button"
            onClick={clearAll}
            className="clear-all-btn"
            aria-label="Clear all description lines"
          >
            Clear All ({lines.length})
          </button>
        </div>
      )}

      <div className="description-info">
        <span className="line-count">
          {lines.length} / {maxLines} lines
        </span>
        <span className="input-hint">
          Press Enter to add line
        </span>
      </div>
    </div>
  );
};

export default DescriptionInput;
