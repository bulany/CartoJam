/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CartoJam WarGames WOPR 3D Flight Tracker - Core Data & Offline Vector Database
 * Contains:
 * - 130+ Major World Airports with exact IATA, coordinates, and metadata
 * - Offline Simplified World Coastline Polylines (100% offline-safe, zero 404s)
 * - Built-in Pre-cached Real-World Flight Schedules (EY426, EY62, BA15, QF1, SQ22, etc.)
 */

(function () {
  'use strict';

  var AIRPORTS = [
    // Europe
    { iata: 'GVA', name: 'Geneva Airport', city: 'Geneva', country: 'Switzerland', lat: 46.2381, lon: 6.1089 },
    { iata: 'ZRH', name: 'Zurich Airport', city: 'Zurich', country: 'Switzerland', lat: 47.4582, lon: 8.5555 },
    { iata: 'LYS', name: 'Lyon–Saint-Exupéry Airport', city: 'Lyon', country: 'France', lat: 45.7256, lon: 5.0811 },
    { iata: 'CDG', name: 'Paris Charles de Gaulle', city: 'Paris', country: 'France', lat: 49.0097, lon: 2.5479 },
    { iata: 'ORY', name: 'Paris Orly Airport', city: 'Paris', country: 'France', lat: 48.7262, lon: 2.3652 },
    { iata: 'NCE', name: 'Nice Côte d’Azur', city: 'Nice', country: 'France', lat: 43.6653, lon: 7.2150 },
    { iata: 'LHR', name: 'London Heathrow', city: 'London', country: 'United Kingdom', lat: 51.4700, lon: -0.4543 },
    { iata: 'LGW', name: 'London Gatwick', city: 'London', country: 'United Kingdom', lat: 51.1537, lon: -0.1821 },
    { iata: 'MAN', name: 'Manchester Airport', city: 'Manchester', country: 'United Kingdom', lat: 53.3537, lon: -2.2750 },
    { iata: 'EDI', name: 'Edinburgh Airport', city: 'Edinburgh', country: 'United Kingdom', lat: 55.9500, lon: -3.3725 },
    { iata: 'DUB', name: 'Dublin Airport', city: 'Dublin', country: 'Ireland', lat: 53.4264, lon: -6.2499 },
    { iata: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany', lat: 50.0379, lon: 8.5622 },
    { iata: 'MUC', name: 'Munich Airport', city: 'Munich', country: 'Germany', lat: 48.3537, lon: 11.7750 },
    { iata: 'BER', name: 'Berlin Brandenburg', city: 'Berlin', country: 'Germany', lat: 52.3667, lon: 13.5033 },
    { iata: 'AMS', name: 'Amsterdam Schiphol', city: 'Amsterdam', country: 'Netherlands', lat: 52.3105, lon: 4.7683 },
    { iata: 'BRU', name: 'Brussels Airport', city: 'Brussels', country: 'Belgium', lat: 50.9010, lon: 4.4856 },
    { iata: 'VIE', name: 'Vienna International', city: 'Vienna', country: 'Austria', lat: 48.1103, lon: 16.5697 },
    { iata: 'MAD', name: 'Madrid-Barajas', city: 'Madrid', country: 'Spain', lat: 40.4839, lon: -3.5680 },
    { iata: 'BCN', name: 'Barcelona-El Prat', city: 'Barcelona', country: 'Spain', lat: 41.2974, lon: 2.0833 },
    { iata: 'LIS', name: 'Lisbon Portela Airport', city: 'Lisbon', country: 'Portugal', lat: 38.7742, lon: -9.1342 },
    { iata: 'FCO', name: 'Rome Leonardo da Vinci', city: 'Rome', country: 'Italy', lat: 41.8003, lon: 12.2389 },
    { iata: 'MXP', name: 'Milan Malpensa', city: 'Milan', country: 'Italy', lat: 45.6301, lon: 8.7255 },
    { iata: 'ATH', name: 'Athens International', city: 'Athens', country: 'Greece', lat: 37.9364, lon: 23.9484 },
    { iata: 'CPH', name: 'Copenhagen Airport', city: 'Copenhagen', country: 'Denmark', lat: 55.6180, lon: 12.6508 },
    { iata: 'ARN', name: 'Stockholm Arlanda', city: 'Stockholm', country: 'Sweden', lat: 59.6498, lon: 17.9238 },
    { iata: 'OSL', name: 'Oslo Gardermoen', city: 'Oslo', country: 'Norway', lat: 60.1976, lon: 11.1004 },
    { iata: 'HEL', name: 'Helsinki-Vantaa', city: 'Helsinki', country: 'Finland', lat: 60.3172, lon: 24.9633 },
    { iata: 'WAW', name: 'Warsaw Chopin', city: 'Warsaw', country: 'Poland', lat: 52.1672, lon: 20.9679 },
    { iata: 'PRG', name: 'Prague Václav Havel', city: 'Prague', country: 'Czechia', lat: 50.1008, lon: 14.2600 },
    { iata: 'BUD', name: 'Budapest Ferenc Liszt', city: 'Budapest', country: 'Hungary', lat: 47.4369, lon: 19.2556 },
    { iata: 'IST', name: 'Istanbul Airport', city: 'Istanbul', country: 'Turkey', lat: 41.2753, lon: 28.7519 },
    { iata: 'KEF', name: 'Keflavik International', city: 'Reykjavik', country: 'Iceland', lat: 63.9850, lon: -22.6056 },

    // Middle East & Africa
    { iata: 'AUH', name: 'Zayed International', city: 'Abu Dhabi', country: 'United Arab Emirates', lat: 24.4330, lon: 54.6511 },
    { iata: 'DXB', name: 'Dubai International', city: 'Dubai', country: 'United Arab Emirates', lat: 25.2532, lon: 55.3657 },
    { iata: 'DOH', name: 'Hamad International', city: 'Doha', country: 'Qatar', lat: 25.2731, lon: 51.6081 },
    { iata: 'RUH', name: 'King Khalid International', city: 'Riyadh', country: 'Saudi Arabia', lat: 24.9576, lon: 46.6988 },
    { iata: 'JED', name: 'King Abdulaziz International', city: 'Jeddah', country: 'Saudi Arabia', lat: 21.6796, lon: 39.1565 },
    { iata: 'KWI', name: 'Kuwait International', city: 'Kuwait City', country: 'Kuwait', lat: 29.2266, lon: 47.9789 },
    { iata: 'BAH', name: 'Bahrain International', city: 'Manama', country: 'Bahrain', lat: 26.2708, lon: 50.6336 },
    { iata: 'MCT', name: 'Muscat International', city: 'Muscat', country: 'Oman', lat: 23.5933, lon: 58.2844 },
    { iata: 'TLV', name: 'Ben Gurion Airport', city: 'Tel Aviv', country: 'Israel', lat: 32.0055, lon: 34.8854 },
    { iata: 'CAI', name: 'Cairo International', city: 'Cairo', country: 'Egypt', lat: 30.1219, lon: 31.4056 },
    { iata: 'CMN', name: 'Mohammed V International', city: 'Casablanca', country: 'Morocco', lat: 33.3675, lon: -7.5898 },
    { iata: 'NBO', name: 'Jomo Kenyatta International', city: 'Nairobi', country: 'Kenya', lat: -1.3192, lon: 36.9275 },
    { iata: 'ADD', name: 'Addis Ababa Bole', city: 'Addis Ababa', country: 'Ethiopia', lat: 8.9779, lon: 38.7993 },
    { iata: 'JNB', name: 'O. R. Tambo International', city: 'Johannesburg', country: 'South Africa', lat: -26.1367, lon: 28.2411 },
    { iata: 'CPT', name: 'Cape Town International', city: 'Cape Town', country: 'South Africa', lat: -33.9715, lon: 18.6021 },
    { iata: 'LOS', name: 'Murtala Muhammed', city: 'Lagos', country: 'Nigeria', lat: 6.5774, lon: 3.3212 },
    { iata: 'MRU', name: 'Sir Seewoosagur Ramgoolam', city: 'Port Louis', country: 'Mauritius', lat: -20.4302, lon: 57.6836 },

    // Asia
    { iata: 'CNX', name: 'Chiang Mai International', city: 'Chiang Mai', country: 'Thailand', lat: 18.7668, lon: 98.9626 },
    { iata: 'BKK', name: 'Suvarnabhumi Airport', city: 'Bangkok', country: 'Thailand', lat: 13.6900, lon: 100.7501 },
    { iata: 'HKT', name: 'Phuket International', city: 'Phuket', country: 'Thailand', lat: 8.1132, lon: 98.3169 },
    { iata: 'SIN', name: 'Singapore Changi', city: 'Singapore', country: 'Singapore', lat: 1.3644, lon: 103.9915 },
    { iata: 'KUL', name: 'Kuala Lumpur International', city: 'Kuala Lumpur', country: 'Malaysia', lat: 2.7456, lon: 101.7099 },
    { iata: 'CGK', name: 'Soekarno-Hatta', city: 'Jakarta', country: 'Indonesia', lat: -6.1275, lon: 106.6537 },
    { iata: 'DPS', name: 'Ngurah Rai International', city: 'Bali / Denpasar', country: 'Indonesia', lat: -8.7482, lon: 115.1672 },
    { iata: 'MNL', name: 'Ninoy Aquino International', city: 'Manila', country: 'Philippines', lat: 14.5086, lon: 121.0194 },
    { iata: 'SGN', name: 'Tan Son Nhat International', city: 'Ho Chi Minh City', country: 'Vietnam', lat: 10.8188, lon: 106.6519 },
    { iata: 'HAN', name: 'Noi Bai International', city: 'Hanoi', country: 'Vietnam', lat: 21.2212, lon: 105.8072 },
    { iata: 'HKG', name: 'Hong Kong International', city: 'Hong Kong', country: 'Hong Kong', lat: 22.3080, lon: 113.9185 },
    { iata: 'TPE', name: 'Taiwan Taoyuan', city: 'Taipei', country: 'Taiwan', lat: 25.0797, lon: 121.2342 },
    { iata: 'HND', name: 'Tokyo Haneda', city: 'Tokyo', country: 'Japan', lat: 35.5494, lon: 139.7798 },
    { iata: 'NRT', name: 'Tokyo Narita', city: 'Tokyo', country: 'Japan', lat: 35.7720, lon: 140.3929 },
    { iata: 'KIX', name: 'Kansai International', city: 'Osaka', country: 'Japan', lat: 34.4320, lon: 135.2304 },
    { iata: 'ICN', name: 'Incheon International', city: 'Seoul', country: 'South Korea', lat: 37.4602, lon: 126.4407 },
    { iata: 'PEK', name: 'Beijing Capital', city: 'Beijing', country: 'China', lat: 40.0799, lon: 116.6031 },
    { iata: 'PKX', name: 'Beijing Daxing', city: 'Beijing', country: 'China', lat: 39.5098, lon: 116.4105 },
    { iata: 'PVG', name: 'Shanghai Pudong', city: 'Shanghai', country: 'China', lat: 31.1443, lon: 121.8083 },
    { iata: 'CAN', name: 'Guangzhou Baiyun', city: 'Guangzhou', country: 'China', lat: 23.3924, lon: 113.2988 },
    { iata: 'DEL', name: 'Indira Gandhi International', city: 'Delhi', country: 'India', lat: 28.5562, lon: 77.1000 },
    { iata: 'BOM', name: 'Chhatrapati Shivaji Maharaj', city: 'Mumbai', country: 'India', lat: 19.0896, lon: 72.8656 },
    { iata: 'BLR', name: 'Kempegowda International', city: 'Bengaluru', country: 'India', lat: 13.1986, lon: 77.7066 },
    { iata: 'MAA', name: 'Chennai International', city: 'Chennai', country: 'India', lat: 12.9941, lon: 80.1709 },
    { iata: 'CCU', name: 'Netaji Subhash Chandra Bose', city: 'Kolkata', country: 'India', lat: 22.6547, lon: 88.4467 },
    { iata: 'CMB', name: 'Bandaranaike International', city: 'Colombo', country: 'Sri Lanka', lat: 7.1808, lon: 79.8841 },
    { iata: 'KTM', name: 'Tribhuvan International', city: 'Kathmandu', country: 'Nepal', lat: 27.6966, lon: 85.3591 },
    { iata: 'MLE', name: 'Velana International', city: 'Male', country: 'Maldives', lat: 4.1918, lon: 73.5290 },

    // Oceania & Pacific
    { iata: 'SYD', name: 'Sydney Kingsford Smith', city: 'Sydney', country: 'Australia', lat: -33.9399, lon: 151.1753 },
    { iata: 'MEL', name: 'Melbourne Airport', city: 'Melbourne', country: 'Australia', lat: -37.6690, lon: 144.8410 },
    { iata: 'BNE', name: 'Brisbane Airport', city: 'Brisbane', country: 'Australia', lat: -27.3942, lon: 153.1218 },
    { iata: 'PER', name: 'Perth Airport', city: 'Perth', country: 'Australia', lat: -31.9385, lon: 115.9672 },
    { iata: 'ADL', name: 'Adelaide Airport', city: 'Adelaide', country: 'Australia', lat: -34.9450, lon: 138.5306 },
    { iata: 'AKL', name: 'Auckland Airport', city: 'Auckland', country: 'New Zealand', lat: -37.0082, lon: 174.7850 },
    { iata: 'CHC', name: 'Christchurch Airport', city: 'Christchurch', country: 'New Zealand', lat: -43.4894, lon: 172.5322 },
    { iata: 'NAN', name: 'Nadi International', city: 'Nadi', country: 'Fiji', lat: -17.7554, lon: 177.4434 },
    { iata: 'PPT', name: 'Faa’a International', city: 'Papeete / Tahiti', country: 'French Polynesia', lat: -17.5537, lon: -149.6074 },
    { iata: 'GUM', name: 'Antonio B. Won Pat', city: 'Guam', country: 'Guam', lat: 13.4839, lon: 144.7972 },
    { iata: 'HNL', name: 'Daniel K. Inouye', city: 'Honolulu', country: 'United States', lat: 21.3187, lon: -157.9225 },

    // North America
    { iata: 'JFK', name: 'John F. Kennedy International', city: 'New York', country: 'United States', lat: 40.6413, lon: -73.7781 },
    { iata: 'EWR', name: 'Newark Liberty International', city: 'New York / Newark', country: 'United States', lat: 40.6895, lon: -74.1745 },
    { iata: 'LGA', name: 'LaGuardia Airport', city: 'New York', country: 'United States', lat: 40.7769, lon: -73.8740 },
    { iata: 'LAX', name: 'Los Angeles International', city: 'Los Angeles', country: 'United States', lat: 33.9416, lon: -118.4085 },
    { iata: 'SFO', name: 'San Francisco International', city: 'San Francisco', country: 'United States', lat: 37.6213, lon: -122.3790 },
    { iata: 'ORD', name: 'O’Hare International', city: 'Chicago', country: 'United States', lat: 41.9742, lon: -87.9073 },
    { iata: 'ATL', name: 'Hartsfield-Jackson Atlanta', city: 'Atlanta', country: 'United States', lat: 33.6407, lon: -84.4277 },
    { iata: 'DFW', name: 'Dallas/Fort Worth', city: 'Dallas', country: 'United States', lat: 32.8998, lon: -97.0403 },
    { iata: 'DEN', name: 'Denver International', city: 'Denver', country: 'United States', lat: 39.8561, lon: -104.6737 },
    { iata: 'MIA', name: 'Miami International', city: 'Miami', country: 'United States', lat: 25.7959, lon: -80.2870 },
    { iata: 'SEA', name: 'Seattle-Tacoma', city: 'Seattle', country: 'United States', lat: 47.4502, lon: -122.3088 },
    { iata: 'BOS', name: 'Boston Logan International', city: 'Boston', country: 'United States', lat: 42.3656, lon: -71.0096 },
    { iata: 'IAD', name: 'Washington Dulles', city: 'Washington D.C.', country: 'United States', lat: 38.9531, lon: -77.4565 },
    { iata: 'IAH', name: 'George Bush Intercontinental', city: 'Houston', country: 'United States', lat: 29.9902, lon: -95.3368 },
    { iata: 'LAS', name: 'Harry Reid International', city: 'Las Vegas', country: 'United States', lat: 36.0840, lon: -115.1537 },
    { iata: 'PHX', name: 'Phoenix Sky Harbor', city: 'Phoenix', country: 'United States', lat: 33.4342, lon: -112.0080 },
    { iata: 'MCO', name: 'Orlando International', city: 'Orlando', country: 'United States', lat: 28.4312, lon: -81.3081 },
    { iata: 'MSP', name: 'Minneapolis–Saint Paul', city: 'Minneapolis', country: 'United States', lat: 44.8848, lon: -93.2223 },
    { iata: 'DTW', name: 'Detroit Metropolitan', city: 'Detroit', country: 'United States', lat: 42.2162, lon: -83.3554 },
    { iata: 'PHL', name: 'Philadelphia International', city: 'Philadelphia', country: 'United States', lat: 39.8729, lon: -75.2437 },
    { iata: 'SAN', name: 'San Diego International', city: 'San Diego', country: 'United States', lat: 32.7338, lon: -117.1933 },
    { iata: 'ANC', name: 'Ted Stevens Anchorage', city: 'Anchorage', country: 'United States', lat: 61.1743, lon: -149.9964 },
    { iata: 'YYZ', name: 'Toronto Pearson', city: 'Toronto', country: 'Canada', lat: 43.6777, lon: -79.6248 },
    { iata: 'YVR', name: 'Vancouver International', city: 'Vancouver', country: 'Canada', lat: 49.1967, lon: -123.1815 },
    { iata: 'YUL', name: 'Montréal-Trudeau', city: 'Montreal', country: 'Canada', lat: 45.4706, lon: -73.7408 },
    { iata: 'YYC', name: 'Calgary International', city: 'Calgary', country: 'Canada', lat: 51.1215, lon: -114.0076 },
    { iata: 'MEX', name: 'Mexico City Benito Juárez', city: 'Mexico City', country: 'Mexico', lat: 19.4361, lon: -99.0719 },
    { iata: 'CUN', name: 'Cancún International', city: 'Cancun', country: 'Mexico', lat: 21.0365, lon: -86.8771 },

    // Central & South America
    { iata: 'PTY', name: 'Tocumen International', city: 'Panama City', country: 'Panama', lat: 9.0714, lon: -79.3835 },
    { iata: 'SJO', name: 'Juan Santamaría', city: 'San Jose', country: 'Costa Rica', lat: 9.9981, lon: -84.2088 },
    { iata: 'BOG', name: 'El Dorado International', city: 'Bogota', country: 'Colombia', lat: 4.7016, lon: -74.1469 },
    { iata: 'LIM', name: 'Jorge Chávez International', city: 'Lima', country: 'Peru', lat: -12.0219, lon: -77.1143 },
    { iata: 'SCL', name: 'Arturo Merino Benítez', city: 'Santiago', country: 'Chile', lat: -33.3930, lon: -70.7858 },
    { iata: 'EZE', name: 'Ministro Pistarini (Ezeiza)', city: 'Buenos Aires', country: 'Argentina', lat: -34.8222, lon: -58.5358 },
    { iata: 'GRU', name: 'São Paulo/Guarulhos', city: 'Sao Paulo', country: 'Brazil', lat: -23.4356, lon: -46.4731 },
    { iata: 'GIG', name: 'Rio de Janeiro Galeão', city: 'Rio de Janeiro', country: 'Brazil', lat: -22.8134, lon: -43.2494 },
    { iata: 'BSB', name: 'Brasília International', city: 'Brasilia', country: 'Brazil', lat: -15.8697, lon: -47.9172 },
    { iata: 'UIO', name: 'Mariscal Sucre International', city: 'Quito', country: 'Ecuador', lat: -0.1292, lon: -78.3575 },
    { iata: 'GUA', name: 'La Aurora International', city: 'Guatemala City', country: 'Guatemala', lat: 14.5833, lon: -90.5275 },
    { iata: 'HAV', name: 'José Martí International', city: 'Havana', country: 'Cuba', lat: 22.9892, lon: -82.4091 },
    { iata: 'SJU', name: 'Luis Muñoz Marín', city: 'San Juan', country: 'Puerto Rico', lat: 18.4394, lon: -66.0018 }
  ];

  // Offline simplified continent boundaries (lon, lat polylines)
  // High quality vector outlines covering all major landmasses
  var COASTLINES = [
    // Africa
    [
      [-5.8, 35.8], [9.8, 37.3], [11.0, 37.1], [15.2, 32.3], [24.0, 32.2], [31.5, 31.3],
      [34.3, 27.8], [35.5, 23.0], [43.4, 12.6], [51.2, 10.4], [50.5, 1.8], [40.7, -4.7],
      [39.2, -7.0], [40.5, -11.0], [35.5, -23.8], [32.8, -26.0], [28.0, -32.8], [25.7, -33.9],
      [19.8, -34.8], [18.4, -34.3], [14.5, -23.0], [12.0, -17.0], [9.0, -1.0], [4.0, 4.5],
      [-1.0, 5.5], [-7.5, 4.3], [-14.8, 12.0], [-17.5, 14.7], [-16.0, 21.0], [-11.0, 27.5],
      [-9.8, 30.5], [-5.8, 35.8]
    ],
    // Madagascar
    [
      [49.3, -12.0], [50.5, -15.8], [47.5, -25.5], [44.0, -25.2], [43.5, -20.0],
      [46.5, -15.5], [49.3, -12.0]
    ],
    // Eurasia (Europe + Asia mainland)
    [
      [-9.5, 37.0], [-9.0, 43.0], [-1.8, 43.5], [-4.5, 48.4], [1.5, 50.8], [8.5, 54.0],
      [9.5, 57.5], [12.0, 55.5], [18.5, 54.5], [24.0, 57.0], [29.0, 60.0], [32.0, 69.0],
      [40.0, 67.5], [50.0, 68.5], [60.0, 70.0], [75.0, 73.0], [105.0, 77.5], [140.0, 73.0],
      [170.0, 69.5], [170.0, 66.0], [190.0, 66.0], [178.0, 64.0], [162.0, 57.0], [156.0, 51.0],
      [143.0, 53.0], [132.0, 43.0], [129.0, 35.0], [126.5, 34.0], [120.0, 37.5], [118.0, 39.0],
      [122.0, 30.0], [119.0, 25.5], [114.0, 22.3], [108.5, 19.0], [109.0, 13.0], [104.0, 10.0],
      [100.5, 13.5], [100.0, 7.0], [103.8, 1.3], [98.5, 8.0], [96.0, 16.5], [89.0, 21.5],
      [80.0, 16.0], [80.0, 10.0], [77.5, 8.1], [72.5, 19.0], [68.0, 24.0], [62.0, 25.2],
      [56.5, 26.0], [50.0, 30.0], [48.0, 30.0], [48.0, 27.0], [55.0, 22.0], [54.0, 17.0],
      [44.0, 12.5], [43.0, 16.5], [35.0, 27.0], [36.0, 36.0], [30.0, 36.5], [26.0, 39.0],
      [23.5, 38.0], [21.5, 39.5], [19.0, 42.0], [13.0, 45.5], [15.5, 41.0], [15.0, 38.0],
      [11.0, 43.5], [6.0, 43.2], [3.0, 42.0], [0.0, 40.0], [-2.0, 36.8], [-6.0, 36.0],
      [-9.5, 37.0]
    ],
    // Scandinavia
    [
      [5.0, 59.0], [5.0, 62.0], [11.0, 64.0], [14.0, 68.0], [24.0, 71.0], [31.0, 70.0],
      [27.0, 65.0], [21.0, 63.5], [18.0, 59.5], [13.0, 55.5], [8.0, 57.0], [5.0, 59.0]
    ],
    // Great Britain & Ireland
    [
      [-5.0, 50.0], [-1.0, 50.5], [1.5, 52.0], [0.5, 54.0], [-2.0, 57.5], [-5.0, 58.5],
      [-5.5, 56.0], [-3.5, 54.5], [-4.5, 52.0], [-5.0, 50.0]
    ],
    [
      [-6.0, 53.5], [-6.0, 55.0], [-9.5, 54.0], [-10.0, 52.0], [-7.5, 51.5], [-6.0, 53.5]
    ],
    // Japan
    [
      [131.0, 33.0], [133.0, 35.0], [137.0, 37.0], [141.0, 41.5], [141.0, 38.0],
      [140.0, 35.0], [136.0, 34.0], [131.0, 33.0]
    ],
    [
      [141.0, 42.0], [145.5, 43.5], [142.0, 45.5], [140.5, 43.0], [141.0, 42.0]
    ],
    // North America
    [
      [-168.0, 66.0], [-160.0, 71.0], [-130.0, 70.0], [-110.0, 68.0], [-90.0, 65.0],
      [-82.0, 65.0], [-78.0, 55.0], [-82.0, 52.0], [-65.0, 58.0], [-60.0, 50.0],
      [-65.0, 44.0], [-71.0, 42.0], [-75.0, 38.0], [-76.0, 34.0], [-80.5, 25.0],
      [-82.5, 28.0], [-88.0, 30.0], [-94.0, 29.5], [-97.5, 26.0], [-96.0, 20.0],
      [-90.0, 19.5], [-87.0, 21.5], [-88.0, 16.0], [-83.0, 10.0], [-78.0, 7.5],
      [-82.0, 8.5], [-90.0, 14.0], [-100.0, 17.0], [-105.0, 20.0], [-109.0, 23.0],
      [-110.0, 28.0], [-117.0, 32.5], [-122.0, 37.5], [-124.0, 43.0], [-125.0, 50.0],
      [-135.0, 57.0], [-145.0, 60.0], [-155.0, 57.0], [-165.0, 54.0], [-168.0, 66.0]
    ],
    // Greenland
    [
      [-44.0, 60.0], [-35.0, 66.0], [-20.0, 76.0], [-30.0, 82.0], [-55.0, 82.0],
      [-60.0, 76.0], [-53.0, 69.0], [-48.0, 62.0], [-44.0, 60.0]
    ],
    // South America
    [
      [-77.0, 8.0], [-72.0, 12.0], [-62.0, 10.5], [-50.0, 0.0], [-35.0, -5.0],
      [-36.0, -10.0], [-39.0, -18.0], [-44.0, -23.0], [-48.0, -28.0], [-53.0, -33.0],
      [-58.0, -38.0], [-65.0, -42.0], [-67.0, -55.0], [-75.0, -50.0], [-73.0, -40.0],
      [-71.0, -30.0], [-76.0, -15.0], [-80.0, -5.0], [-79.0, 1.0], [-77.0, 8.0]
    ],
    // Australia
    [
      [114.0, -22.0], [122.0, -17.0], [130.0, -12.0], [136.0, -12.0], [142.0, -10.5],
      [145.0, -15.0], [153.0, -28.0], [150.0, -37.0], [140.0, -38.0], [137.0, -35.0],
      [129.0, -32.0], [118.0, -35.0], [115.0, -32.0], [113.0, -26.0], [114.0, -22.0]
    ],
    // New Zealand
    [
      [173.0, -35.0], [178.0, -38.0], [175.0, -41.5], [171.0, -44.0], [167.0, -46.5],
      [170.0, -43.0], [172.5, -41.0], [174.5, -36.5], [173.0, -35.0]
    ],
    // Indonesia & Philippines clusters
    [
      [95.5, 5.5], [105.0, -6.0], [108.0, -7.0], [114.0, -8.5], [107.0, -6.5], [100.0, 0.0], [95.5, 5.5]
    ],
    [
      [110.0, 1.0], [118.0, 5.0], [119.0, -4.0], [110.0, -3.0], [110.0, 1.0]
    ],
    [
      [120.0, 18.0], [125.0, 13.0], [126.0, 7.0], [122.0, 7.0], [120.0, 14.0], [120.0, 18.0]
    ],
    // Antarctica (perimeter line)
    [
      [-60.0, -64.0], [-40.0, -75.0], [0.0, -70.0], [40.0, -67.0], [80.0, -66.0],
      [120.0, -66.0], [160.0, -70.0], [180.0, -78.0], [-150.0, -75.0], [-110.0, -73.0],
      [-80.0, -72.0], [-60.0, -64.0]
    ]
  ];

  // Pre-cached real-world flight schedules and connected itineraries
  var CACHED_FLIGHTS = {
    'BA15': {
      callsign: 'BA15',
      airline: 'British Airways',
      aircraft: 'Boeing 777-300ER',
      instances: [
        {
          id: 'ba15_kangaroo',
          title: 'BA15 (Kangaroo Route: LHR ➔ SIN ➔ SYD)',
          subtitle: 'London Heathrow ➔ Singapore ➔ Sydney (British Airways)',
          departureHourOffset: -30,
          legs: [
            {
              id: 'ba15_leg1',
              callsign: 'BA15',
              airline: 'British Airways',
              aircraft: 'Boeing 777-300ER',
              fromIata: 'LHR',
              toIata: 'SIN',
              depTimeStr: '21:30 UTC',
              flightMinutes: 785, // 13h 05m
              layoverMinutes: 105 // 1h 45m
            },
            {
              id: 'ba15_leg2',
              callsign: 'BA15',
              airline: 'British Airways',
              aircraft: 'Boeing 777-300ER',
              fromIata: 'SIN',
              toIata: 'SYD',
              depTimeStr: '18:00 UTC',
              flightMinutes: 470, // 7h 50m
              layoverMinutes: 0
            }
          ]
        },
        {
          id: 'ba15_sector2',
          title: 'BA15 (Direct Sector: SIN ➔ SYD)',
          subtitle: 'Singapore Changi ➔ Sydney Kingsford Smith',
          departureHourOffset: -16,
          legs: [
            {
              id: 'ba15_leg2_only',
              callsign: 'BA15',
              airline: 'British Airways',
              aircraft: 'Boeing 777-300ER',
              fromIata: 'SIN',
              toIata: 'SYD',
              depTimeStr: '18:00 UTC',
              flightMinutes: 470,
              layoverMinutes: 0
            }
          ]
        }
      ]
    },
    'QF1': {
      callsign: 'QF1',
      airline: 'Qantas Airways',
      aircraft: 'Airbus A380-800',
      instances: [
        {
          id: 'qf1_route',
          title: 'QF1 (SYD ➔ SIN ➔ LHR)',
          subtitle: 'Sydney ➔ Singapore ➔ London Heathrow',
          departureHourOffset: -36,
          legs: [
            {
              id: 'qf1_leg1',
              callsign: 'QF1',
              airline: 'Qantas',
              fromIata: 'SYD',
              toIata: 'SIN',
              depTimeStr: '05:00 UTC',
              flightMinutes: 495, // 8h 15m
              layoverMinutes: 120 // 2h layover
            },
            {
              id: 'qf1_leg2',
              callsign: 'QF1',
              airline: 'Qantas',
              fromIata: 'SIN',
              toIata: 'LHR',
              depTimeStr: '15:15 UTC',
              flightMinutes: 865, // 14h 25m
              layoverMinutes: 0
            }
          ]
        }
      ]
    },
    'SQ22': {
      callsign: 'SQ22',
      airline: 'Singapore Airlines',
      aircraft: 'Airbus A350-900ULR',
      instances: [
        {
          id: 'sq22_direct',
          title: 'SQ22 (SIN ➔ EWR) — Ultra Long Haul',
          subtitle: 'World’s Longest Commercial Non-Stop Route (18h 45m)',
          departureHourOffset: -18,
          legs: [
            {
              id: 'sq22_leg1',
              callsign: 'SQ22',
              airline: 'Singapore Airlines',
              fromIata: 'SIN',
              toIata: 'EWR',
              depTimeStr: '15:35 UTC',
              flightMinutes: 1125, // 18h 45m
              layoverMinutes: 0
            }
          ]
        }
      ]
    },
    'AF001': {
      callsign: 'AF001',
      airline: 'Air France (Heritage)',
      aircraft: 'Concorde / Boeing 777',
      instances: [
        {
          id: 'af001_transatlantic',
          title: 'AF001 (JFK ➔ CDG)',
          subtitle: 'New York JFK ➔ Paris Charles de Gaulle',
          departureHourOffset: -12,
          legs: [
            {
              id: 'af001_leg1',
              callsign: 'AF001',
              airline: 'Air France',
              fromIata: 'JFK',
              toIata: 'CDG',
              depTimeStr: '23:30 UTC',
              flightMinutes: 435, // 7h 15m
              layoverMinutes: 0
            }
          ]
        }
      ]
    },
    'EK201': {
      callsign: 'EK201',
      airline: 'Emirates',
      aircraft: 'Airbus A380-800',
      instances: [
        {
          id: 'ek201_direct',
          title: 'EK201 (DXB ➔ JFK)',
          subtitle: 'Dubai International ➔ New York JFK',
          departureHourOffset: -20,
          legs: [
            {
              id: 'ek201_leg1',
              callsign: 'EK201',
              airline: 'Emirates',
              fromIata: 'DXB',
              toIata: 'JFK',
              depTimeStr: '04:30 UTC',
              flightMinutes: 850, // 14h 10m
              layoverMinutes: 0
            }
          ]
        }
      ]
    },
    'TG931': {
      callsign: 'TG931',
      airline: 'Thai Airways',
      aircraft: 'Boeing 777-300ER',
      instances: [
        {
          id: 'tg931_direct',
          title: 'TG931 (CDG ➔ BKK)',
          subtitle: 'Paris CDG ➔ Bangkok Suvarnabhumi',
          departureHourOffset: -14,
          legs: [
            {
              id: 'tg931_leg1',
              callsign: 'TG931',
              airline: 'Thai Airways',
              fromIata: 'CDG',
              toIata: 'BKK',
              depTimeStr: '11:45 UTC',
              flightMinutes: 690, // 11h 30m
              layoverMinutes: 0
            }
          ]
        }
      ]
    },
    'JL1': {
      callsign: 'JL1',
      airline: 'Japan Airlines',
      aircraft: 'Boeing 777-300ER',
      instances: [
        {
          id: 'jl1_transpacific',
          title: 'JL1 (HND ➔ SFO)',
          subtitle: 'Tokyo Haneda ➔ San Francisco',
          departureHourOffset: -10,
          legs: [
            {
              id: 'jl1_leg1',
              callsign: 'JL1',
              airline: 'Japan Airlines',
              fromIata: 'HND',
              toIata: 'SFO',
              depTimeStr: '09:05 UTC',
              flightMinutes: 560, // 9h 20m
              layoverMinutes: 0
            }
          ]
        }
      ]
    },
    'CX888': {
      callsign: 'CX888',
      airline: 'Cathay Pacific',
      aircraft: 'Boeing 777-300ER',
      instances: [
        {
          id: 'cx888_route',
          title: 'CX888 (HKG ➔ YVR ➔ JFK)',
          subtitle: 'Hong Kong ➔ Vancouver ➔ New York JFK',
          departureHourOffset: -32,
          legs: [
            {
              id: 'cx888_leg1',
              callsign: 'CX888',
              airline: 'Cathay Pacific',
              fromIata: 'HKG',
              toIata: 'YVR',
              depTimeStr: '16:00 UTC',
              flightMinutes: 700, // 11h 40m
              layoverMinutes: 120 // 2h layover
            },
            {
              id: 'cx888_leg2',
              callsign: 'CX888',
              airline: 'Cathay Pacific',
              fromIata: 'YVR',
              toIata: 'JFK',
              depTimeStr: '05:40 UTC',
              flightMinutes: 325, // 5h 25m
              layoverMinutes: 0
            }
          ]
        }
      ]
    }
  };

  // Fast Airport lookup helpers
  var airportMap = {};
  for (var i = 0; i < AIRPORTS.length; i++) {
    airportMap[AIRPORTS[i].iata] = AIRPORTS[i];
  }

  function getAirport(iata) {
    if (!iata) return null;
    return airportMap[iata.toUpperCase()] || null;
  }

  function searchAirports(query) {
    if (!query) return [];
    var q = query.trim().toLowerCase();
    if (!q) return [];
    var results = [];
    for (var j = 0; j < AIRPORTS.length; j++) {
      var ap = AIRPORTS[j];
      if (
        ap.iata.toLowerCase().indexOf(q) === 0 ||
        ap.city.toLowerCase().indexOf(q) !== -1 ||
        ap.name.toLowerCase().indexOf(q) !== -1 ||
        ap.country.toLowerCase().indexOf(q) !== -1
      ) {
        results.push(ap);
        if (results.length >= 8) break;
      }
    }
    return results;
  }

  function lookupFlight(callsign) {
    if (!callsign) return null;
    var key = callsign.trim().toUpperCase().replace(/\s+/g, '');
    return CACHED_FLIGHTS[key] || null;
  }

  // Export to global window.CARTO_DATA
  window.CARTO_DATA = {
    airports: AIRPORTS,
    airportMap: airportMap,
    coastlines: COASTLINES,
    cachedFlights: CACHED_FLIGHTS,
    getAirport: getAirport,
    searchAirports: searchAirports,
    lookupFlight: lookupFlight
  };
})();
