import React, { useState, useEffect, useRef } from 'react';
import { Issue, LocationInfo } from '../types';
import { useIssuesStore } from '../store/useIssuesStore';
import { Shield, AlertTriangle, Crosshair, ZoomIn, ZoomOut, Search, MapPin } from 'lucide-react';
import { CITY_CENTERS } from '../utils/seedData';

interface MapCanvasProps {
  selectedIssueId?: string;
  onSelectIssue?: (issueId: string) => void;
  interactiveSelectCoordinate?: (lat: number, lng: number, address: string) => void;
  isSelectingCoordinate?: boolean;
  userLat?: number;
  userLng?: number;
}

export const MapCanvas: React.FC<MapCanvasProps> = ({
  selectedIssueId,
  onSelectIssue,
  interactiveSelectCoordinate,
  isSelectingCoordinate = false,
  userLat,
  userLng
}) => {
  const issues = useIssuesStore((state) => state.issues);
  const warRoomActive = useIssuesStore((state) => state.warRoomActive);
  const warRoomArea = useIssuesStore((state) => state.warRoomArea);
  const [selectedCity, setSelectedCity] = useState<'Bengaluru' | 'Mumbai' | 'Delhi' | 'Gurgaon' | 'Noida'>('Bengaluru');

  // Auto-select city center closest to user's resolved coordinates on mount / update
  useEffect(() => {
    if (userLat && userLng) {
      // Find closest city
      let closestCity: 'Bengaluru' | 'Mumbai' | 'Delhi' | 'Gurgaon' | 'Noida' = 'Bengaluru';
      let closestDist = Infinity;
      for (const [cityName, center] of Object.entries(CITY_CENTERS)) {
        const dist = Math.sqrt(Math.pow(userLat - center.lat, 2) + Math.pow(userLng - center.lng, 2));
        if (dist < closestDist) {
          closestDist = dist;
          closestCity = cityName as any;
        }
      }
      setSelectedCity(closestCity);
    }
  }, [userLat, userLng]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  
  // Layers toggles
  const [showPins, setShowPins] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showClusters, setShowClusters] = useState(false);
  const [showHotspots, setShowHotspots] = useState(true);
  const [showChronic, setShowChronic] = useState(true);

  // Zoom/pan state
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const cityCenter = CITY_CENTERS[selectedCity];

  // Set selected city based on active war room
  useEffect(() => {
    if (warRoomActive) {
      if (warRoomArea.toLowerCase().includes("bandra") || warRoomArea === "Mumbai") {
        setSelectedCity("Mumbai");
      } else if (warRoomArea.toLowerCase().includes("saket") || warRoomArea === "Delhi") {
        setSelectedCity("Delhi");
      } else {
        setSelectedCity("Bengaluru");
      }
    }
  }, [warRoomActive, warRoomArea]);

  // Center on selected issue if it changes
  useEffect(() => {
    if (selectedIssueId) {
      const issue = issues.find(i => i.id === selectedIssueId);
      if (issue) {
        // Change city if necessary
        const issueCity = issue.location.city as 'Bengaluru' | 'Mumbai' | 'Delhi';
        if (issueCity && CITY_CENTERS[issueCity]) {
          setSelectedCity(issueCity);
        }
        
        // Calculate coordinate position inside map local layout, center on it
        const coords = getLocalXY(issue.location.lat, issue.location.lng);
        setPan({
          x: 400 - coords.x * zoom,
          y: 250 - coords.y * zoom
        });
      }
    }
  }, [selectedIssueId]);

  // Convert GPS coordinates to standard 800x500 map space
  const getLocalXY = (lat: number, lng: number) => {
    // Standard bounding boxes around our city centers
    const boundingBox = {
      Bengaluru: { minLat: 12.915, maxLat: 12.955, minLng: 77.605, maxLng: 77.645 },
      Mumbai: { minLat: 19.040, maxLat: 19.080, minLng: 72.805, maxLng: 72.855 },
      Delhi: { minLat: 28.505, maxLat: 28.545, minLng: 77.195, maxLng: 77.235 },
      Gurgaon: { minLat: 28.435, maxLat: 28.485, minLng: 77.005, maxLng: 77.045 },
      Noida: { minLat: 28.515, maxLat: 28.565, minLng: 77.365, maxLng: 77.415 }
    };

    const bbox = boundingBox[selectedCity];
    const x = ((lng - bbox.minLng) / (bbox.maxLng - bbox.minLng)) * 800;
    const y = (1.0 - (lat - bbox.minLat) / (bbox.maxLat - bbox.minLat)) * 500; // Flip Y for screen coordinates
    return { x, y };
  };

  // Convert local map XY back to GPS
  const getGPSFromLocal = (x: number, y: number) => {
    const boundingBox = {
      Bengaluru: { minLat: 12.915, maxLat: 12.955, minLng: 77.605, maxLng: 77.645 },
      Mumbai: { minLat: 19.040, maxLat: 19.080, minLng: 72.805, maxLng: 72.855 },
      Delhi: { minLat: 28.505, maxLat: 28.545, minLng: 77.195, maxLng: 77.235 },
      Gurgaon: { minLat: 28.435, maxLat: 28.485, minLng: 77.005, maxLng: 77.045 },
      Noida: { minLat: 28.515, maxLat: 28.565, minLng: 77.365, maxLng: 77.415 }
    };

    const bbox = boundingBox[selectedCity];
    const lng = bbox.minLng + (x / 800) * (bbox.maxLng - bbox.minLng);
    const lat = bbox.minLat + (1.0 - y / 500) * (bbox.maxLat - bbox.minLat);
    return {
      lat: parseFloat(lat.toFixed(5)),
      lng: parseFloat(lng.toFixed(5))
    };
  };

  // Map mouse/touch operations
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isSelectingCoordinate) return;
    isDragging.current = true;
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || isSelectingCoordinate) return;
    setPan({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isSelectingCoordinate || e.touches.length !== 1) return;
    isDragging.current = true;
    const touch = e.touches[0];
    dragStart.current = { x: touch.clientX - pan.x, y: touch.clientY - pan.y };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || isSelectingCoordinate || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setPan({
      x: touch.clientX - dragStart.current.x,
      y: touch.clientY - dragStart.current.y
    });
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
  };

  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!mapContainerRef.current) return;
    
    // Get click coordinates relative to the SVG map elements
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = (e.clientX - rect.left - pan.x) / zoom;
    const clickY = (e.clientY - rect.top - pan.y) / zoom;

    if (isSelectingCoordinate && interactiveSelectCoordinate) {
      if (clickX >= 0 && clickX <= 800 && clickY >= 0 && clickY <= 500) {
        const gps = getGPSFromLocal(clickX, clickY);
        // Generate realistic local street address
        const streetNo = Math.floor(Math.random() * 20) + 1;
        const streetNames = {
          Bengaluru: ["80 Feet Road", "100 Feet Road", "ST Bed Road", "HSR Boulevard"],
          Mumbai: ["Carter Road", "Linking Road", "Pali Hill Extension", "Juhu Lane"],
          Delhi: ["Saket Walkway", "Vasant Marg", "D-Block Avenue", "Mehrauli Sector Road"]
        };
        const streetName = streetNames[selectedCity][Math.floor(Math.random() * 4)];
        const generatedAddress = `${streetNo}, ${streetName}, ${cityCenter.name}, ${selectedCity}`;
        
        interactiveSelectCoordinate(gps.lat, gps.lng, generatedAddress);
      }
    }
  };

  // Filter local issues
  const filteredIssues = issues.filter(issue => {
    if (issue.location.city !== selectedCity) return false;
    if (filterCategory !== 'all' && issue.category !== filterCategory) return false;
    if (filterSeverity !== 'all' && issue.severity !== filterSeverity) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        issue.title.toLowerCase().includes(q) ||
        issue.location.address.toLowerCase().includes(q) ||
        issue.location.area.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleZoom = (direction: 'in' | 'out') => {
    setZoom(prev => {
      const nextZoom = direction === 'in' ? prev + 0.25 : prev - 0.25;
      return Math.min(2.5, Math.max(0.75, nextZoom));
    });
  };

  const handleResetPan = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'low': return '#10b981';
      case 'medium': return '#eab308';
      case 'high': return '#f97316';
      case 'critical': return '#ef4444';
      default: return '#3b82f6';
    }
  };

  const getSeverityPulseClass = (sev: string) => {
    switch (sev) {
      case 'low': return 'pulse-indicator-low';
      case 'medium': return 'pulse-indicator-medium';
      case 'high': return 'pulse-indicator-high';
      case 'critical': return 'pulse-indicator-critical';
      default: return '';
    }
  };

  // Pre-configured custom map street overlays for visual grid
  const cityRoads = {
    Bengaluru: [
      { name: "80 Feet Road", x1: 50, y1: 100, x2: 750, y2: 100 },
      { name: "100 Feet Road", x1: 50, y1: 400, x2: 750, y2: 400 },
      { name: "Sarjapur Link", x1: 200, y1: 50, x2: 200, y2: 450 },
      { name: "Koramangala 4th Block Boulevard", x1: 600, y1: 50, x2: 600, y2: 450 }
    ],
    Mumbai: [
      { name: "Carter Promenade Road", x1: 80, y1: 150, x2: 720, y2: 150 },
      { name: "Linking Commercial Road", x1: 80, y1: 350, x2: 720, y2: 350 },
      { name: "Hill Road", x1: 150, y1: 50, x2: 150, y2: 450 },
      { name: "Pali Avenue", x1: 550, y1: 50, x2: 550, y2: 450 }
    ],
    Delhi: [
      { name: "M-Block Circular Ring Road", x1: 100, y1: 250, x2: 700, y2: 250 },
      { name: "D-Block Access Road", x1: 400, y1: 50, x2: 400, y2: 450 },
      { name: "Vasant Marg Bypass", x1: 50, y1: 120, x2: 750, y2: 380 }
    ],
    Gurgaon: [
      { name: "Golf Course Expressway", x1: 50, y1: 150, x2: 750, y2: 150 },
      { name: "Cyber City Ring Loop", x1: 300, y1: 50, x2: 300, y2: 450 },
      { name: "Sohna Access Link", x1: 550, y1: 50, x2: 550, y2: 450 }
    ],
    Noida: [
      { name: "Greater Noida Expressway Link", x1: 50, y1: 200, x2: 750, y2: 200 },
      { name: "Sector 18 Commercial Row", x1: 200, y1: 50, x2: 200, y2: 450 },
      { name: "Film City Road", x1: 600, y1: 50, x2: 600, y2: 450 }
    ]
  };

  const currentRoads = cityRoads[selectedCity] || [];

  return (
    <div className="flex flex-col h-full bg-[#0d0d0f] border border-zinc-800 rounded-lg overflow-hidden">
      {/* Top Map bar controllers */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#121214] border-b border-zinc-800">
        <div className="flex items-center gap-2 max-w-full flex-grow sm:flex-grow-0">
          <MapPin className="text-red-500 w-5 h-5 shrink-0" />
          <span className="hidden sm:inline text-xs font-black uppercase tracking-widest text-zinc-400">Target Quadrant:</span>
          <select 
            value={selectedCity} 
            onChange={(e) => {
              setSelectedCity(e.target.value as any);
              handleResetPan();
            }}
            disabled={warRoomActive}
            className="bg-black text-white text-xs font-bold uppercase border border-zinc-800 px-3 py-1.5 focus:outline-none focus:border-red-600 rounded cursor-pointer max-w-full flex-grow sm:flex-grow-0"
          >
            <option value="Bengaluru">Bengaluru (Koramangala)</option>
            <option value="Mumbai">Mumbai (Bandra West)</option>
            <option value="Delhi">Delhi (Saket)</option>
            <option value="Gurgaon">Gurgaon (Cyber City)</option>
            <option value="Noida">Noida (Sector 18)</option>
          </select>
          {warRoomActive && (
            <span className="text-[10px] bg-red-600 text-white font-black px-2.5 py-1 uppercase tracking-wider rounded pulse-indicator-critical shrink-0">
              War Room Locked
            </span>
          )}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search local blocks or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/60 text-white text-xs pl-8 pr-3 py-1.5 rounded border border-zinc-800 focus:outline-none focus:border-red-600 uppercase font-bold tracking-tight"
          />
          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-zinc-500" />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <select 
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-black text-zinc-400 text-[10px] uppercase border border-zinc-800 px-2 py-1.5 rounded focus:outline-none flex-grow sm:flex-grow-0"
          >
            <option value="all">All Issues</option>
            <option value="pothole">Potholes</option>
            <option value="water_leakage">Water Leakage</option>
            <option value="streetlight">Streetlights</option>
            <option value="garbage">Garbage Dumping</option>
            <option value="flooding">Flooding</option>
            <option value="encroachment">Encroachment</option>
            <option value="road_damage">Road Damage</option>
          </select>

          <select 
            value={filterSeverity} 
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-black text-zinc-400 text-[10px] uppercase border border-zinc-800 px-2 py-1.5 rounded focus:outline-none flex-grow sm:flex-grow-0"
          >
            <option value="all">All Severity</option>
            <option value="low">Low Severity</option>
            <option value="medium">Medium Severity</option>
            <option value="high">High Severity</option>
            <option value="critical">Critical Severity</option>
          </select>
        </div>
      </div>

      {/* Layer selector floating badges */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 bg-black/40 border-b border-zinc-800/60 w-full">
        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mr-2 shrink-0">Layer Overlays:</span>
        <button 
          onClick={() => setShowPins(!showPins)}
          className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 border transition-colors rounded ${showPins ? 'bg-zinc-800 border-red-600 text-white' : 'border-zinc-800 text-zinc-600 hover:text-white'}`}
        >
          Issue Pins
        </button>
        <button 
          onClick={() => setShowClusters(!showClusters)}
          className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 border transition-colors rounded ${showClusters ? 'bg-zinc-800 border-red-600 text-white' : 'border-zinc-800 text-zinc-600 hover:text-white'}`}
        >
          Clusters ({filteredIssues.length > 5 ? 'Active' : 'Empty'})
        </button>
        <button 
          onClick={() => setShowHeatmap(!showHeatmap)}
          className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 border transition-colors rounded ${showHeatmap ? 'bg-zinc-800 border-red-600 text-white' : 'border-zinc-800 text-zinc-600 hover:text-white'}`}
        >
          Density Heatmap
        </button>
        <button 
          onClick={() => setShowHotspots(!showHotspots)}
          className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 border transition-colors rounded ${showHotspots ? 'bg-zinc-800 border-red-600 text-white' : 'border-zinc-800 text-zinc-600 hover:text-white'}`}
        >
          Predictive Hotspots
        </button>
        <button 
          onClick={() => setShowChronic(!showChronic)}
          className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 border transition-colors rounded ${showChronic ? 'bg-zinc-800 border-red-600 text-white' : 'border-zinc-800 text-zinc-600 hover:text-white'}`}
        >
          Chronic Zones Layer
        </button>
      </div>

      {/* Main Interactive Map Frame */}
      <div 
        ref={mapContainerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`relative flex-grow h-[450px] select-none ${isSelectingCoordinate ? 'cursor-crosshair' : isDragging.current ? 'cursor-grabbing' : 'cursor-grab'} overflow-hidden bg-[#070708]`}
      >
        {isSelectingCoordinate && (
          <div className="absolute top-3 left-3 z-10 bg-red-600 text-white font-black text-[9px] uppercase tracking-widest px-3 py-1.5 rounded shadow">
            ⚠️ COORDINATE DROP: Click anywhere on the map grid to select coordinates
          </div>
        )}

        {/* SVG Drawing Canvas */}
        <svg 
          width="800" 
          height="500" 
          onClick={handleMapClick}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'top left',
            transition: isDragging.current ? 'none' : 'transform 0.15s ease-out'
          }}
          className="absolute top-0 left-0 min-w-[800px] min-h-[500px]"
        >
          {/* Background grid mesh */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#16161a" strokeWidth="1" />
            </pattern>
            <radialGradient id="heatmapGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#f97316" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="hotspotGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="800" height="500" fill="url(#grid)" />

          {/* District boundary line */}
          <rect width="790" height="490" x="5" y="5" fill="none" stroke="#27272a" strokeWidth="2" strokeDasharray="6,4" />

          {/* Roads network simulation */}
          {currentRoads.map((road, idx) => (
            <g key={idx}>
              <line 
                x1={road.x1} 
                y1={road.y1} 
                x2={road.x2} 
                y2={road.y2} 
                stroke="#18181b" 
                strokeWidth="14" 
                strokeLinecap="round" 
              />
              <line 
                x1={road.x1} 
                y1={road.y1} 
                x2={road.x2} 
                y2={road.y2} 
                stroke="#2c2c35" 
                strokeWidth="2" 
                strokeDasharray="4,4" 
                strokeLinecap="round" 
              />
              <text 
                x={(road.x1 + road.x2) / 2} 
                y={(road.y1 + road.y2) / 2 - 12} 
                fill="#52525b" 
                fontSize="9" 
                fontFamily="var(--font-mono)" 
                fontWeight="bold"
                textAnchor="middle"
                className="uppercase tracking-widest select-none pointer-events-none"
              >
                {road.name}
              </text>
            </g>
          ))}

          {/* Simulated landmarks */}
          <g transform="translate(100, 80)" className="opacity-40">
            <rect width="90" height="30" rx="4" fill="#18181b" stroke="#27272a" />
            <text x="45" y="18" fill="#71717a" fontSize="8" fontFamily="var(--font-mono)" textAnchor="middle" className="uppercase font-bold tracking-wider">CIVIC PARK</text>
          </g>
          <g transform="translate(620, 320)" className="opacity-40">
            <rect width="110" height="30" rx="4" fill="#18181b" stroke="#27272a" />
            <text x="55" y="18" fill="#71717a" fontSize="8" fontFamily="var(--font-mono)" textAnchor="middle" className="uppercase font-bold tracking-wider">WARD HQ OFFICE</text>
          </g>

          {/* Heatmap density overlay layer */}
          {showHeatmap && filteredIssues.map((issue, idx) => {
            const coords = getLocalXY(issue.location.lat, issue.location.lng);
            const radius = issue.severityScore * 10 + 15;
            return (
              <circle 
                key={`heat-${idx}`}
                cx={coords.x}
                cy={coords.y}
                r={radius}
                fill="url(#heatmapGrad)"
                className="pointer-events-none"
              />
            );
          })}

          {/* Predictive Hotspot Zone layer */}
          {showHotspots && (
            <>
              {/* Presettled Predictive hotspots */}
              <g className="pointer-events-none">
                <circle cx="200" cy="120" r="85" fill="url(#hotspotGrad)" />
                <circle cx="200" cy="120" r="85" fill="none" stroke="#a855f7" strokeWidth="1" strokeDasharray="4,4" className="opacity-50" />
                <text x="200" y="75" fill="#c084fc" fontSize="8" fontFamily="var(--font-mono)" fontWeight="bold" textAnchor="middle" className="uppercase tracking-widest opacity-85">
                  🔮 PREDICTED FLOOD ZONE (85% CONF)
                </text>
              </g>
              <g className="pointer-events-none">
                <circle cx="580" cy="380" r="70" fill="url(#hotspotGrad)" />
                <circle cx="580" cy="380" r="70" fill="none" stroke="#a855f7" strokeWidth="1" strokeDasharray="4,4" className="opacity-50" />
                <text x="580" y="340" fill="#c084fc" fontSize="8" fontFamily="var(--font-mono)" fontWeight="bold" textAnchor="middle" className="uppercase tracking-widest opacity-85">
                  🔮 INFRASTRUCTURE CRACK ZONE (72%)
                </text>
              </g>
            </>
          )}

          {/* Chronic Repeat Offender Zones (3+ same category) */}
          {showChronic && filteredIssues.filter(i => i.isChronic).map((issue, idx) => {
            const coords = getLocalXY(issue.location.lat, issue.location.lng);
            return (
              <g key={`chronic-${idx}`} className="pointer-events-none">
                <circle 
                  cx={coords.x} 
                  cy={coords.y} 
                  r="35" 
                  fill="none" 
                  stroke="#ef4444" 
                  strokeWidth="2" 
                  strokeDasharray="6,3" 
                  className="opacity-70"
                />
                <circle 
                  cx={coords.x} 
                  cy={coords.y} 
                  r="35" 
                  fill="#ef4444" 
                  fillOpacity="0.05"
                />
                <text 
                  x={coords.x} 
                  y={coords.y - 40} 
                  fill="#ef4444" 
                  fontSize="7" 
                  fontFamily="var(--font-mono)" 
                  fontWeight="black" 
                  textAnchor="middle" 
                  className="uppercase tracking-widest bg-black px-1"
                >
                  🔴 REPEAT OFFENDER CHRONIC ZONE
                </text>
              </g>
            );
          })}

          {/* Clusters Overlay Layer */}
          {showClusters && filteredIssues.length > 5 && (
            <g transform="translate(380, 220)" className="cursor-pointer" onClick={() => setZoom(prev => Math.min(2.5, prev + 0.5))}>
              <circle cx="0" cy="0" r="28" fill="#1e1e24" stroke="#ef4444" strokeWidth="3" className="opacity-90" />
              <text x="0" y="4" fill="white" fontSize="11" fontFamily="var(--font-display)" fontWeight="black" textAnchor="middle">
                +{filteredIssues.length - 2}
              </text>
              <text x="0" y="16" fill="#ef4444" fontSize="6" fontFamily="var(--font-mono)" fontWeight="bold" textAnchor="middle" className="uppercase tracking-widest">
                CLUSTERS
              </text>
            </g>
          )}

          {/* Issue Pins Layer */}
          {showPins && (!showClusters || filteredIssues.length <= 5) && filteredIssues.map((issue, idx) => {
            const coords = getLocalXY(issue.location.lat, issue.location.lng);
            const isSelected = selectedIssueId === issue.id;
            const markerColor = getSeverityColor(issue.severity);
            const pulseClass = getSeverityPulseClass(issue.severity);

            return (
              <g 
                key={issue.id} 
                transform={`translate(${coords.x}, ${coords.y})`}
                className="cursor-pointer group"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSelectIssue) onSelectIssue(issue.id);
                }}
              >
                {/* Glowing Ripple Background representing live severity pulse */}
                <circle 
                  r={isSelected ? "18" : "12"} 
                  fill={markerColor} 
                  fillOpacity="0.25" 
                  className={`${pulseClass} transition-all duration-300`} 
                />

                {/* Outer halo */}
                <circle 
                  r={isSelected ? "10" : "6"} 
                  fill="none" 
                  stroke={isSelected ? "#ffffff" : markerColor} 
                  strokeWidth="2" 
                  className="transition-all duration-300"
                />

                {/* Inner center dot */}
                <circle 
                  r="3.5" 
                  fill={isSelected ? "#ffffff" : markerColor} 
                />

                {/* Mini category hover banner overlay inside SVG */}
                <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <rect 
                    x="-65" 
                    y="-34" 
                    width="130" 
                    height="22" 
                    rx="3" 
                    fill="#121214" 
                    stroke="#27272a" 
                    strokeWidth="1" 
                  />
                  <text 
                    x="0" 
                    y="-20" 
                    fill="white" 
                    fontSize="7.5" 
                    fontWeight="black" 
                    fontFamily="var(--font-mono)" 
                    textAnchor="middle"
                    className="uppercase tracking-wider"
                  >
                    {issue.category.replace('_', ' ')}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* Map visual control bottom rail overlay */}
        <div className="absolute bottom-3 left-3 z-10 flex gap-1 bg-black/80 backdrop-blur-md border border-zinc-800 p-1.5 rounded">
          <button 
            onClick={() => handleZoom('in')} 
            title="Zoom In"
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors rounded"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => handleZoom('out')} 
            title="Zoom Out"
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors rounded"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={handleResetPan} 
            title="Reset view"
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors rounded"
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Coordinates status label bottom right */}
        <div className="absolute bottom-3 right-3 z-10 bg-black/85 backdrop-blur-md border border-zinc-800 px-3 py-1.5 rounded text-right pointer-events-none">
          <div className="text-[7.5px] text-zinc-500 uppercase font-black tracking-widest">Selected Ward Coordinate Reference</div>
          <div className="text-[10px] font-mono text-zinc-300 font-bold tracking-tight">
            {`${cityCenter.lat.toFixed(4)}° N, ${cityCenter.lng.toFixed(4)}° E`}
          </div>
        </div>
      </div>
    </div>
  );
};
