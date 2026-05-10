import React, { useState, useEffect } from "react";

import mobile4 from "../../Assets/mobile4.jpg";
import mobile8 from "../../Assets/mobile8.jpg";
import mobile10 from "../../Assets/mobile10.jpg";
import mobile12 from "../../Assets/mobile12.jpg";
import mobile7 from "../../Assets/mobile7.jpg";
import mobile14 from "../../Assets/mobile14.jpg";
import mobile11 from "../../Assets/mobile11.jpg";

const images = [mobile4, mobile8, mobile10, mobile12, mobile11];

const Header = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 3000); // change every 1.5s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full flex flex-col md:flex-row gap-4 p-4">
      {/* Left Ad */}
      <div className="bg-white rounded-2xl shadow w-full md:w-1/5 h-48 md:h-96 overflow-hidden">
        <img
          src={mobile7}
          alt="Left Ad"
          className="w-full h-full object-cover rounded-2xl"
        />
      </div>

      {/* Main Banner (slider) */}
      <div className="bg-white rounded-2xl shadow w-full md:w-3/5 h-64 md:h-80 overflow-hidden relative">
        <div
          className="flex transition-transform duration-700 ease-in-out h-full"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {images.map((img, index) => (
            <img
              key={index}
              src={img}
              alt={`Banner ${index}`}
              className="w-full h-full object-cover flex-shrink-0 rounded-2xl"
            />
          ))}
        </div>
      </div>

      {/* Right Ad */}
      <div className="bg-white rounded-2xl shadow w-full md:w-1/5 h-48 md:h-96 overflow-hidden">
        <img
          src={mobile14}
          alt="Right Ad"
          className="w-full h-full object-cover rounded-2xl"
        />
      </div>
    </div>
  );
};

export default Header;
