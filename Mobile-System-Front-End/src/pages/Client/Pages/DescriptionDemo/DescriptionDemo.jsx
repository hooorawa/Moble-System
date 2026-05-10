import React, { useState } from 'react';
import DescriptionInput from '../../../../Components/DescriptionInput/DescriptionInput';
import './DescriptionDemo.css';

const DescriptionDemo = () => {
  const [description, setDescription] = useState([]);

  const handleDescriptionChange = (newDescription) => {
    setDescription(newDescription);
    console.log('Description updated:', newDescription);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Final description:', description);
    alert(`Description submitted with ${description.length} lines:\n\n${description.join('\n')}`);
  };

  return (
    <div className="description-demo-page">
      <div className="demo-container">
        <h1>Description Input Component Demo</h1>
        <p className="demo-description">
          This is an interactive description input component. Type your text and press Enter to create new lines.
          Each line will appear below as a separate, styled block with a delete button.
        </p>

        <form onSubmit={handleSubmit} className="demo-form">
          <DescriptionInput
            value={description}
            onChange={handleDescriptionChange}
            placeholder="Type your description here and press Enter..."
            maxLines={10}
            className="demo-description-input"
          />

          <div className="form-actions">
            <button type="submit" className="submit-btn" disabled={description.length === 0}>
              Submit Description ({description.length} lines)
            </button>
            <button type="button" className="reset-btn" onClick={() => setDescription([])}>
              Reset
            </button>
          </div>
        </form>

        <div className="demo-info">
          <h3>Features:</h3>
          <ul>
            <li>✅ Press Enter to add new lines</li>
            <li>✅ Individual delete buttons for each line</li>
            <li>✅ Clear All button to reset everything</li>
            <li>✅ Real-time line count and character limits</li>
            <li>✅ Responsive design for mobile and desktop</li>
            <li>✅ Accessibility support (ARIA labels, keyboard navigation)</li>
            <li>✅ Dark mode support</li>
            <li>✅ Smooth animations and hover effects</li>
          </ul>
        </div>

        {description.length > 0 && (
          <div className="preview-section">
            <h3>Preview (as it would appear in your app):</h3>
            <div className="preview-content">
              {description.map((line, index) => (
                <div key={index} className="preview-line">
                  {line}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DescriptionDemo;
