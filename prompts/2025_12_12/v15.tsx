import React, { useState, useEffect, useRef } from 'react';

// French departments data with coordinates for prefectures
const departments = {
  "01": { name: "Ain", prefecture: "Bourg-en-Bresse", region: "Auvergne-Rhône-Alpes", prefCoords: [5.23, 46.2] },
  "02": { name: "Aisne", prefecture: "Laon", region: "Hauts-de-France", prefCoords: [3.62, 49.56] },
  "03": { name: "Allier", prefecture: "Moulins", region: "Auvergne-Rhône-Alpes", prefCoords: [3.33, 46.57] },
  "04": { name: "Alpes-de-Haute-Provence", prefecture: "Digne-les-Bains", region: "Provence-Alpes-Côte d'Azur", prefCoords: [6.23, 44.09] },
  "05": { name: "Hautes-Alpes", prefecture: "Gap", region: "Provence-Alpes-Côte d'Azur", prefCoords: [6.08, 44.56] },
  "06": { name: "Alpes-Maritimes", prefecture: "Nice", region: "Provence-Alpes-Côte d'Azur", prefCoords: [7.27, 43.7] },
  "07": { name: "Ardèche", prefecture: "Privas", region: "Auvergne-Rhône-Alpes", prefCoords: [4.6, 44.74] },
  "08": { name: "Ardennes", prefecture: "Charleville-Mézières", region: "Grand Est", prefCoords: [4.72, 49.77] },
  "09": { name: "Ariège", prefecture: "Foix", region: "Occitanie", prefCoords: [1.61, 42.97] },
  "10": { name: "Aube", prefecture: "Troyes", region: "Grand Est", prefCoords: [4.08, 48.3] },
  "11": { name: "Aude", prefecture: "Carcassonne", region: "Occitanie", prefCoords: [2.35, 43.21] },
  "12": { name: "Aveyron", prefecture: "Rodez", region: "Occitanie", prefCoords: [2.57, 44.35] },
  "13": { name: "Bouches-du-Rhône", prefecture: "Marseille", region: "Provence-Alpes-Côte d'Azur", prefCoords: [5.37, 43.3] },
  "14": { name: "Calvados", prefecture: "Caen", region: "Normandie", prefCoords: [-0.37, 49.18] },
  "15": { name: "Cantal", prefecture: "Aurillac", region: "Auvergne-Rhône-Alpes", prefCoords: [2.44, 44.93] },
  "16": { name: "Charente", prefecture: "Angoulême", region: "Nouvelle-Aquitaine", prefCoords: [0.16, 45.65] },
  "17": { name: "Charente-Maritime", prefecture: "La Rochelle", region: "Nouvelle-Aquitaine", prefCoords: [-1.15, 46.16] },
  "18": { name: "Cher", prefecture: "Bourges", region: "Centre-Val de Loire", prefCoords: [2.39, 47.08] },
  "19": { name: "Corrèze", prefecture: "Tulle", region: "Nouvelle-Aquitaine", prefCoords: [1.77, 45.27] },
  "2A": { name: "Corse-du-Sud", prefecture: "Ajaccio", region: "Corse", prefCoords: [8.74, 41.93] },
  "2B": { name: "Haute-Corse", prefecture: "Bastia", region: "Corse", prefCoords: [9.45, 42.7] },
  "21": { name: "Côte-d'Or", prefecture: "Dijon", region: "Bourgogne-Franche-Comté", prefCoords: [5.04, 47.32] },
  "22": { name: "Côtes-d'Armor", prefecture: "Saint-Brieuc", region: "Bretagne", prefCoords: [-2.76, 48.51] },
  "23": { name: "Creuse", prefecture: "Guéret", region: "Nouvelle-Aquitaine", prefCoords: [1.87, 46.17] },
  "24": { name: "Dordogne", prefecture: "Périgueux", region: "Nouvelle-Aquitaine", prefCoords: [0.72, 45.18] },
  "25": { name: "Doubs", prefecture: "Besançon", region: "Bourgogne-Franche-Comté", prefCoords: [6.02, 47.24] },
  "26": { name: "Drôme", prefecture: "Valence", region: "Auvergne-Rhône-Alpes", prefCoords: [4.89, 44.93] },
  "27": { name: "Eure", prefecture: "Évreux", region: "Normandie", prefCoords: [1.15, 49.02] },
  "28": { name: "Eure-et-Loir", prefecture: "Chartres", region: "Centre-Val de Loire", prefCoords: [1.49, 48.45] },
  "29": { name: "Finistère", prefecture: "Quimper", region: "Bretagne", prefCoords: [-4.1, 48.0] },
  "30": { name: "Gard", prefecture: "Nîmes", region: "Occitanie", prefCoords: [4.36, 43.84] },
  "31": { name: "Haute-Garonne", prefecture: "Toulouse", region: "Occitanie", prefCoords: [1.44, 43.6] },
  "32": { name: "Gers", prefecture: "Auch", region: "Occitanie", prefCoords: [0.59, 43.65] },
  "33": { name: "Gironde", prefecture: "Bordeaux", region: "Nouvelle-Aquitaine", prefCoords: [-0.58, 44.84] },
  "34": { name: "Hérault", prefecture: "Montpellier", region: "Occitanie", prefCoords: [3.88, 43.61] },
  "35": { name: "Ille-et-Vilaine", prefecture: "Rennes", region: "Bretagne", prefCoords: [-1.68, 48.11] },
  "36": { name: "Indre", prefecture: "Châteauroux", region: "Centre-Val de Loire", prefCoords: [1.69, 46.81] },
  "37": { name: "Indre-et-Loire", prefecture: "Tours", region: "Centre-Val de Loire", prefCoords: [0.68, 47.39] },
  "38": { name: "Isère", prefecture: "Grenoble", region: "Auvergne-Rhône-Alpes", prefCoords: [5.72, 45.19] },
  "39": { name: "Jura", prefecture: "Lons-le-Saunier", region: "Bourgogne-Franche-Comté", prefCoords: [5.55, 46.67] },
  "40": { name: "Landes", prefecture: "Mont-de-Marsan", region: "Nouvelle-Aquitaine", prefCoords: [-0.5, 43.89] },
  "41": { name: "Loir-et-Cher", prefecture: "Blois", region: "Centre-Val de Loire", prefCoords: [1.33, 47.59] },
  "42": { name: "Loire", prefecture: "Saint-Étienne", region: "Auvergne-Rhône-Alpes", prefCoords: [4.39, 45.43] },
  "43": { name: "Haute-Loire", prefecture: "Le Puy-en-Velay", region: "Auvergne-Rhône-Alpes", prefCoords: [3.88, 45.04] },
  "44": { name: "Loire-Atlantique", prefecture: "Nantes", region: "Pays de la Loire", prefCoords: [-1.55, 47.22] },
  "45": { name: "Loiret", prefecture: "Orléans", region: "Centre-Val de Loire", prefCoords: [1.9, 47.9] },
  "46": { name: "Lot", prefecture: "Cahors", region: "Occitanie", prefCoords: [1.44, 44.45] },
  "47": { name: "Lot-et-Garonne", prefecture: "Agen", region: "Nouvelle-Aquitaine", prefCoords: [0.62, 44.2] },
  "48": { name: "Lozère", prefecture: "Mende", region: "Occitanie", prefCoords: [3.5, 44.52] },
  "49": { name: "Maine-et-Loire", prefecture: "Angers", region: "Pays de la Loire", prefCoords: [-0.55, 47.47] },
  "50": { name: "Manche", prefecture: "Saint-Lô", region: "Normandie", prefCoords: [-1.09, 49.12] },
  "51": { name: "Marne", prefecture: "Châlons-en-Champagne", region: "Grand Est", prefCoords: [4.37, 48.96] },
  "52": { name: "Haute-Marne", prefecture: "Chaumont", region: "Grand Est", prefCoords: [5.14, 48.11] },
  "53": { name: "Mayenne", prefecture: "Laval", region: "Pays de la Loire", prefCoords: [-0.77, 48.07] },
  "54": { name: "Meurthe-et-Moselle", prefecture: "Nancy", region: "Grand Est", prefCoords: [6.18, 48.69] },
  "55": { name: "Meuse", prefecture: "Bar-le-Duc", region: "Grand Est", prefCoords: [5.16, 48.77] },
  "56": { name: "Morbihan", prefecture: "Vannes", region: "Bretagne", prefCoords: [-2.76, 47.66] },
  "57": { name: "Moselle", prefecture: "Metz", region: "Grand Est", prefCoords: [6.18, 49.12] },
  "58": { name: "Nièvre", prefecture: "Nevers", region: "Bourgogne-Franche-Comté", prefCoords: [3.16, 46.99] },
  "59": { name: "Nord", prefecture: "Lille", region: "Hauts-de-France", prefCoords: [3.06, 50.63] },
  "60": { name: "Oise", prefecture: "Beauvais", region: "Hauts-de-France", prefCoords: [2.08, 49.43] },
  "61": { name: "Orne", prefecture: "Alençon", region: "Normandie", prefCoords: [0.09, 48.43] },
  "62": { name: "Pas-de-Calais", prefecture: "Arras", region: "Hauts-de-France", prefCoords: [2.77, 50.29] },
  "63": { name: "Puy-de-Dôme", prefecture: "Clermont-Ferrand", region: "Auvergne-Rhône-Alpes", prefCoords: [3.09, 45.78] },
  "64": { name: "Pyrénées-Atlantiques", prefecture: "Pau", region: "Nouvelle-Aquitaine", prefCoords: [-0.37, 43.3] },
  "65": { name: "Hautes-Pyrénées", prefecture: "Tarbes", region: "Occitanie", prefCoords: [0.08, 43.23] },
  "66": { name: "Pyrénées-Orientales", prefecture: "Perpignan", region: "Occitanie", prefCoords: [2.9, 42.7] },
  "67": { name: "Bas-Rhin", prefecture: "Strasbourg", region: "Grand Est", prefCoords: [7.75, 48.58] },
  "68": { name: "Haut-Rhin", prefecture: "Colmar", region: "Grand Est", prefCoords: [7.36, 48.08] },
  "69": { name: "Rhône", prefecture: "Lyon", region: "Auvergne-Rhône-Alpes", prefCoords: [4.84, 45.76] },
  "70": { name: "Haute-Saône", prefecture: "Vesoul", region: "Bourgogne-Franche-Comté", prefCoords: [6.15, 47.62] },
  "71": { name: "Saône-et-Loire", prefecture: "Mâcon", region: "Bourgogne-Franche-Comté", prefCoords: [4.83, 46.31] },
  "72": { name: "Sarthe", prefecture: "Le Mans", region: "Pays de la Loire", prefCoords: [0.2, 48.0] },
  "73": { name: "Savoie", prefecture: "Chambéry", region: "Auvergne-Rhône-Alpes", prefCoords: [5.92, 45.57] },
  "74": { name: "Haute-Savoie", prefecture: "Annecy", region: "Auvergne-Rhône-Alpes", prefCoords: [6.13, 45.9] },
  "75": { name: "Paris", prefecture: "Paris", region: "Île-de-France", prefCoords: [2.35, 48.86] },
  "76": { name: "Seine-Maritime", prefecture: "Rouen", region: "Normandie", prefCoords: [1.1, 49.44] },
  "77": { name: "Seine-et-Marne", prefecture: "Melun", region: "Île-de-France", prefCoords: [2.66, 48.54] },
  "78": { name: "Yvelines", prefecture: "Versailles", region: "Île-de-France", prefCoords: [2.13, 48.8] },
  "79": { name: "Deux-Sèvres", prefecture: "Niort", region: "Nouvelle-Aquitaine", prefCoords: [-0.46, 46.32] },
  "80": { name: "Somme", prefecture: "Amiens", region: "Hauts-de-France", prefCoords: [2.3, 49.89] },
  "81": { name: "Tarn", prefecture: "Albi", region: "Occitanie", prefCoords: [2.15, 43.93] },
  "82": { name: "Tarn-et-Garonne", prefecture: "Montauban", region: "Occitanie", prefCoords: [1.36, 44.02] },
  "83": { name: "Var", prefecture: "Toulon", region: "Provence-Alpes-Côte d'Azur", prefCoords: [5.93, 43.12] },
  "84": { name: "Vaucluse", prefecture: "Avignon", region: "Provence-Alpes-Côte d'Azur", prefCoords: [4.81, 43.95] },
  "85": { name: "Vendée", prefecture: "La Roche-sur-Yon", region: "Pays de la Loire", prefCoords: [-1.43, 46.67] },
  "86": { name: "Vienne", prefecture: "Poitiers", region: "Nouvelle-Aquitaine", prefCoords: [0.33, 46.58] },
  "87": { name: "Haute-Vienne", prefecture: "Limoges", region: "Nouvelle-Aquitaine", prefCoords: [1.26, 45.83] },
  "88": { name: "Vosges", prefecture: "Épinal", region: "Grand Est", prefCoords: [6.45, 48.17] },
  "89": { name: "Yonne", prefecture: "Auxerre", region: "Bourgogne-Franche-Comté", prefCoords: [3.57, 47.8] },
  "90": { name: "Territoire de Belfort", prefecture: "Belfort", region: "Bourgogne-Franche-Comté", prefCoords: [6.86, 47.64] },
  "91": { name: "Essonne", prefecture: "Évry", region: "Île-de-France", prefCoords: [2.43, 48.63] },
  "92": { name: "Hauts-de-Seine", prefecture: "Nanterre", region: "Île-de-France", prefCoords: [2.21, 48.89] },
  "93": { name: "Seine-Saint-Denis", prefecture: "Bobigny", region: "Île-de-France", prefCoords: [2.45, 48.91] },
  "94": { name: "Val-de-Marne", prefecture: "Créteil", region: "Île-de-France", prefCoords: [2.46, 48.79] },
  "95": { name: "Val-d'Oise", prefecture: "Cergy", region: "Île-de-France", prefCoords: [2.08, 49.04] }
};

// Region to departments mapping
const regionDepartments = {};
Object.entries(departments).forEach(([num, data]) => {
  if (!regionDepartments[data.region]) {
    regionDepartments[data.region] = [];
  }
  regionDepartments[data.region].push(num);
});

const FrenchDepartmentsMap = () => {
  const [hoveredDept, setHoveredDept] = useState(null);
  const [selectedDept, setSelectedDept] = useState(null);
  const [isMouseOverMap, setIsMouseOverMap] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const svgRef = useRef(null);

  // Detect mobile on mount
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Show hovered dept if mouse is over map, otherwise show selected
  const activeDept = (isMouseOverMap && hoveredDept) ? hoveredDept : selectedDept;
  const deptInfo = activeDept ? departments[activeDept] : null;

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedDept) return;
      
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        navigateDept('next');
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        navigateDept('prev');
      } else if (e.key === 'Escape') {
        setSelectedDept(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDept]);

  // Project coordinates to SVG space
  const projectCoords = (lon, lat) => {
    const lonMin = -5.5, lonMax = 9.5;
    const latMin = 41.3, latMax = 51.2;
    const x = ((lon - lonMin) / (lonMax - lonMin)) * 800;
    const y = ((latMax - lat) / (latMax - latMin)) * 900;
    return [x, y];
  };

  const handleDeptClick = (deptNum) => {
    setSelectedDept(deptNum === selectedDept ? null : deptNum);
  };

  const handleDeptHover = (deptNum) => {
    setHoveredDept(deptNum);
  };

  const handleMapMouseEnter = () => {
    setIsMouseOverMap(true);
  };

  const handleMapMouseLeave = () => {
    setIsMouseOverMap(false);
    setHoveredDept(null);
  };

  const handleMapClick = (e) => {
    // If clicking on the SVG background (not a department), reset selection
    if (e.target.tagName === 'svg') {
      setSelectedDept(null);
    }
  };

  const navigateDept = (direction) => {
    const deptNums = Object.keys(departments).sort((a, b) => {
      const getNumValue = (dept) => {
        if (dept === '2A') return 19.1;
        if (dept === '2B') return 19.2;
        return parseInt(dept);
      };
      return getNumValue(a) - getNumValue(b);
    });

    if (!selectedDept) {
      setSelectedDept(deptNums[0]);
      return;
    }

    const currentIndex = deptNums.indexOf(selectedDept);
    if (direction === 'next') {
      const nextIndex = (currentIndex + 1) % deptNums.length;
      setSelectedDept(deptNums[nextIndex]);
    } else {
      const prevIndex = currentIndex === 0 ? deptNums.length - 1 : currentIndex - 1;
      setSelectedDept(deptNums[prevIndex]);
    }
    setHoveredDept(null);
  };

  const getDeptFill = (deptNum) => {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (deptNum === activeDept) return isDark ? '#60a5fa' : '#3b82f6';
    if (deptInfo && departments[deptNum].region === deptInfo.region) {
      return isDark ? '#1e3a8a' : '#bfdbfe';
    }
    return isDark ? '#374151' : '#e5e7eb';
  };

  const getDeptStroke = (deptNum) => {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return deptNum === activeDept 
      ? (isDark ? '#2563eb' : '#1e40af')
      : (isDark ? '#6b7280' : '#9ca3af');
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 dark:bg-gray-900">
      {/* Info Panel */}
      <div className="w-full md:w-80 bg-white dark:bg-gray-800 shadow-lg p-6 flex flex-col">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Départements de France</h1>
        
        {deptInfo ? (
          <div className="flex-1">
            <div className="text-center mb-6">
              <div className="text-7xl font-bold text-blue-600 dark:text-blue-400 mb-2">{activeDept}</div>
              <div className="text-2xl font-semibold text-gray-800 dark:text-gray-100">{deptInfo.name}</div>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">Préfecture</div>
                <div className="text-lg text-gray-800 dark:text-gray-200">{deptInfo.prefecture}</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">Région</div>
                <div className="text-lg text-gray-800 dark:text-gray-200">{deptInfo.region}</div>
              </div>
            </div>

            {/* Mobile Navigation Buttons */}
            {isMobile && selectedDept && (
              <div className="mt-6 flex gap-2">
                <button
                  onClick={() => navigateDept('prev')}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  ← Précédent
                </button>
                <button
                  onClick={() => navigateDept('next')}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  Suivant →
                </button>
              </div>
            )}

            {selectedDept && !isMobile && (
              <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <div className="text-sm text-blue-800 dark:text-blue-300">
                  <div className="font-medium mb-1">Navigation:</div>
                  <div>← → ou ↑ ↓ pour parcourir</div>
                  <div>ESC pour désélectionner</div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400 dark:text-gray-500">
              <div className="text-lg mb-2">{isMobile ? 'Touchez' : 'Survolez'} une région</div>
              <div className="text-sm">ou cliquez pour naviguer</div>
            </div>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="flex-1 p-4 md:p-8 overflow-auto">
        <svg 
          ref={svgRef}
          viewBox="0 0 800 900" 
          className="w-full h-full"
          style={{ maxWidth: '1000px', margin: '0 auto' }}
          onMouseEnter={handleMapMouseEnter}
          onMouseLeave={handleMapMouseLeave}
          onClick={handleMapClick}
        >
          {/* Simplified department shapes */}
          {Object.entries(departments).map(([num, data]) => {
            const [x, y] = projectCoords(data.prefCoords[0], data.prefCoords[1]);
            const size = 40;
            
            return (
              <g key={num}>
                {/* Department shape (simplified as rectangle) */}
                <rect
                  x={x - size/2}
                  y={y - size/2}
                  width={size}
                  height={size}
                  fill={getDeptFill(num)}
                  stroke={getDeptStroke(num)}
                  strokeWidth={num === activeDept ? 3 : 1}
                  onMouseEnter={() => handleDeptHover(num)}
                  onMouseLeave={() => setHoveredDept(null)}
                  onClick={() => handleDeptClick(num)}
                  className="cursor-pointer transition-all duration-200"
                  style={{ pointerEvents: 'all' }}
                />
                
                {/* Department number */}
                <text
                  x={x}
                  y={y + 5}
                  textAnchor="middle"
                  className="text-xs font-semibold pointer-events-none"
                  fill={num === activeDept ? 'white' : '#374151'}
                >
                  {num}
                </text>
                
                {/* Prefecture dot */}
                {num === activeDept && (
                  <circle
                    cx={x}
                    cy={y}
                    r={4}
                    fill="#ef4444"
                    stroke="white"
                    strokeWidth={2}
                    className="pointer-events-none"
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default FrenchDepartmentsMap;