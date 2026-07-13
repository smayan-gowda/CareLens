import { 
  Layers, 
  Wrench, 
  Paintbrush, 
  ShoppingBag, 
  Lightbulb, 
  Hammer, 
  Zap, 
  MapPin, 
  Phone, 
  Globe 
} from "lucide-react";
import React from "react";

// Standard categories with names and icons for UI chips
export const CATEGORIES = [
  { name: "All" },
  { name: "Contractors" },
  { name: "Interior Designers" },
  { name: "Furniture" },
  { name: "Paint" },
  { name: "Flooring" },
  { name: "Lighting" },
  { name: "Hardware" },
  { name: "Appliances" },
  { name: "Plumbing" },
  { name: "Electrical" },
  { name: "Cleaning" },
  { name: "Landscaping" },
  { name: "HVAC" },
  { name: "Roofing" },
  { name: "Windows" },
  { name: "Cabinets" },
  { name: "Countertops" }
];

export const CATEGORY_COLORS: Record<string, string> = {
  "Contractors": "bg-blue-600/10 text-blue-600 border-blue-600/20",
  "Interior Designers": "bg-purple-600/10 text-purple-600 border-purple-600/20",
  "Furniture": "bg-amber-600/10 text-amber-600 border-amber-600/20",
  "Paint": "bg-pink-600/10 text-pink-600 border-pink-600/20",
  "Flooring": "bg-orange-600/10 text-orange-600 border-orange-600/20",
  "Lighting": "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  "Hardware": "bg-stone-600/10 text-stone-600 border-stone-600/20",
  "Appliances": "bg-cyan-600/10 text-cyan-600 border-cyan-600/20",
  "Plumbing": "bg-emerald-600/10 text-emerald-600 border-emerald-600/20",
  "Electrical": "bg-rose-600/10 text-rose-600 border-rose-600/20",
  "Cleaning": "bg-teal-600/10 text-teal-600 border-teal-600/20",
  "Landscaping": "bg-green-600/10 text-green-600 border-green-600/20",
  "HVAC": "bg-indigo-600/10 text-indigo-600 border-indigo-600/20",
  "Roofing": "bg-sky-600/10 text-sky-600 border-sky-600/20",
  "Windows": "bg-blue-500/10 text-blue-500 border-blue-500/20",
  "Cabinets": "bg-yellow-800/10 text-yellow-800 border-yellow-800/20",
  "Countertops": "bg-gray-600/10 text-gray-600 border-gray-600/20"
};

export const CATEGORY_COLORS_HEX: Record<string, string> = {
  "Contractors": "#2563eb", 
  "Interior Designers": "#9333ea", 
  "Furniture": "#d97706", 
  "Paint": "#db2777", 
  "Flooring": "#ea580c", 
  "Lighting": "#eab308", 
  "Hardware": "#57534e", 
  "Appliances": "#0891b2", 
  "Plumbing": "#059669", 
  "Electrical": "#e11d48", 
  "Cleaning": "#0d9488", 
  "Landscaping": "#16a34a", 
  "HVAC": "#4f46e5", 
  "Roofing": "#0284c7", 
  "Windows": "#3b82f6", 
  "Cabinets": "#a16207", 
  "Countertops": "#4b5563"
};

// Simulated locations lookup dict for geocoding fallback
export const SIMULATED_GEOLOCATIONS: Record<string, { name: string; lat: number; lng: number }> = {
  "austin": { name: "Austin, TX", lat: 30.2672, lng: -97.7431 },
  "austin, tx": { name: "Austin, TX", lat: 30.2672, lng: -97.7431 },
  "austin tx": { name: "Austin, TX", lat: 30.2672, lng: -97.7431 },
  "78701": { name: "Austin, TX", lat: 30.2672, lng: -97.7431 },
  
  "frisco": { name: "Frisco, TX", lat: 33.1507, lng: -96.8236 },
  "frisco, tx": { name: "Frisco, TX", lat: 33.1507, lng: -96.8236 },
  "frisco tx": { name: "Frisco, TX", lat: 33.1507, lng: -96.8236 },
  "75034": { name: "Frisco, TX", lat: 33.1507, lng: -96.8236 },
  "75035": { name: "Frisco, TX", lat: 33.1507, lng: -96.8236 },
  "75033": { name: "Frisco, TX", lat: 33.1507, lng: -96.8236 },

  "plano": { name: "Plano, TX", lat: 33.0198, lng: -96.6989 },
  "plano, tx": { name: "Plano, TX", lat: 33.0198, lng: -96.6989 },
  "plano tx": { name: "Plano, TX", lat: 33.0198, lng: -96.6989 },
  "75023": { name: "Plano, TX", lat: 33.0198, lng: -96.6989 },

  "dallas": { name: "Dallas, TX", lat: 32.7767, lng: -96.7970 },
  "dallas, tx": { name: "Dallas, TX", lat: 32.7767, lng: -96.7970 },
  "dallas tx": { name: "Dallas, TX", lat: 32.7767, lng: -96.7970 },
  "75201": { name: "Dallas, TX", lat: 32.7767, lng: -96.7970 },

  "fort worth": { name: "Fort Worth, TX", lat: 32.7555, lng: -97.3308 },
  "fort worth, tx": { name: "Fort Worth, TX", lat: 32.7555, lng: -97.3308 },
  "fort worth tx": { name: "Fort Worth, TX", lat: 32.7555, lng: -97.3308 },
  "76101": { name: "Fort Worth, TX", lat: 32.7555, lng: -97.3308 },

  "houston": { name: "Houston, TX", lat: 29.7604, lng: -95.3698 },
  "houston, tx": { name: "Houston, TX", lat: 29.7604, lng: -95.3698 },
  "houston tx": { name: "Houston, TX", lat: 29.7604, lng: -95.3698 },

  "new york": { name: "New York, NY", lat: 40.7128, lng: -74.0060 },
  "new york, ny": { name: "New York, NY", lat: 40.7128, lng: -74.0060 },
  "new york ny": { name: "New York, NY", lat: 40.7128, lng: -74.0060 },
  "10001": { name: "New York, NY", lat: 40.7128, lng: -74.0060 },

  "san francisco": { name: "San Francisco, CA", lat: 37.7749, lng: -122.4194 },
  "san francisco, ca": { name: "San Francisco, CA", lat: 37.7749, lng: -122.4194 },
  "san francisco ca": { name: "San Francisco, CA", lat: 37.7749, lng: -122.4194 },
  "94101": { name: "San Francisco, CA", lat: 37.7749, lng: -122.4194 },

  "los angeles": { name: "Los Angeles, CA", lat: 34.0522, lng: -118.2437 },
  "los angeles, ca": { name: "Los Angeles, CA", lat: 34.0522, lng: -118.2437 },
  "los angeles ca": { name: "Los Angeles, CA", lat: 34.0522, lng: -118.2437 },
  "90001": { name: "Los Angeles, CA", lat: 34.0522, lng: -118.2437 },

  "chicago": { name: "Chicago, IL", lat: 41.8781, lng: -87.6298 },
  "chicago, il": { name: "Chicago, IL", lat: 41.8781, lng: -87.6298 },
  "chicago il": { name: "Chicago, IL", lat: 41.8781, lng: -87.6298 },
  "60601": { name: "Chicago, IL", lat: 41.8781, lng: -87.6298 },

  "seattle": { name: "Seattle, WA", lat: 47.6062, lng: -122.3321 },
  "seattle, wa": { name: "Seattle, WA", lat: 47.6062, lng: -122.3321 },
  "seattle wa": { name: "Seattle, WA", lat: 47.6062, lng: -122.3321 },
  "98101": { name: "Seattle, WA", lat: 47.6062, lng: -122.3321 },

  "miami": { name: "Miami, FL", lat: 25.7617, lng: -80.1918 },
  "miami, fl": { name: "Miami, FL", lat: 25.7617, lng: -80.1918 },
  "miami fl": { name: "Miami, FL", lat: 25.7617, lng: -80.1918 },
  "33101": { name: "Miami, FL", lat: 25.7617, lng: -80.1918 }
};

// Master mock businesses list with relative location offsets for Sandbox Mode
export const MOCK_BUSINESS_TEMPLATES = [
  {
    id: "luxe_rem_1",
    name: "Luxe Kitchen & Bath Remodeling",
    categories: ["Contractors", "Cabinets", "Countertops", "Flooring"],
    rating: 4.8,
    reviewsCount: 184,
    priceLevel: 3,
    phone: "(512) 555-0192",
    website: "https://example.com/luxe-kitchen-bath",
    relativeLatOffset: 0.012,
    relativeLngOffset: -0.018,
    specialties: ["Luxury Bathroom Design", "Modern Kitchen Cabinets", "Quartz Countertops", "ADA Roll-in Showers"],
    ecoFriendly: true,
    luxury: true,
    fastestAvailability: false,
    openHours: "8:00 AM - 6:00 PM"
  },
  {
    id: "ecoshield_2",
    name: "EcoShield General Contractors",
    categories: ["Contractors", "Roofing", "Windows"],
    rating: 4.6,
    reviewsCount: 92,
    priceLevel: 2,
    phone: "(512) 555-0143",
    website: "https://example.com/ecoshield-gc",
    relativeLatOffset: -0.015,
    relativeLngOffset: 0.011,
    specialties: ["Energy Efficient Windows", "Recycled Rubber Roofing", "Structural Retrofitting", "Safe Threshold Ramps"],
    ecoFriendly: true,
    luxury: false,
    fastestAvailability: true,
    openHours: "7:00 AM - 5:00 PM"
  },
  {
    id: "summit_roof_3",
    name: "Summit Roofing & Exterior Specialists",
    categories: ["Contractors", "Roofing", "Cleaning"],
    rating: 4.9,
    reviewsCount: 247,
    priceLevel: 3,
    phone: "(512) 555-0201",
    website: "https://example.com/summit-roofing",
    relativeLatOffset: 0.024,
    relativeLngOffset: 0.008,
    specialties: ["Impact Resistant Shingles", "Pressure Washing Walkways", "Exterior Gutter Guards", "Soffit Repairs"],
    ecoFriendly: false,
    luxury: true,
    fastestAvailability: false,
    openHours: "8:00 AM - 5:00 PM"
  },
  {
    id: "cascade_plumb_4",
    name: "Cascade Plumbing & Bathroom Safety",
    categories: ["Contractors", "Plumbing", "Hardware"],
    rating: 4.7,
    reviewsCount: 156,
    priceLevel: 2,
    phone: "(512) 555-0188",
    website: "https://example.com/cascade-plumbing",
    relativeLatOffset: -0.008,
    relativeLngOffset: -0.022,
    specialties: ["Anti-Scald Valve Installation", "ADA Comfort Height Toilets", "Shower Grab Bar Mounts", "Leak Detection Sensors"],
    ecoFriendly: true,
    luxury: false,
    fastestAvailability: true,
    openHours: "Open 24 Hours"
  },
  {
    id: "voltguard_elec_5",
    name: "VoltGuard Electrical & Smart Home",
    categories: ["Contractors", "Electrical", "Lighting"],
    rating: 4.8,
    reviewsCount: 212,
    priceLevel: 2,
    phone: "(512) 555-0115",
    website: "https://example.com/voltguard-electric",
    relativeLatOffset: 0.005,
    relativeLngOffset: 0.019,
    specialties: ["GFCI Safety Outlets", "Smart Motion Pathways", "Low-Voltage Step Lights", "Emergency Backup Generators"],
    ecoFriendly: true,
    luxury: false,
    fastestAvailability: true,
    openHours: "8:00 AM - 7:00 PM"
  },
  {
    id: "apex_hvac_6",
    name: "Apex HVAC & Air Quality",
    categories: ["Contractors", "HVAC"],
    rating: 4.5,
    reviewsCount: 118,
    priceLevel: 3,
    phone: "(512) 555-0284",
    website: "https://example.com/apex-hvac",
    relativeLatOffset: -0.021,
    relativeLngOffset: -0.012,
    specialties: ["HEPA Filtration Systems", "Smart Thermostat Installation", "Zoned Ventilation", "Duct Sealing & Safety"],
    ecoFriendly: true,
    luxury: false,
    fastestAvailability: false,
    openHours: "7:30 AM - 6:30 PM"
  },
  {
    id: "greenscapes_7",
    name: "GreenScapes Outdoor Safety & Design",
    categories: ["Contractors", "Landscaping", "Cleaning"],
    rating: 4.7,
    reviewsCount: 78,
    priceLevel: 2,
    phone: "(512) 555-0231",
    website: "https://example.com/greenscapes-design",
    relativeLatOffset: 0.019,
    relativeLngOffset: -0.025,
    specialties: ["Leveling Unsafe Walkways", "Slip-Resistant Patios", "Outdoor Path Illumination", "Sturdy Handrail Installation"],
    ecoFriendly: true,
    luxury: false,
    fastestAvailability: false,
    openHours: "8:00 AM - 5:30 PM"
  },
  {
    id: "aura_design_8",
    name: "Aura Interior & Universal Design",
    categories: ["Interior Designers", "Furniture"],
    rating: 4.9,
    reviewsCount: 135,
    priceLevel: 4,
    phone: "(512) 555-0155",
    website: "https://example.com/aura-design",
    relativeLatOffset: -0.002,
    relativeLngOffset: 0.005,
    specialties: ["Universal Access Consultations", "Senior-Safe Space Planning", "Contrast Color Optimization", "Non-Glare Surfaces"],
    ecoFriendly: true,
    luxury: true,
    fastestAvailability: false,
    openHours: "9:00 AM - 6:00 PM"
  },
  {
    id: "urban_furniture_9",
    name: "Urban Dwelling Ergonomic Furniture",
    categories: ["Furniture", "Lighting"],
    rating: 4.6,
    reviewsCount: 104,
    priceLevel: 3,
    phone: "(512) 555-0199",
    website: "https://example.com/urban-dwelling",
    relativeLatOffset: 0.011,
    relativeLngOffset: 0.022,
    specialties: ["Solid Weighted Armchairs", "Heavy Base Tables", "Ergonomic Bed Frames", "Dimmable Bedside Lamps"],
    ecoFriendly: false,
    luxury: true,
    fastestAvailability: false,
    openHours: "10:00 AM - 7:00 PM"
  },
  {
    id: "sherwin_paint_10",
    name: "Sherwin-Williams Commercial Paints",
    categories: ["Paint", "Hardware"],
    rating: 4.8,
    reviewsCount: 340,
    priceLevel: 2,
    phone: "(512) 555-0210",
    website: "https://example.com/sherwin-williams-store",
    relativeLatOffset: -0.014,
    relativeLngOffset: 0.018,
    specialties: ["Zero-VOC Indoor Paint", "High-Contrast Trim Paint", "Anti-Slip Textured Additives", "Color Guidance Consultation"],
    ecoFriendly: true,
    luxury: false,
    fastestAvailability: true,
    openHours: "7:00 AM - 6:00 PM"
  },
  {
    id: "homedepot_11",
    name: "The Home Depot - Safety & Hardware Center",
    categories: ["Hardware", "Paint", "Lighting", "Flooring", "Cabinets", "Plumbing", "Electrical", "Appliances"],
    rating: 4.4,
    reviewsCount: 480,
    priceLevel: 2,
    phone: "(512) 555-0300",
    website: "https://example.com/homedepot-local",
    relativeLatOffset: 0.008,
    relativeLngOffset: -0.009,
    specialties: ["Safety Grab Bars", "Non-Slip Rug Underlayments", "Smart LED Pathway Lighting", "GFCI Safety Breakers"],
    ecoFriendly: false,
    luxury: false,
    fastestAvailability: true,
    openHours: "6:00 AM - 10:00 PM"
  },
  {
    id: "lowes_12",
    name: "Lowe's Home Improvement & Accessibility",
    categories: ["Hardware", "Paint", "Lighting", "Flooring", "Cabinets", "Plumbing", "Electrical", "Appliances"],
    rating: 4.4,
    reviewsCount: 425,
    priceLevel: 2,
    phone: "(512) 555-0400",
    website: "https://example.com/lowes-local",
    relativeLatOffset: -0.011,
    relativeLngOffset: -0.015,
    specialties: ["Comfort Height Toilets", "Textured Floor Tiles", "LED Nightlights", "Accessible Cabinet Handles"],
    ecoFriendly: false,
    luxury: false,
    fastestAvailability: true,
    openHours: "6:00 AM - 10:00 PM"
  },
  {
    id: "ikea_13",
    name: "IKEA Smart & Adaptive Living",
    categories: ["Furniture", "Cabinets", "Lighting", "Interior Designers"],
    rating: 4.5,
    reviewsCount: 310,
    priceLevel: 2,
    phone: "(512) 555-0500",
    website: "https://example.com/ikea-local",
    relativeLatOffset: 0.028,
    relativeLngOffset: -0.015,
    specialties: ["Affordable Modular Cabinets", "Smart Wireless Dimmers", "Rounded Edge Living Room Sets", "Slipcovered Heavy Sofas"],
    ecoFriendly: true,
    luxury: false,
    fastestAvailability: false,
    openHours: "10:00 AM - 9:00 PM"
  },
  {
    id: "floor_decor_14",
    name: "Floor & Decor - Slip Resistant Hardwoods",
    categories: ["Flooring", "Hardware"],
    rating: 4.6,
    reviewsCount: 195,
    priceLevel: 2,
    phone: "(512) 555-0600",
    website: "https://example.com/floor-decor-local",
    relativeLatOffset: -0.025,
    relativeLngOffset: 0.028,
    specialties: ["ADA Certified Slip-Resistant Tile", "Textured Luxury Vinyl Planks", "Solid Non-Slip Bamboo Flooring", "Waterproof Sealants"],
    ecoFriendly: true,
    luxury: false,
    fastestAvailability: true,
    openHours: "7:00 AM - 8:00 PM"
  },
  {
    id: "glass_shower_15",
    name: "Elite Glass & Custom Showers",
    categories: ["Contractors", "Bathroom", "Windows"],
    rating: 4.8,
    reviewsCount: 112,
    priceLevel: 3,
    phone: "(512) 555-0720",
    website: "https://example.com/elite-glass",
    relativeLatOffset: 0.014,
    relativeLngOffset: 0.014,
    specialties: ["Frameless Sliding Glass Showers", "Tempered Safety Glass", "Low Threshold Showers", "Safety Grab Rails"],
    ecoFriendly: false,
    luxury: true,
    fastestAvailability: false,
    openHours: "8:00 AM - 6:00 PM"
  }
];

// Helper deterministic offset for coordinates when typing random cities
export const hashSearchCoordinates = (queryStr: string) => {
  const norm = queryStr.toLowerCase().trim();
  if (SIMULATED_GEOLOCATIONS[norm]) return SIMULATED_GEOLOCATIONS[norm];
  
  let hash = 0;
  for (let i = 0; i < norm.length; i++) {
    hash = norm.charCodeAt(i) + ((hash << 5) - hash);
  }
  const latOffset = (Math.abs(hash % 1000) / 1000) * 10 - 5;
  const lngOffset = (Math.abs((hash >> 3) % 1000) / 1000) * 20 - 10;
  
  return {
    name: queryStr.charAt(0).toUpperCase() + queryStr.slice(1) + ", US",
    lat: 37.0902 + latOffset,
    lng: -95.7129 + lngOffset
  };
};

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 3958.8; // Radius of the Earth in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export const getAreaCodeForCity = (cityName: string): string => {
  const norm = cityName.toLowerCase();
  if (norm.includes("frisco") || norm.includes("dallas") || norm.includes("plano") || norm.includes("fort worth")) return "469";
  if (norm.includes("austin")) return "512";
  if (norm.includes("new york") || norm.includes("ny")) return "212";
  if (norm.includes("san francisco") || norm.includes("sf")) return "415";
  if (norm.includes("los angeles") || norm.includes("la")) return "310";
  if (norm.includes("chicago")) return "312";
  if (norm.includes("seattle")) return "206";
  if (norm.includes("miami")) return "305";
  if (norm.includes("houston")) return "713";
  if (norm.includes("boston")) return "617";
  if (norm.includes("denver")) return "303";
  if (norm.includes("atlanta")) return "404";
  if (norm.includes("phoenix")) return "602";
  return "214"; // Default Texas/general fallback
};

// Generate realistic custom fallback lists when the Overpass API is rate limited
export const generateLocalizedFallbackBusinesses = (lat: number, lng: number, cityName: string) => {
  const areaCode = getAreaCodeForCity(cityName);
  return MOCK_BUSINESS_TEMPLATES.map((biz) => {
    const computedLat = lat + biz.relativeLatOffset;
    const computedLng = lng + biz.relativeLngOffset;
    const distance = calculateDistance(lat, lng, computedLat, computedLng);
    
    const streetNum = Math.floor(Math.abs(biz.relativeLatOffset * 10000)) + 120;
    const computedAddress = `${streetNum} Safety Way, ${cityName}`;

    // Dynamically localize phone number area code
    const localizedPhone = biz.phone.replace(/^\(512\)/, `(${areaCode})`);

    // Dynamically localize business name to include the searched city for realistic local presence
    let localizedName = biz.name;
    if (!biz.name.includes("Home Depot") && !biz.name.includes("Lowe's") && !biz.name.includes("IKEA") && !biz.name.includes("Williams")) {
      // Append or prepend city name elegantly
      if (biz.id.includes("luxe") || biz.id.includes("cascade") || biz.id.includes("voltguard") || biz.id.includes("apex")) {
        localizedName = `${cityName} ${biz.name}`;
      } else {
        localizedName = `${biz.name} of ${cityName}`;
      }
    }
    
    return {
      ...biz,
      name: localizedName,
      phone: localizedPhone,
      lat: computedLat,
      lng: computedLng,
      distance,
      address: computedAddress,
      aiScore: 80 + Math.floor((biz.rating - 4.4) * 20) + (biz.reviewsCount % 5),
      aiExplanation: `Recommended based on outstanding local ratings and licensing in ${cityName}.`
    };
  });
};
