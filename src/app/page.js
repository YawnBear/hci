'use client';

import React, { useRef, useEffect, useState } from 'react';
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
import Thunderstorms from './components/thunderstorms';
import Rain from './components/rain';
import Sunny from './components/sunny';
import Hazy from './components/hazy';

export default function SolarDashboard() {
  // FIX 1: Initialize as null, not [], so the checks work correctly
  const [selectedData, setSelectedData] = useState(null);
  const [city, setCity] = useState("Subang Jaya");
  const [activeTab, setActiveTab] = useState('home');
  const [solarEstimate, setSolarEstimate] = useState("Estimated Solar Output: Calculating...");
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  
  const hasAlertedRef = useRef(false);
  // FIX 4: Use a Ref to keep one AudioContext alive for the session
  const audioContextRef = useRef(null);

  // Mappings
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
    "Sunny": <Sunny className="w-4 h-4 mb-1" />,
    "Rain": <Rain className="w-4 h-4 mb-1" />,
    "Thunderstorms": <Thunderstorms className="w-4 h-4 mb-1" />,
    "Hazy": <Hazy className="w-4 h-4 mb-1" />
  };

  const solarMap = {
    "Hazy": "Medium",
    "Sunny": "High",
    "Rain": "Low",
    "Thunderstorms": "Low"
  }

  // Helpers
  function translateWeather(description) { return weatherMap[description] || description; }
  function translateIcon(description) { return iconMap[translateWeather(description)] || description; }
  function translateSolarOutput(description) { return solarMap[translateWeather(description)] || description; }
  function formatDateToDayMonth(dateString) {
    if(!dateString) return "";
    const [year, month, day] = dateString.split("-");
    return `${day}-${month}`;
  }

  // --- API 1: FETCH WEATHER ---
  useEffect(() => {
    async function fetchWeather() {
      try {
        const res = await fetch(`/api/weather?location_name=${encodeURIComponent(city)}`);
        const data = await res.json();
        
        if (data.success) {
          const selected = data.data.filter(
            item => item.location.location_name.toLowerCase() === city.toLowerCase()
          );
          
          if (selected.length > 0) {
            const lastObject = selected[selected.length - 1];
            setSelectedData(lastObject);
            
            // FIX 2: Reset the alert ref so the alarm can sound again for new data
            hasAlertedRef.current = false; 
          }
        }
      } catch (error) {
        console.error("Error fetching weather:", error);
      }
    }
    fetchWeather();
  }, [city]);

  // --- API 2: FETCH SOLAR ESTIMATE ---
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
        setSolarEstimate("Estimated Solar Output: Unavailable");
      } finally {
        setLoadingEstimate(false);
      }
    }

    getSolarEstimate();
  }, [selectedData, city]);

  // --- FIX 5: BROWSER AUTOPLAY UNLOCKER ---
  // Browsers block audio until the user clicks properly. 
  // This listener waits for the first click anywhere to "wake up" the audio engine.
  useEffect(() => {
    const unlockAudio = () => {
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().then(() => {
          console.log("Audio Context Resumed/Unlocked by user interaction");
        });
      }
    };

    // Listen for any click/touch on the page
    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);

    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  // --- STANDARD API TECHNIQUE: Web Audio API ---
  const playProceduralAlarm = () => {
    // Initialize Context ONLY if it doesn't exist
    if (!audioContextRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        audioContextRef.current = new AudioContext();
    }
    
    const ctx = audioContextRef.current;

    // FIX 3: Attempt to handle Autoplay Policy
    if (ctx.state === 'suspended') {
        ctx.resume().catch(e => console.warn("Audio autoplay blocked by browser. Click the page!"));
    }

    // Sound Generation Logic
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(220, ctx.currentTime); // Start pitch
    oscillator.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1); // Ramp up
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5); // Fade out

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.5);
    console.log("🔊 Sound Triggered");
  };

  // --- ALERT TRIGGER ---
  useEffect(() => {
    // Because of Fix 1, selectedData is now null initially, so this safety check works.
    if (!selectedData || hasAlertedRef.current) return;

    const forecasts = [
      selectedData.morning_forecast,
      selectedData.afternoon_forecast,
      selectedData.summary_forecast,
      selectedData.night_forecast
    ];

    // Check if any weather condition maps to "Thunderstorms"
    const hasCriticalWeather = forecasts.some(forecast => 
      translateWeather(forecast) === "Thunderstorms"
    );

    if (hasCriticalWeather) {
      console.log("⚡ Critical Weather: Triggering Web Audio API...");
      
      try {
        playProceduralAlarm();
      } catch (err) {
        console.warn("Audio Context blocked. User must click page first.");
      }
      
      hasAlertedRef.current = true;
    }
  }, [selectedData]);

  // --- UI COMPONENTS ---
  // (Your UI code below is fine, I will leave it exactly as is to keep the file valid)

  function ForecastPill({ time, weather, temp, icon, output }) {
    return (
      <div className="flex flex-col items-center">
        <div className="bg-[#615E5C] rounded-full py-4 px-1 w-full flex flex-col items-center justify-center space-y-1 h-32 border border-white">
          <span className="text-xs text-[#F7E095]">{time}</span>
          <div className="flex flex-col items-center my-1">
            {icon}
            <span className="text-xs text-[#F7E095]">{weather}</span>
          </div>
          <span className="text-xs text-[#F7E095]">{temp}</span>
        </div>
        <div className="mt-2 text-center leading-tight">
          <span className="text-[10px] font-medium text-white block">{output}</span>
          <span className="text-[10px] font-medium text-white block">Solar</span>
          <span className="text-[10px] font-medium text-white block">Output</span>
        </div>
      </div>
    );
  }

  function NavIcon({ icon, isActive, onClick }) {
    return (
      <button 
        onClick={onClick}
        className={`transition-colors duration-200 ${
          isActive ? 'text-[#FF784F] stroke-[2.5px]' : 'text-[#736A6A]'
        }`}
      >
        {icon}
      </button>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 pb-24 bgcolor">
      {/* Header */}
      <header className="px-6 pt-8 pb-4">
        <h1 className="text-3xl font-semibold tracking-tight text-white">Home</h1>
      </header>

      <main className="px-5 space-y-6">
        {/* Electricity Section */}
        <section className="bg-[#615E5C] rounded-xl p-4 relative overflow-hidden border-1 border-[#FF784F]">
          <h2 className="text-lg font-medium text-white mb-2">Electricity</h2>
          
          <div className="flex justify-center items-center py-2">
            {/* Removed onClick handler and manual text instructions */}
            <div className="relative w-48 h-48 bg-[#242323] rounded-full">
              {/* Circular Progress SVG */}
              <svg className="w-full h-full transform -rotate-90">
                {/* Track */}
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  stroke="#242323"
                  strokeWidth="12"
                  fill="transparent"
                  className="opacity-100"
                />
                {/* Progress (70%) - This would be dynamic in a real app */}
                <circle
                  cx="96"
                  cy="96"
                  r="84"
                  stroke="#F7E095"
                  strokeWidth="9"
                  fill="transparent"
                  strokeDasharray={541}
                  strokeDashoffset={541 - (541 * 0.7)}
                  className="transition-all duration-1000 ease-out"
                  transform="rotate(180 96 96)"
                  strokeLinecap="round"
                />
              </svg>
              
              {/* Center Text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white text-5xl tracking-tight">70%</span>
              </div>

              {/* Lightning Icon Badge */}
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 translate-y-2 bg-[#FF784F] border-4 border-[#FF784F] rounded-full p-2">
                    <Zap className="w-5 h-5 text-white fill-current" />
              </div>
            </div>
          </div>
        </section>

        {/* Panel Condition Section */}
        <section className="bg-[#615E5C] rounded-xl p-5 border border-[#FF784F]">
          <h2 className="text-lg font-medium text-white mb-4">Panel Condition</h2>
          
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((panelId) => (
              <div key={panelId} className="bg-[#242323] p-4 rounded-xl shadow-sm flex justify-between items-center">
                <div className="flex flex-col space-y-1">
                  <span className="text-xs font-semibold text-white">Panel {panelId}</span>
                  <span className="text-sm text-white">949kwh</span>
                  <span className="text-xs font-medium text-green-600">Good</span>
                </div>
                <div className="bg-[#242323] rounded-md p-1.5">
                  <img src={`/solarPanel.png`} alt={`Panel ${panelId}`} className="ml-3 w-17 h-10" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* AI Estimation Section */}
        <section className="bg-[#615E5C] rounded-xl p-5 border border-[#FF784F]">
          <h2 className="text-lg font-medium text-white mb-4">{city} Weather @{selectedData?.date ? formatDateToDayMonth(selectedData.date) : ""}</h2>
          
          {/* White Card Container */}
          <div className="bgcolor rounded-2xl p-4 text-[#F7E095]">
            <div className="grid grid-cols-4 gap-4">
              <ForecastPill 
                time="08:00" 
                // weather={translateWeather(selectedData.morning_forecast) || "Sunny"}
                temp="25 °C" 
                icon={selectedData ? translateIcon(translateWeather(selectedData.morning_forecast)) : <Sunny className="w-4 h-4 mb-1" />}
                output={selectedData ? translateSolarOutput(selectedData.morning_forecast) : "High"}
              />
              <ForecastPill 
                time="12:00" 
                // weather={translateWeather(selectedData.afternoon_forecast) || "Thunderstorms"} 
                temp="21 °C" 
                icon={selectedData ? translateIcon(translateWeather(selectedData.afternoon_forecast)) : <Thunderstorms className="w-4 h-4 mb-1" />}
                output={selectedData ? translateSolarOutput(selectedData.afternoon_forecast) : "Low"}
              />
              <ForecastPill 
                time="16:00" 
                // weather={translateWeather(selectedData.summary_forecast) || "Thunderstorms"} 
                temp="20 °C" 
                icon={selectedData ? translateIcon(translateWeather(selectedData.summary_forecast)) : <Thunderstorms className="w-4 h-4 mb-1" />}
                output={selectedData ? translateSolarOutput(selectedData.summary_forecast) : "Low"}
              />
              <ForecastPill 
                time="20:00" 
                // weather={translateWeather(selectedData.night_forecast) || "Rain"} 
                temp="22 °C" 
                icon={selectedData ? translateIcon(translateWeather(selectedData.night_forecast)) : <Rain className="w-4 h-4 mb-1" />}
                output={selectedData ? translateSolarOutput(selectedData.night_forecast) : "Low"}
              />
            </div>
          </div>

          <div className="mt-4 text-left min-h-[1.5rem] flex items-center">
             {loadingEstimate ? (
                <div className="flex items-center space-x-2 text-xs text-white font-medium">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Analyzing weather data...</span>
                </div>
             ) : (
                <p className="text-xs text-white font-medium">
                  {solarEstimate}
                </p>
             )}
          </div>
        </section>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed -bottom-1 left-0 right-0 border-t border-white px-6 py-4 shadow-lg z-50 navbar">
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