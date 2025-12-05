'use client';

import React, { use, useEffect, useState } from 'react';
import { 
  Home, 
  Activity, 
  ScanLine, 
  Wrench, 
  User, 
  Zap, 
  Image as ImageIcon, 
  Sun, 
  CloudRain,
  CloudLightning,
  Haze,
  Loader2
} from 'lucide-react';

export default function SolarDashboard() {
  const [selectedData, setSelectedData] = useState([]);
  const [city, setCity] = useState("Subang Jaya");
  const [activeTab, setActiveTab] = useState('home');
  const [solarEstimate, setSolarEstimate] = useState("Estimated Solar Output: Calculating...");
  const [loadingEstimate, setLoadingEstimate] = useState(false);

  // Mapping object
  const weatherMap = {
    "Berjerebu": "Hazy",
    "Tiada hujan": "Sunny",
    "Hujan": "Rain",
    "Hujan di beberapa tempat": "Rain",
    "Hujan di satu dua tempat": "Rain",
    "Hujan di satu dua tempat di kawasan pantai": "Rain",
    "Hujan di satu dua tempat di kawasan pedalaman": "Rain",
    "Ribut petir": "Thunderstorms",
    "Ribut petir di beberapa tempat": "Thunderstorms",
    "Ribut petir di beberapa tempat di kawasan pedalaman": "Thunderstorms",
    "Ribut petir di satu dua tempat": "Thunderstorms",
    "Ribut petir di satu dua tempat di kawasan pantai": "Thunderstorms",
    "Ribut petir di satu dua tempat di kawasan pedalaman": "Thunderstorms"
  };

  const iconMap = {
    "Sunny": <Sun className="w-4 h-4 mb-1" />,
    "Rain": <CloudRain className="w-4 h-4 mb-1" />,
    "Thunderstorms": <CloudLightning className="w-4 h-4 mb-1" />,
    "Hazy": <Haze className="w-4 h-4 mb-1" />
  };

  const solarMap = {
    "Hazy": "Medium",
    "Sunny": "High",
    "Rain": "Low",
    "Thunderstorms": "Low"
  }

  useEffect(() => {
    async function fetchWeather() {
      const res = await fetch(`/api/weather?location_name=${encodeURIComponent(city)}`);
      const data = await res.json();
      if (data.success) {
        console.log(data.data);
        const selected = data.data.filter(
          item => item.location.location_name.toLowerCase() === city.toLowerCase()
        );
        const lastObject = selected[selected.length - 1];
        console.log(lastObject);
        setSelectedData(lastObject);
      } else {
        console.error(data.error);
      }
    }
    fetchWeather();
  }, [city]);

  useEffect(() => {
    async function getSolarEstimate() {
      if (!selectedData) return;

      setLoadingEstimate(true);
      try {
        const res = await fetch('/api/solar-estimate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            weatherData: selectedData,
            city: city 
          })
        });
        
        const data = await res.json();
        if (data.estimate_text) {
          setSolarEstimate(data.estimate_text);
        }
      } catch (error) {
        console.error("Gemini Estimate Error:", error);
        setSolarEstimate("Estimated Solar Output: Unavailable");
      } finally {
        setLoadingEstimate(false);
      }
    }

    getSolarEstimate();
  }, [selectedData, city]);

  // Function to translate
  function translateWeather(description) {
    return weatherMap[description] || description; // fallback to original if not found
  }

  function translateIcon(description) {
    return iconMap[translateWeather(description)] || description; // fallback to original if not found
  }

  function formatDateToDayMonth(dateString) {
    // Example input: "2025-12-11"
    const [year, month, day] = dateString.split("-"); // split the string by "-"
    return `${day}-${month}`; // return in dd-mm format
  }

  function translateSolarOutput(description) {
    return solarMap[translateWeather(description)] || description; // fallback to original if not found
  }

  // --- Subcomponents for cleaner code ---

function ForecastPill({ time, weather, temp, icon, output }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-gray-200 rounded-full py-4 px-1 w-full flex flex-col items-center justify-center space-y-1 h-32">
        <span className="text-xs font-bold text-slate-900">{time}</span>
        <div className="flex flex-col items-center my-1">
          {icon}
          <span className="text-xs font-bold text-slate-900">{weather}</span>
        </div>
        <span className="text-xs font-bold text-slate-900">{temp}</span>
      </div>
      <div className="mt-2 text-center leading-tight">
        <span className="text-[10px] font-medium text-slate-800 block">{output}</span>
        <span className="text-[10px] font-medium text-slate-800 block">Solar</span>
        <span className="text-[10px] font-medium text-slate-800 block">Output</span>
      </div>
    </div>
  );
}

function NavIcon({ icon, isActive, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`transition-colors duration-200 ${
        isActive ? 'text-black stroke-[2.5px]' : 'text-slate-500 hover:text-slate-700'
      }`}
    >
      {icon}
    </button>
  );
}



  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 pb-24">
      {/* Header */}
      <header className="px-6 pt-8 pb-4">
        <h1 className="text-3xl font-semibold tracking-tight">Home</h1>
      </header>

      <main className="px-5 space-y-6">
        {/* Electricity Section */}
        <section className="bg-gray-200 rounded-xl p-5 relative overflow-hidden">
          <h2 className="text-lg font-medium text-slate-800 mb-2">Electricity</h2>
          
          <div className="flex justify-center items-center py-4">
            <div className="relative w-48 h-48">
              {/* Circular Progress SVG */}
              <svg className="w-full h-full transform -rotate-90">
                {/* Track */}
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  stroke="white"
                  strokeWidth="12"
                  fill="transparent"
                  className="opacity-100"
                />
                {/* Progress (70%) - This would be dynamic in a real app */}
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  stroke="grey"
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray={502}
                  strokeDashoffset={502 - (502 * 0.7)}
                  className="transition-all duration-1000 ease-out"
                  transform="rotate(180 96 96)"
                  strokeLinecap="round"
                />
              </svg>
              
              {/* Center Text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-5xl font-bold tracking-tight">70%</span>
              </div>

              {/* Lightning Icon Badge */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-2 bg-gray-200 border-4 border-gray-200 rounded-full p-2">
                <div className="bg-slate-800 rounded-full p-1">
                   {/* Using slate-800 to contrast with the light icon, or purely black like image */}
                   <Zap className="w-5 h-5 text-white fill-current" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Panel Condition Section */}
        <section className="bg-gray-200 rounded-xl p-5">
          <h2 className="text-lg font-medium text-slate-800 mb-4">Panel Condition</h2>
          
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((panelId) => (
              <div key={panelId} className="bg-white p-4 rounded-xl shadow-sm flex justify-between items-center">
                <div className="flex flex-col space-y-1">
                  <span className="text-xs font-semibold text-slate-500">Panel {panelId}</span>
                  <span className="text-sm font-bold text-slate-900">949kwh</span>
                  <span className="text-xs font-medium text-green-600">Good</span>
                </div>
                <div className="bg-black rounded-md p-1.5">
                  <ImageIcon className="w-5 h-5 text-white" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* AI Estimation Section */}
        <section className="bg-gray-200 rounded-xl p-5">
          <h2 className="text-lg font-medium text-slate-800 mb-4">Weather Forecast {selectedData?.date ? formatDateToDayMonth(selectedData.date) : ""}</h2>
          
          {/* White Card Container */}
          <div className="bg-white rounded-2xl p-4">
            <div className="grid grid-cols-4 gap-2">
              <ForecastPill 
                time="08:00" 
                // weather={translateWeather(selectedData.morning_forecast) || "Sunny"}
                temp="25 °C" 
                icon={translateIcon(translateWeather(selectedData.morning_forecast)) || <Sun className="w-4 h-4 mb-1" />}
                output={translateSolarOutput(selectedData.morning_forecast) || "High"}
              />
              <ForecastPill 
                time="12:00" 
                // weather={translateWeather(selectedData.afternoon_forecast) || "Thunderstorms"} 
                temp="21 °C" 
                icon={translateIcon(translateWeather(selectedData.afternoon_forecast)) || <CloudRain className="w-4 h-4 mb-1" />}
                output={translateSolarOutput(selectedData.afternoon_forecast) || "Low"}
              />
              <ForecastPill 
                time="16:00" 
                // weather={translateWeather(selectedData.summary_forecast) || "Thunderstorms"} 
                temp="20 °C" 
                icon={translateIcon(translateWeather(selectedData.summary_forecast)) || <CloudRain className="w-4 h-4 mb-1" />}
                output={translateSolarOutput(selectedData.summary_forecast) || "Low"}
              />
              <ForecastPill 
                time="20:00" 
                // weather={translateWeather(selectedData.night_forecast) || "Rain"} 
                temp="22 °C" 
                icon={translateIcon(translateWeather(selectedData.night_forecast)) || <CloudLightning className="w-4 h-4 mb-1" />}
                output={translateSolarOutput(selectedData.night_forecast) || "Low"}
              />
            </div>
          </div>

          <div className="mt-4 text-left min-h-[1.5rem] flex items-center">
             {loadingEstimate ? (
                <div className="flex items-center space-x-2 text-xs text-slate-600 font-medium">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Analyzing weather data...</span>
                </div>
             ) : (
                <p className="text-xs text-slate-600 font-medium">
                  {solarEstimate}
                </p>
             )}
          </div>
        </section>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-200 border-t border-gray-300 px-6 py-4 rounded-t-3xl shadow-lg z-50">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <NavIcon 
            icon={<Home className="w-7 h-7" />} 
            isActive={activeTab === 'home'} 
            onClick={() => setActiveTab('home')}
          />
          <NavIcon 
            icon={<Activity className="w-7 h-7" />} 
            isActive={activeTab === 'graph'} 
            onClick={() => setActiveTab('graph')}
          />
          <NavIcon 
            icon={<ScanLine className="w-7 h-7" />} 
            isActive={activeTab === 'scan'} 
            onClick={() => setActiveTab('scan')}
          />
          <NavIcon 
            icon={<Wrench className="w-7 h-7" />} 
            isActive={activeTab === 'tools'} 
            onClick={() => setActiveTab('tools')}
          />
          <NavIcon 
            icon={<User className="w-7 h-7" />} 
            isActive={activeTab === 'profile'} 
            onClick={() => setActiveTab('profile')}
          />
        </div>
      </nav>
    </div>
  );
}
