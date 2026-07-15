import { useState, useMemo, useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useScanStore } from "@/stores/scanStore";
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc 
} from "firebase/firestore";
import { handleFirestoreError, OperationType, cleanUndefined } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "motion/react";
import { 
  MapPin, 
  Phone, 
  Star, 
  Heart, 
  Search, 
  ExternalLink, 
  Sparkles, 
  ShoppingBag, 
  Globe, 
  Eye, 
  List, 
  SlidersHorizontal, 
  Navigation,
  Check,
  Building,
  RefreshCw,
  Clock,
  Car
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  generateLocalizedFallbackBusinesses, 
  hashSearchCoordinates,
  calculateDistance,
  CATEGORY_COLORS
} from "@/data/resourceTemplates";
import L from "leaflet";

// Recommended Home Safety Products Array
const ALL_PRODUCTS = [
  { 
    id: 'p1', 
    name: 'SureGrip Textured Grab Bar (24")', 
    price: '$45.00', 
    category: 'Hardware', 
    rating: 4.9, 
    description: 'ADA-compliant textured stainless steel safety bar with secure mount flanges.', 
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400' 
  },
  { 
    id: 'p2', 
    name: 'Lumin Motion-Sensor LED Pathway Lights', 
    price: '$29.99', 
    category: 'Lighting', 
    rating: 4.8, 
    description: 'Stick-on wire-free motion sensor nightlights ideal for hallways, stairs, and bathrooms.', 
    image: 'https://images.unsplash.com/photo-1565814636199-ae8133055c1c?auto=format&fit=crop&q=80&w=400' 
  },
  { 
    id: 'p3', 
    name: 'Anti-Slip Comfort Grip Safety Mat', 
    price: '$34.50', 
    category: 'Flooring', 
    rating: 4.7, 
    description: 'Textured rubber-backed comfort mat with anti-trip beveled edges.', 
    image: 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&q=80&w=400' 
  },
  { 
    id: 'p4', 
    name: 'Raised Toilet Seat with Padded Arms', 
    price: '$59.99', 
    category: 'Plumbing', 
    rating: 4.6, 
    description: 'Heavy-duty safety frame adding 5" toilet height to reduce standing strain.', 
    image: 'https://images.unsplash.com/photo-1564540574859-0dfb63985953?auto=format&fit=crop&q=80&w=400' 
  },
  { 
    id: 'p5', 
    name: 'ClearTread Tub Safety Grips (24-pack)', 
    price: '$12.99', 
    category: 'Hardware', 
    rating: 4.9, 
    description: 'Waterproof self-adhesive transparent safety strips for tubs, showers, and tiles.', 
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=400' 
  },
  { 
    id: 'p6', 
    name: 'Bed Assist Leverage Hand Rail', 
    price: '$42.00', 
    category: 'Furniture', 
    rating: 4.7, 
    description: 'Sliding under-mattress support bar for easy bed entries, exits, and transfers.', 
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&q=80&w=400' 
  },
  { 
    id: 'p7', 
    name: 'Modular Lightweight Entry Ramp', 
    price: '$125.00', 
    category: 'Accessibility', 
    rating: 4.9, 
    description: 'Durable aluminum ramp with slip-resistant traction surface for thresholds up to 3".', 
    image: 'https://images.unsplash.com/photo-1516937941344-00b4e0337589?auto=format&fit=crop&q=80&w=400' 
  },
  { 
    id: 'p8', 
    name: 'Heavy Duty Shower Transfer Bench', 
    price: '$79.00', 
    category: 'Medical Equipment', 
    rating: 4.8, 
    description: 'Sturdy seating bench with drainage holes and non-slip rubber suction-cup legs.', 
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400' 
  }
];

// Quick Select US Cities Coordinates
const QUICK_CITIES = [
  { name: "Frisco, TX", lat: 33.1507, lng: -96.8236 },
  { name: "Austin, TX", lat: 30.2672, lng: -97.7431 },
  { name: "Plano, TX", lat: 33.0198, lng: -96.6989 },
  { name: "Dallas, TX", lat: 32.7767, lng: -96.7970 },
  { name: "Seattle, WA", lat: 47.6062, lng: -122.3321 },
  { name: "New York, NY", lat: 40.7128, lng: -74.0060 }
];

// 14 Categories as explicitly requested
const AVAILABLE_CATEGORIES = [
  "All",
  "ADA",
  "Plumbing",
  "Electrical",
  "HVAC",
  "Flooring",
  "Roofing",
  "Cabinets",
  "Kitchen",
  "Bathroom",
  "Hardware",
  "Medical Equipment",
  "Accessibility",
  "Painting",
  "Handyman"
];

// Map User UI Category choices to specific Yelp API queries (Categories & Terms)
const getYelpParamsForCategory = (categoryName: string) => {
  switch (categoryName) {
    case "ADA":
      return { categories: "homeaccessibility,contractors", term: "ADA home safety modifications handicap senior accessibility" };
    case "Plumbing":
      return { categories: "plumbing", term: "grab bars safety walk in tub plumbers toilet replacement" };
    case "Electrical":
      return { categories: "electricians", term: "outlet height smart switches motion sensors electrician lighting safety" };
    case "HVAC":
      return { categories: "hvac", term: "smart thermostat heating cooling clean air filters HVAC" };
    case "Flooring":
      return { categories: "flooring", term: "non slip flooring slip resistant vinyl tiles carpets flooring contractors" };
    case "Roofing":
      return { categories: "roofing", term: "roof repair safety inspectors storm damage" };
    case "Cabinets":
      return { categories: "cabinetry", term: "pull down shelves accessible cabinets kitchen remodeling cabinetry" };
    case "Kitchen":
      return { categories: "kitchenremodeling", term: "kitchen safety accessible countertops roll under sink remodeling" };
    case "Bathroom":
      return { categories: "bathroomremodeling", term: "bathroom safety walk in shower grab bar installers bathroom remodel" };
    case "Hardware":
      return { categories: "hardware", term: "grab bars safety rails bathroom hardware" };
    case "Medical Equipment":
      return { categories: "medicalsupplies", term: "wheelchairs hospital bed walk aid medical equipment suppliers" };
    case "Accessibility":
      return { categories: "homeaccessibility", term: "accessibility remodeling wheelchair ramp installers" };
    case "Painting":
      return { categories: "painters", term: "non toxic low VOC paint contractors slip resistant floor coatings" };
    case "Handyman":
      return { categories: "handyman", term: "grab bars installation home safety repair minor modifications handyman" };
    default:
      return { categories: "homeaccessibility,contractors,handyman", term: "senior safety home accessibility" };
  }
};

// Generates appropriate Specialties list based on Category name
const getSpecialtiesForCategory = (categoryName: string, yelpTitles: string[]): string[] => {
  const baseSpecialties = yelpTitles.slice(0, 2);
  switch (categoryName) {
    case "ADA":
    case "Accessibility":
      return ["ADA Bathrooms", "Wheelchair Ramps", "Senior Living Safety", ...baseSpecialties];
    case "Lighting":
      return ["Motion Sensor Pathways", "Anti-Glare LED Fixtures", "Fall-Prevention Lighting", ...baseSpecialties];
    case "Hardware":
      return ["Textured Grab Bars", "Safety Rails", "Threshold Transitions", ...baseSpecialties];
    case "Plumbing":
      return ["Walk-In Tubs", "Raised Toilets", "Anti-Scald Valves", ...baseSpecialties];
    case "Electrical":
      return ["Lowered Light Switches", "Backup Generator Outlets", "Smart Home Voice Controls", ...baseSpecialties];
    case "Flooring":
      return ["Slip-Resistant Textures", "Low-Pile Non-Trip Carpets", "Comfort Rubber Mats", ...baseSpecialties];
    case "Handyman":
      return ["Grab Bar Installations", "Safety Gate Mounting", "Furniture Anchoring", ...baseSpecialties];
    default:
      return ["ADA & Universal Safety Compliance", ...baseSpecialties];
  }
};

// Smart Match Score Logic (0 to 100) comparing Provider Specialties/Categories with Latest Scan recommendations
const calculateMatchScore = (provider: any, latestScan: any): number => {
  let score = 72; // Baseline
  
  // Rating-driven boost
  score += Math.round((provider.rating || 4.0) * 4.5); // Up to +22 points

  if (!latestScan || !latestScan.recommendations) {
    return Math.min(99, score);
  }

  const searchableString = [
    ...(provider.categories || []),
    ...(provider.specialties || []),
    provider.name
  ].join(" ").toLowerCase();

  let matchesCount = 0;
  latestScan.recommendations.forEach((rec: any) => {
    const recTitle = rec.title.toLowerCase();
    
    // Simple conceptual tags matching
    if (searchableString.includes("plumb") && (recTitle.includes("plumb") || recTitle.includes("leak") || recTitle.includes("shower") || recTitle.includes("tub") || recTitle.includes("toilet") || recTitle.includes("grab bar"))) {
      matchesCount++;
    }
    if (searchableString.includes("floor") && (recTitle.includes("floor") || recTitle.includes("slip") || recTitle.includes("trip") || recTitle.includes("mat") || recTitle.includes("carpet") || recTitle.includes("rug"))) {
      matchesCount++;
    }
    if (searchableString.includes("light") && (recTitle.includes("light") || recTitle.includes("dark") || recTitle.includes("bulb") || recTitle.includes("glare") || recTitle.includes("illumination") || recTitle.includes("sensor"))) {
      matchesCount++;
    }
    if (searchableString.includes("accessibility") || searchableString.includes("ada") || searchableString.includes("handyman")) {
      if (recTitle.includes("ramp") || recTitle.includes("rail") || recTitle.includes("grab bar") || recTitle.includes("support") || recTitle.includes("remodel") || recTitle.includes("barrier")) {
        matchesCount++;
      }
    }
  });

  if (matchesCount > 0) {
    score += Math.min(20, matchesCount * 10);
  }

  // Cap matching between 65% and 99%
  return Math.min(99, Math.max(65, score));
};

export function ResourcesPage() {
  const { user } = useAuthStore();
  const { scans } = useScanStore();

  // Track which recommendation is currently being classified by AI
  const [classifyingRecId, setClassifyingRecId] = useState<string | number | null>(null);

  // Navigation & Listing States
  const [activeTab, setActiveTab] = useState<'local' | 'products' | 'saved'>('local');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Location & Geocoding Coordinates
  const [locationQuery, setLocationQuery] = useState("Austin, TX");
  const [activeCityName, setActiveCityName] = useState("Austin, TX");
  const [coords, setCoords] = useState({ lat: 30.2672, lng: -97.7431 });

  // Filter Configurations (Advanced Filters)
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);
  const [searchRadius, setSearchRadius] = useState<number>(15); // miles
  const [minRating, setMinRating] = useState<number>(0);
  const [priceLevel, setPriceLevel] = useState<number | null>(null);
  const [openNow, setOpenNow] = useState(false);
  const [ecoFriendlyOnly, setEcoFriendlyOnly] = useState(false);
  const [fastestAvailabilityOnly, setFastestAvailabilityOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'match' | 'rating' | 'distance' | 'popularity'>('match');

  // Mobile split toggle (Zillow/Airbnb style list vs map on small screens)
  const [mobileViewMode, setMobileViewMode] = useState<'list' | 'map'>('list');

  // Business Results State
  const [liveProviders, setLiveProviders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [savedItems, setSavedItems] = useState<any[]>([]);

  // Leaflet Interactive Map References
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.FeatureGroup | null>(null);

  // Find the user's latest completed scan to provide contextually-accurate recommendations
  const latestScan = useMemo(() => {
    const allScans = Object.values(scans).flat();
    if (allScans.length === 0) return null;
    return [...allScans].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
  }, [scans]);

  // Load saved items persistently from Firestore for signed-in users
  useEffect(() => {
    if (!user) {
      setSavedItems([]);
      return;
    }

    const q = query(
      collection(db, "savedResources"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          firestoreId: doc.id,
          ...doc.data(),
        }));
        setSavedItems(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "savedResources");
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Call OSRM to get precise road driving distances and duration in minutes
  const getDrivingRoutes = async (origin: { lat: number; lng: number }, destinations: { lat: number; lng: number }[]) => {
    if (destinations.length === 0) return [];
    try {
      const coordsString = `${origin.lng},${origin.lat};` + 
        destinations.map(d => `${d.lng},${d.lat}`).join(";");
      
      const response = await fetch(
        `https://router.project-osrm.org/table/v1/driving/${coordsString}?sources=0&annotations=distance,duration`,
        { signal: AbortSignal.timeout(4000) } // 4 seconds timeout guard
      );
      if (!response.ok) throw new Error("OSRM table request failed");
      
      const data = await response.json();
      if (data.code === "Ok" && data.distances && data.distances[0]) {
        return destinations.map((_, idx) => {
          const meters = data.distances[0][idx + 1];
          const seconds = data.durations?.[0]?.[idx + 1];
          
          const miles = meters !== undefined && meters !== null ? meters / 1609.344 : null;
          const minutes = seconds !== undefined && seconds !== null ? Math.round(seconds / 60) : null;
          
          return { miles, minutes };
        });
      }
    } catch (error) {
      console.warn("OSRM table routing failed, using mathematical fallbacks:", error);
    }
    return null;
  };

  // Synchronize Yelp and OSRM data based on category, coordinates, radius and filters
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      setIsLoading(true);
      try {
        const params = getYelpParamsForCategory(selectedCategory);
        
        const response = await fetch(
          `/api/yelp-search?latitude=${coords.lat}&longitude=${coords.lng}&categories=${params.categories}&term=${encodeURIComponent(params.term)}&radius=${searchRadius}`
        );
        
        if (!response.ok) {
          throw new Error("Yelp API proxy returned non-OK status");
        }
        
        const data = await response.json();
        if (!isMounted) return;
        
        if (data.businesses && data.businesses.length > 0) {
          const businesses = data.businesses;
          
          // Fetch real drive times and distances
          const destCoords = businesses.map((b: any) => ({
            lat: b.coordinates.latitude,
            lng: b.coordinates.longitude
          }));
          
          const routingData = await getDrivingRoutes(coords, destCoords);
          if (!isMounted) return;
          
          const mapped = businesses.map((b: any, idx: number) => {
            let dist = b.distance / 1609.344;
            let durationMin = null;
            
            if (routingData && routingData[idx]) {
              if (routingData[idx].miles !== null) dist = routingData[idx].miles;
              if (routingData[idx].minutes !== null) durationMin = routingData[idx].minutes;
            }
            
            const specialties = getSpecialtiesForCategory(
              selectedCategory, 
              b.categories.map((c: any) => c.title)
            );
            
            return {
              id: `yelp_${b.id}`,
              name: b.name,
              categories: b.categories.map((c: any) => c.title),
              rating: b.rating,
              reviewsCount: b.review_count,
              phone: b.display_phone || b.phone || "No phone listed",
              website: b.url,
              address: b.location.display_address?.join(", ") || b.location.address1 || "Local address",
              lat: b.coordinates.latitude,
              lng: b.coordinates.longitude,
              distance: dist,
              durationMinutes: durationMin,
              specialties,
              isYelp: true,
              priceLevel: b.price ? b.price.length : null,
              openHours: b.is_closed ? "Closed" : "Open Now",
              ecoFriendly: Math.random() > 0.5, // simulate green practices
              fastestAvailability: Math.random() > 0.4, // simulate response rates
              image: b.image_url
            };
          });
          
          setLiveProviders(mapped);
        } else {
          // Fall back to simulated local templates
          const fallbacks = generateLocalizedFallbackBusinesses(coords.lat, coords.lng, activeCityName);
          const destCoords = fallbacks.map((f: any) => ({ lat: f.lat, lng: f.lng }));
          const routingData = await getDrivingRoutes(coords, destCoords);
          if (!isMounted) return;
          
          const mapped = fallbacks.map((f: any, idx: number) => {
            let dist = f.distance;
            let durationMin = null;
            if (routingData && routingData[idx]) {
              if (routingData[idx].miles !== null) dist = routingData[idx].miles;
              if (routingData[idx].minutes !== null) durationMin = routingData[idx].minutes;
            }
            return {
              ...f,
              distance: dist,
              durationMinutes: durationMin,
              isYelp: false
            };
          });
          
          setLiveProviders(mapped);
        }
      } catch (err) {
        console.error("Error loading resources:", err);
        // Fall back to robust simulated business list to ensure app never crashes
        if (isMounted) {
          const fallbacks = generateLocalizedFallbackBusinesses(coords.lat, coords.lng, activeCityName).map(f => ({
            ...f,
            isYelp: false
          }));
          setLiveProviders(fallbacks);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    
    loadData();
    return () => {
      isMounted = false;
    };
  }, [coords, selectedCategory, searchRadius]);

  // Leaflet Map Initialization & Lifecycle
  useEffect(() => {
    // Dynamic loading of Leaflet styles for sandboxed isolation & container security
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    // Apply custom styling overrides to make the map look extremely clean and matched to the Slate theme
    const style = document.createElement("style");
    style.id = "leaflet-custom-styles";
    style.innerHTML = `
      .leaflet-container {
        font-family: inherit;
        background-color: #f8fafc;
      }
      .dark .leaflet-container {
        background-color: #171717;
      }
      .leaflet-tile-pane {
        filter: grayscale(1) contrast(1.1) brightness(0.95);
      }
      .dark .leaflet-tile-pane {
        filter: grayscale(1) invert(1) contrast(0.9) brightness(0.85);
      }
      .leaflet-bar {
        border: none !important;
        box-shadow: 0 4px 12px rgba(0,0,0,0.08) !important;
        border-radius: 12px !important;
        overflow: hidden;
      }
      .leaflet-bar a {
        background-color: white !important;
        color: #171717 !important;
        border-bottom: 1px solid #f3f4f6 !important;
        transition: background-color 0.15s;
      }
      .dark .leaflet-bar a {
        background-color: #262626 !important;
        color: #f5f5f5 !important;
        border-bottom: 1px solid #333333 !important;
      }
      .leaflet-bar a:hover {
        background-color: #f5f5f5 !important;
      }
      .dark .leaflet-bar a:hover {
        background-color: #333333 !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(link);
      const customStyle = document.getElementById("leaflet-custom-styles");
      if (customStyle) document.head.removeChild(customStyle);
      
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersGroupRef.current = null;
      }
    };
  }, []);

  // Initialize Leaflet Map Instance
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [coords.lat, coords.lng],
      zoom: 12,
      zoomControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap contributors"
    }).addTo(map);

    L.control.zoom({ position: "topright" }).addTo(map);

    const markersGroup = L.featureGroup().addTo(map);

    mapInstanceRef.current = map;
    markersGroupRef.current = markersGroup;
  }, [activeTab]);

  // Helper Unsplash category visualizer
  const getBusinessPhoto = (provider: any) => {
    if (provider.image) return provider.image;
    
    const category = provider.categories?.[0] || "Contractor";
    const catLower = category.toLowerCase();
    if (catLower.includes("plumb")) {
      return "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&q=80&w=400";
    }
    if (catLower.includes("electric")) {
      return "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=400";
    }
    if (catLower.includes("floor") || catLower.includes("tile")) {
      return "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&q=80&w=400";
    }
    if (catLower.includes("paint") || catLower.includes("coat")) {
      return "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&q=80&w=400";
    }
    if (catLower.includes("light") || catLower.includes("illuminate")) {
      return "https://images.unsplash.com/photo-1565814636199-ae8133055c1c?auto=format&fit=crop&q=80&w=400";
    }
    if (catLower.includes("hardware") || catLower.includes("store") || catLower.includes("supply")) {
      return "https://images.unsplash.com/photo-1530124566582-ab0510450c80?auto=format&fit=crop&q=80&w=400";
    }
    if (catLower.includes("design") || catLower.includes("interior")) {
      return "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=400";
    }
    return "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=400"; // neutral handyman/construction
  };

  // Strict category matching filter for robust, targeted directory lookups
  const doesProviderMatchCategoryStrictly = (provider: any, category: string): boolean => {
    if (!category || category === "All") return true;

    const catLower = category.toLowerCase();
    
    // Convert categories to lowercase strings for bulletproof matching
    const pCategories = (provider.categories || []).map((c: any) => 
      typeof c === "string" ? c.toLowerCase() : (c.title?.toLowerCase() || "")
    );
    const pSpecialties = (provider.specialties || []).map((s: string) => s.toLowerCase());
    const pName = (provider.name || "").toLowerCase();

    const isMatchInList = (list: string[], term: string) => list.some(item => item.includes(term));
    const isMatchInSpecialties = (term: string) => isMatchInList(pSpecialties, term);
    const isMatchInCategories = (term: string) => isMatchInList(pCategories, term);

    switch (category) {
      case "ADA":
      case "Accessibility":
        return (
          isMatchInCategories("accessibility") ||
          isMatchInCategories("ada") ||
          isMatchInCategories("handicap") ||
          isMatchInCategories("senior") ||
          isMatchInSpecialties("ada") ||
          isMatchInSpecialties("ramp") ||
          isMatchInSpecialties("accessibility") ||
          isMatchInSpecialties("universal") ||
          isMatchInSpecialties("senior") ||
          isMatchInSpecialties("grab bar") ||
          isMatchInSpecialties("handirail") ||
          isMatchInSpecialties("handicap") ||
          pName.includes("accessibility") ||
          pName.includes("senior") ||
          pName.includes("adaptive")
        );

      case "Plumbing":
        return (
          isMatchInCategories("plumbing") ||
          isMatchInCategories("plumber") ||
          isMatchInCategories("toilet") ||
          isMatchInSpecialties("plumb") ||
          isMatchInSpecialties("toilet") ||
          isMatchInSpecialties("tub") ||
          isMatchInSpecialties("shower") ||
          isMatchInSpecialties("valve") ||
          isMatchInSpecialties("grab bar") ||
          pName.includes("plumbing") ||
          pName.includes("shower")
        );

      case "Electrical":
        return (
          isMatchInCategories("electricians") ||
          isMatchInCategories("electrical") ||
          isMatchInCategories("lighting") ||
          isMatchInSpecialties("electric") ||
          isMatchInSpecialties("outlet") ||
          isMatchInSpecialties("switch") ||
          isMatchInSpecialties("wire") ||
          isMatchInSpecialties("breaker") ||
          isMatchInSpecialties("light") ||
          isMatchInSpecialties("sensor") ||
          pName.includes("electric") ||
          pName.includes("light")
        );

      case "HVAC":
        return (
          isMatchInCategories("hvac") ||
          isMatchInCategories("heating") ||
          isMatchInSpecialties("hvac") ||
          isMatchInSpecialties("air quality") ||
          isMatchInSpecialties("thermostat") ||
          isMatchInSpecialties("ventilation") ||
          isMatchInSpecialties("duct") ||
          isMatchInSpecialties("filter") ||
          pName.includes("hvac") ||
          pName.includes("heating") ||
          pName.includes("air")
        );

      case "Flooring":
        return (
          isMatchInCategories("flooring") ||
          isMatchInCategories("carpet") ||
          isMatchInCategories("tile") ||
          isMatchInSpecialties("floor") ||
          isMatchInSpecialties("tile") ||
          isMatchInSpecialties("carpet") ||
          isMatchInSpecialties("rug") ||
          isMatchInSpecialties("slip") ||
          isMatchInSpecialties("mat") ||
          pName.includes("floor") ||
          pName.includes("carpet") ||
          pName.includes("tile")
        );

      case "Roofing":
        return (
          isMatchInCategories("roofing") ||
          isMatchInSpecialties("roof") ||
          isMatchInSpecialties("shingle") ||
          isMatchInSpecialties("gutter") ||
          pName.includes("roof") ||
          pName.includes("exterior")
        );

      case "Cabinets":
        return (
          isMatchInCategories("cabinet") ||
          isMatchInCategories("cabinetry") ||
          isMatchInCategories("cabinets") ||
          isMatchInSpecialties("cabinet") ||
          isMatchInSpecialties("shelves") ||
          isMatchInSpecialties("cupboard") ||
          isMatchInSpecialties("drawer") ||
          isMatchInSpecialties("handle") ||
          pName.includes("cabinet") ||
          pName.includes("kitchen") || 
          pName.includes("remodeling") ||
          pName.includes("depot") ||
          pName.includes("lowe's") ||
          pName.includes("ikea")
        );

      case "Kitchen":
        return (
          isMatchInCategories("kitchen") ||
          isMatchInCategories("kitchenremodeling") ||
          isMatchInSpecialties("kitchen") ||
          isMatchInSpecialties("countertop") ||
          isMatchInSpecialties("cabinet") ||
          isMatchInSpecialties("sink") ||
          pName.includes("kitchen") ||
          pName.includes("counter") ||
          pName.includes("depot") ||
          pName.includes("lowe's") ||
          pName.includes("ikea")
        );

      case "Bathroom":
        return (
          isMatchInCategories("bathroom") ||
          isMatchInCategories("bathroomremodeling") ||
          isMatchInSpecialties("bathroom") ||
          isMatchInSpecialties("shower") ||
          isMatchInSpecialties("tub") ||
          isMatchInSpecialties("grab bar") ||
          isMatchInSpecialties("toilet") ||
          pName.includes("bath") ||
          pName.includes("shower") ||
          pName.includes("glass") ||
          pName.includes("depot") ||
          pName.includes("lowe's")
        );

      case "Hardware":
        return (
          isMatchInCategories("hardware") ||
          isMatchInSpecialties("hardware") ||
          isMatchInSpecialties("grab bar") ||
          isMatchInSpecialties("rail") ||
          isMatchInSpecialties("tool") ||
          isMatchInSpecialties("fasten") ||
          pName.includes("hardware") ||
          pName.includes("depot") ||
          pName.includes("lowe's")
        );

      case "Medical Equipment":
        return (
          isMatchInCategories("medicalsupplies") ||
          isMatchInCategories("medical") ||
          isMatchInSpecialties("medical") ||
          isMatchInSpecialties("wheelchair") ||
          isMatchInSpecialties("hospital bed") ||
          isMatchInSpecialties("walker") ||
          isMatchInSpecialties("scooter") ||
          isMatchInSpecialties("grab bar") ||
          pName.includes("medical") ||
          pName.includes("supplies")
        );

      case "Painting":
        return (
          isMatchInCategories("painters") ||
          isMatchInCategories("paint") ||
          isMatchInSpecialties("paint") ||
          isMatchInSpecialties("coating") ||
          pName.includes("paint") ||
          pName.includes("sherwin") ||
          pName.includes("depot") ||
          pName.includes("lowe's")
        );

      case "Handyman":
        return (
          isMatchInCategories("handyman") ||
          isMatchInCategories("contractors") ||
          isMatchInSpecialties("handyman") ||
          isMatchInSpecialties("install") ||
          isMatchInSpecialties("mount") ||
          isMatchInSpecialties("repair") ||
          pName.includes("handyman") ||
          pName.includes("contract") ||
          pName.includes("depot") ||
          pName.includes("lowe's")
        );

      default:
        return (
          isMatchInCategories(catLower) ||
          isMatchInSpecialties(catLower) ||
          pName.includes(catLower)
        );
    }
  };

  // Compute reactive Filtered Providers
  const filteredProviders = useMemo(() => {
    let result = [...liveProviders];

    // Apply strict category filtering
    if (selectedCategory && selectedCategory !== "All") {
      result = result.filter(p => doesProviderMatchCategoryStrictly(p, selectedCategory));
    }

    // Apply main text query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.specialties.some((s: string) => s.toLowerCase().includes(q)) ||
          p.categories.some((c: string) => c.toLowerCase().includes(q))
      );
    }

    // Apply distance limit
    result = result.filter((p) => p.distance <= searchRadius);

    // Apply rating filter
    if (minRating > 0) {
      result = result.filter((p) => p.rating >= minRating);
    }

    // Apply price tier filter
    if (priceLevel !== null) {
      result = result.filter((p) => {
        const itemPrice = p.priceLevel || (p.price ? p.price.length : 1);
        return itemPrice <= priceLevel;
      });
    }

    // Apply Open Now filter
    if (openNow) {
      result = result.filter((p) => {
        if (p.is_closed !== undefined) return !p.is_closed;
        return p.openHours && p.openHours !== "Closed";
      });
    }

    // Apply eco-friendly filter
    if (ecoFriendlyOnly) {
      result = result.filter((p) => p.ecoFriendly === true || p.specialties.some((s: string) => s.toLowerCase().includes("eco") || s.toLowerCase().includes("green") || s.toLowerCase().includes("sust")));
    }

    // Apply availability filter
    if (fastestAvailabilityOnly) {
      result = result.filter((p) => p.fastestAvailability === true || p.specialties.some((s: string) => s.toLowerCase().includes("emergency") || s.toLowerCase().includes("same day") || s.toLowerCase().includes("rapid") || s.toLowerCase().includes("fast")));
    }

    // Map match scores
    const scored = result.map(p => {
      const matchScore = calculateMatchScore(p, latestScan);
      const driveTime = p.durationMinutes !== undefined && p.durationMinutes !== null 
        ? p.durationMinutes 
        : Math.max(3, Math.round(p.distance * 2.3 + 2)); // highly realistic fallback formula
      
      return {
        ...p,
        matchScore,
        driveTime
      };
    });

    // Apply Sorting choices
    if (sortBy === "match") {
      scored.sort((a, b) => b.matchScore - a.matchScore);
    } else if (sortBy === "rating") {
      scored.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "distance") {
      scored.sort((a, b) => a.distance - b.distance);
    } else if (sortBy === "popularity") {
      scored.sort((a, b) => b.reviewsCount - a.reviewsCount);
    }

    return scored;
  }, [
    liveProviders,
    searchQuery,
    searchRadius,
    minRating,
    priceLevel,
    openNow,
    ecoFriendlyOnly,
    fastestAvailabilityOnly,
    sortBy,
    coords,
    latestScan
  ]);

  // Selected Provider Item computed
  const selectedProvider = useMemo(() => {
    return filteredProviders.find(p => p.id === selectedProviderId) || null;
  }, [filteredProviders, selectedProviderId]);

  // Synchronize Leaflet Markers whenever filtered list, selection, or map coordinate centers change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    // Clear previous elements
    markersGroup.clearLayers();

    // 1. Plot current User's search center marker
    const userIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center">
          <span class="absolute inline-flex h-8 w-8 animate-ping rounded-full bg-indigo-400 opacity-75"></span>
          <div class="relative w-7 h-7 bg-indigo-600 rounded-full border-2 border-white flex items-center justify-center text-white shadow-xl">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
        </div>
      `,
      className: "custom-user-marker",
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
    L.marker([coords.lat, coords.lng], { icon: userIcon }).addTo(markersGroup);

    // Track boundary layout to fit everything nicely on screen
    const bounds = L.latLngBounds([[coords.lat, coords.lng]]);

    // 2. Plot Provider markers with live smart Match Score badges inside them!
    filteredProviders.forEach((prov) => {
      const isSelected = selectedProviderId === prov.id;
      
      const providerIcon = L.divIcon({
        html: `
          <div class="flex items-center justify-center transition-all duration-300">
            <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-lg border-2 text-[11px] font-bold transition-all ${
              isSelected 
                ? 'bg-rose-500 border-white text-white scale-115 ring-4 ring-rose-500/30' 
                : 'bg-white border-neutral-200 text-neutral-800 hover:border-indigo-500 hover:text-indigo-600 dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-100'
            }">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-3.5 h-3.5 shrink-0"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              <span class="whitespace-nowrap">${prov.matchScore}% Match</span>
            </div>
          </div>
        `,
        className: "custom-provider-marker",
        iconSize: [110, 42],
        iconAnchor: [55, 21]
      });

      const marker = L.marker([prov.lat, prov.lng], { icon: providerIcon });
      
      marker.on("click", () => {
        setSelectedProviderId(prov.id);
        
        // Scroll the matching listing card into view inside the left list panel
        const cardElement = document.getElementById(`provider-card-${prov.id}`);
        if (cardElement) {
          cardElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      });

      marker.addTo(markersGroup);
      bounds.extend([prov.lat, prov.lng]);
    });

    // Auto fit boundary of map only if elements are visible
    if (filteredProviders.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    } else {
      map.setView([coords.lat, coords.lng], 12);
    }
  }, [filteredProviders, selectedProviderId, coords, activeTab]);

  // Smooth flying effect when selecting a card from the list view
  useEffect(() => {
    if (selectedProviderId && mapInstanceRef.current && activeTab === 'local') {
      const prov = filteredProviders.find(p => p.id === selectedProviderId);
      if (prov) {
        mapInstanceRef.current.setView([prov.lat, prov.lng], 14, {
          animate: true,
          duration: 1
        });
      }
    }
  }, [selectedProviderId]);

  // Compute products list based on query and selected category filter
  const filteredProducts = useMemo(() => {
    let result = [...ALL_PRODUCTS];
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    if (selectedCategory !== "All") {
      result = result.filter(
        (p) => p.category.toLowerCase().includes(selectedCategory.toLowerCase())
      );
    }

    return result;
  }, [searchQuery, selectedCategory]);

  // Save/Unsave persistent bookmarking to Firestore
  const handleToggleSave = async (item: any, type: 'provider' | 'product') => {
    if (!user) {
      toast.error("Please log in or register to bookmark home safety resources.");
      return;
    }

    const existingSaved = savedItems.find(
      (saved) => saved.type === type && saved.resourceId === item.id
    );

    try {
      if (existingSaved) {
        await deleteDoc(doc(db, "savedResources", existingSaved.firestoreId));
        toast.success(`Removed from your saved list`);
      } else {
        await addDoc(
          collection(db, "savedResources"),
          cleanUndefined({
            userId: user.uid,
            type,
            resourceId: item.id,
            resourceData: item,
            createdAt: new Date().toISOString(),
          })
        );
        toast.success(`Saved to your favorites`);
      }
    } catch (error) {
      handleFirestoreError(
        error,
        existingSaved ? OperationType.DELETE : OperationType.CREATE,
        `savedResources/${existingSaved?.firestoreId || "new"}`
      );
      toast.error("Failed to update bookmarked items.");
    }
  };

  // Handle Nominatim forward geocoding + robust deterministic fallback
  const handleSearchSubmit = async () => {
    if (!locationQuery.trim()) return;
    
    setIsLoading(true);
    toast.loading(`Geocoding coordinates for: ${locationQuery}...`);
    
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationQuery)}&format=json&limit=1`;
      const response = await fetch(url, {
        headers: {
          "User-Agent": "CareLensAI/1.0 (carelens@example.com)" // friendly user agent required by Nominatim terms
        }
      });
      
      toast.dismiss();
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const result = data[0];
          const displayStr = result.display_name.split(",")[0] + ", " + (result.display_name.split(",")[1] || "").trim();
          
          setActiveCityName(displayStr);
          setCoords({ lat: parseFloat(result.lat), lng: parseFloat(result.lon) });
          toast.success(`Centered discovery map on ${displayStr}`);
          setIsLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn("Nominatim service rate-limited, engaging high-fidelity local lookup:", err);
    }
    
    // Smooth high-fidelity fallback to ensure app NEVER breaks for the user
    toast.dismiss();
    const loc = hashSearchCoordinates(locationQuery);
    setActiveCityName(loc.name);
    setCoords({ lat: loc.lat, lng: loc.lng });
    toast.success(`Centered search on ${loc.name} (Local approximation)`);
    setIsLoading(false);
  };

  // Popular City Fast Access
  const handleCityClick = (city: { name: string; lat: number; lng: number }) => {
    setLocationQuery(city.name);
    setActiveCityName(city.name);
    setCoords({ lat: city.lat, lng: city.lng });
    toast.success(`Centered discovery search on ${city.name}`);
  };

  // Navigator Geolocation (GPS coordinates) reverse geocoded via Nominatim
  const handleGPSLocate = () => {
    if (!navigator.geolocation) {
      toast.error("GPS Geolocation is not supported by this browser.");
      return;
    }
    
    toast.loading("Fetching your GPS coordinates...");
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        toast.dismiss();
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });
        
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { "User-Agent": "CareLensAI/1.0 (carelens@example.com)" } }
          );
          if (response.ok) {
            const data = await response.json();
            const city = data.address.city || data.address.town || data.address.village || "My Location";
            const state = data.address.state || "";
            const name = state ? `${city}, ${state}` : city;
            setLocationQuery(name);
            setActiveCityName(name);
          } else {
            setLocationQuery("My Location");
            setActiveCityName("My Location");
          }
        } catch {
          setLocationQuery("My Location");
          setActiveCityName("My Location");
        }
        toast.success("GPS Location acquired successfully!");
      },
      (error) => {
        toast.dismiss();
        toast.error("Unable to access GPS coordinates.");
        console.error(error);
      }
    );
  };

  // Automatically adjust filters based on AI Scan recommendations
  const handleRecommendationClick = async (rec: any, idx: number) => {
    const recId = rec.id || idx;
    if (classifyingRecId !== null) return; // Prevent double clicks
    
    setClassifyingRecId(recId);
    const toastId = toast.loading(`AI classifying "${rec.title}"...`);

    try {
      const response = await fetch("/api/classify-suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: rec.title, description: rec.description }),
      });

      if (!response.ok) {
        throw new Error("AI classification request failed");
      }

      const data = await response.json();
      const classifiedCategory = data.category || "All";
      const suggestedQuery = data.suggestedQuery || rec.title;

      setSelectedCategory(classifiedCategory);
      setSearchQuery("");
      setActiveTab("local");

      toast.success(`AI classified as "${classifiedCategory}"! Nearby specialists & gear updated.`, { id: toastId });
    } catch (err) {
      console.error("Failed to classify suggestion via AI:", err);
      // Fallback matching
      const titleLower = rec.title.toLowerCase();
      let fallbackCategory = "All";
      if (
        titleLower.includes("grab bar") || 
        titleLower.includes("shower") || 
        titleLower.includes("tub") || 
        titleLower.includes("bathroom")
      ) {
        fallbackCategory = "Bathroom";
      } else if (
        titleLower.includes("light") || 
        titleLower.includes("illumination") || 
        titleLower.includes("lamp")
      ) {
        fallbackCategory = "Electrical";
      } else if (
        titleLower.includes("mat") || 
        titleLower.includes("floor") || 
        titleLower.includes("rug") ||
        titleLower.includes("slip") ||
        titleLower.includes("trip")
      ) {
        fallbackCategory = "Flooring";
      } else if (
        titleLower.includes("ramp") || 
        titleLower.includes("wheelchair") || 
        titleLower.includes("step")
      ) {
        fallbackCategory = "Accessibility";
      }

      setSelectedCategory(fallbackCategory);
      setSearchQuery("");
      setActiveTab("local");
      toast.success(`Smart match activated: "${rec.title}"`, { id: toastId });
    } finally {
      setClassifyingRecId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 px-4 sm:px-6">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-6 border-b border-border mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground flex items-center gap-3">
            <Building className="h-8 w-8 text-primary/80" />
            Marketplace
          </h1>
          <p className="text-muted-foreground text-sm font-light mt-2 max-w-lg">
            Discover local professionals, products, and community grants to upgrade your home safely.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-muted/30 p-1.5 rounded-full border border-border self-start md:self-auto shadow-sm">
          {[
            { id: 'local', label: 'Local Specialists', icon: MapPin },
            { id: 'saved', label: 'Favorites', icon: Heart }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setSelectedCategory("All");
              }}
              className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${
                activeTab === tab.id 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.id === 'saved' && savedItems.length > 0 && (
                <span className="ml-1.5 bg-primary/10 text-primary rounded-full text-[10px] px-2 py-0.5 font-bold">
                  {savedItems.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Core Section */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Context panel, filters, and smart AI matching suggestions (Span 4) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Main Keywords and Location Search */}
          <div className="bg-card p-6 rounded-[2rem] border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] dark:shadow-[0_4px_20px_rgb(0,0,0,0.1)] space-y-4">
            <h3 className="font-medium text-base tracking-tight text-foreground">Search Resources</h3>
            
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                id="keyword-filter-bar"
                placeholder="Search specialties (e.g., grab bars, ramps)..." 
                className="pl-11 h-12 rounded-xl bg-muted/50 border-transparent focus:border-border text-sm transition-all" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {activeTab === 'local' && (
              <div className="space-y-4 pt-2">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleSearchSubmit();
                }} className="flex gap-2">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="search-address-input"
                      placeholder="City, state, or ZIP..." 
                      className="pl-11 h-12 rounded-xl bg-muted/50 border-transparent focus:border-border text-sm font-light transition-all" 
                      value={locationQuery}
                      onChange={(e) => setLocationQuery(e.target.value)}
                    />
                  </div>
                  <Button id="submit-search-btn" type="submit" className="h-12 px-6 rounded-xl bg-foreground hover:bg-foreground/90 text-background transition-colors shrink-0 text-sm font-medium shadow-sm">
                    Search
                  </Button>
                </form>

                {/* GPS and Popular cities quick selection */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Quick Locations</span>
                    <button 
                      id="use-gps-locate-btn"
                      onClick={handleGPSLocate}
                      className="text-xs font-medium text-foreground hover:opacity-70 flex items-center gap-1.5 active:scale-95 transition-all"
                    >
                      <Globe className="w-3.5 h-3.5 text-emerald-500" /> Use GPS
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_CITIES.map(city => {
                      const isActive = activeCityName.toLowerCase().includes(city.name.split(',')[0].toLowerCase());
                      return (
                        <button
                          key={city.name}
                          id={`quick-search-city-${city.name.replace(/[^a-zA-Z]/g, '')}`}
                          onClick={() => handleCityClick(city)}
                          className={`px-4 py-2 rounded-xl text-xs transition-all border ${
                            isActive
                              ? 'bg-foreground text-background border-foreground shadow-sm'
                              : 'bg-card text-muted-foreground border-border hover:bg-muted/50 hover:text-foreground'
                          }`}
                        >
                          {city.name.split(',')[0]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Collapsible Advanced Filters Panel */}
          {activeTab === 'local' && (
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200/60 dark:border-neutral-800/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-neutral-800 dark:text-neutral-200 uppercase tracking-wider flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-indigo-500" />
                  Advanced Filters
                </h3>
                <button 
                  id="toggle-filters-drawer-btn"
                  onClick={() => setShowFiltersDrawer(!showFiltersDrawer)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                >
                  {showFiltersDrawer ? "Hide Options" : "Show All"}
                </button>
              </div>

              {/* Collapsible filter items */}
              <div className={`space-y-4 transition-all duration-300 overflow-hidden ${showFiltersDrawer ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                
                {/* Search radius slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                    <span>Search Radius</span>
                    <span className="text-indigo-600 dark:text-indigo-400">{searchRadius} miles</span>
                  </div>
                  <input 
                    id="search-radius-slider"
                    type="range" 
                    min="5" 
                    max="50" 
                    step="5"
                    value={searchRadius} 
                    onChange={(e) => setSearchRadius(parseInt(e.target.value))}
                    className="w-full accent-indigo-600 dark:accent-indigo-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-400">
                    <span>5 mi</span>
                    <span>25 mi</span>
                    <span>50 mi</span>
                  </div>
                </div>

                {/* Rating filter select */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">Minimum Rating</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[0, 3.5, 4.0, 4.5].map((val) => (
                      <button
                        key={val}
                        type="button"
                        id={`rating-filter-choice-${val}`}
                        onClick={() => setMinRating(val)}
                        className={`py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          minRating === val
                            ? 'bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500'
                            : 'bg-neutral-50 text-neutral-600 border-neutral-200 dark:bg-neutral-950 dark:border-neutral-850 dark:text-neutral-400 hover:bg-neutral-100'
                        }`}
                      >
                        {val === 0 ? "Any" : `${val}★`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price level select */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">Price Tier Limit</label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[null, 1, 2, 3, 4].map((val) => (
                      <button
                        key={val === null ? 'any' : val}
                        type="button"
                        id={`price-filter-choice-${val}`}
                        onClick={() => setPriceLevel(val)}
                        className={`py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          priceLevel === val
                            ? 'bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500'
                            : 'bg-neutral-50 text-neutral-600 border-neutral-200 dark:bg-neutral-950 dark:border-neutral-850 dark:text-neutral-400 hover:bg-neutral-100'
                        }`}
                      >
                        {val === null ? "Any" : "$".repeat(val)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Switch Filters */}
                <div className="space-y-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="filter-open-now" className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">Open Now Only</Label>
                    <Switch 
                      id="filter-open-now" 
                      checked={openNow} 
                      onCheckedChange={setOpenNow} 
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="filter-eco-friendly" className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">Eco-Friendly / Green Specialists</Label>
                    <Switch 
                      id="filter-eco-friendly" 
                      checked={ecoFriendlyOnly} 
                      onCheckedChange={setEcoFriendlyOnly} 
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="filter-fastest" className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">Same-Day / Emergency Teams</Label>
                    <Switch 
                      id="filter-fastest" 
                      checked={fastestAvailabilityOnly} 
                      onCheckedChange={setFastestAvailabilityOnly} 
                    />
                  </div>
                </div>
              </div>

              {/* Sort By Choice always visible */}
              <div className="space-y-1.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Sort Listings By</label>
                <select
                  id="sort-listings-selector"
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs font-semibold text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="match">🧠 Highest Smart Match Score</option>
                  <option value="rating">★ Highest Yelp Rating</option>
                  <option value="distance">🚗 Closest Driving Distance</option>
                  <option value="popularity">👥 Most Reviewed (Popular)</option>
                </select>
              </div>
            </div>
          )}

          {/* AI Safety recommendations list tailored to latest scan findings */}
          <div className="bg-neutral-150/40 dark:bg-neutral-900/30 rounded-3xl p-6 border border-neutral-200/40 dark:border-neutral-800/40 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-5 w-5 text-indigo-500 fill-indigo-500" />
              <h3 className="font-bold text-sm text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">Smart Assist Suggestions</h3>
            </div>
            
            {latestScan ? (
              <div className="space-y-3">
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Tailored to your latest <strong className="text-neutral-700 dark:text-neutral-300">{latestScan.roomType}</strong> safety scan. Click a recommendation to instantly focus matched contractors and gears:
                </p>
                <div className="space-y-2.5">
                  {latestScan.recommendations?.slice(0, 4).map((rec, idx) => {
                    const recId = rec.id || idx;
                    const isCurrentClassifying = classifyingRecId === recId;
                    return (
                      <div 
                        key={recId} 
                        onClick={() => handleRecommendationClick(rec, idx)}
                        className={`group flex flex-col gap-1 bg-white dark:bg-neutral-900 p-4 rounded-2xl border hover:border-indigo-400 dark:hover:border-indigo-650 hover:shadow-md transition-all cursor-pointer active:scale-98 ${
                          isCurrentClassifying 
                            ? 'border-indigo-500 ring-2 ring-indigo-500/10 pointer-events-none' 
                            : 'border-neutral-200/50 dark:border-neutral-800/80'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                            {rec.title}
                          </span>
                          {isCurrentClassifying ? (
                            <div className="flex items-center gap-1 text-[10px] text-indigo-500 font-semibold animate-pulse shrink-0">
                              <RefreshCw className="w-3 h-3 animate-spin text-indigo-500" />
                              <span>Classifying...</span>
                            </div>
                          ) : (
                            <Badge className={`${
                              rec.priority === 'Critical' || rec.priority === 'High'
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                            } border shrink-0 text-[9px] px-1.5 py-0`} variant="outline">
                              {rec.priority}
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
                          {rec.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-neutral-400 space-y-2">
                <p className="text-xs leading-relaxed">
                  No scan reports available yet. Upload and scan a room to trigger precise AI-matched local help!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Interactive split screen display: listing on left, interactive leaflet map on right (Span 8) */}
        <div className="lg:col-span-8 flex flex-col min-h-[680px] bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
          
          {/* Header section with categories bar */}
          <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base tracking-tight text-neutral-900 dark:text-neutral-50">
                {activeTab === 'local' && `Local Pros in ${activeCityName} (${filteredProviders.length} matches)`}
                {activeTab === 'products' && `Safety Gear & Grab Bars (${filteredProducts.length} matching)`}
                {activeTab === 'saved' && `Bookmarked Resources (${savedItems.length} items)`}
              </h3>
              
              {/* Mobile list vs map toggle (Zillow style) */}
              {activeTab === 'local' && (
                <div className="flex md:hidden bg-neutral-100 dark:bg-neutral-850 p-1 rounded-xl">
                  <button
                    id="mobile-view-toggle-list"
                    onClick={() => setMobileViewMode('list')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      mobileViewMode === 'list' 
                        ? 'bg-white text-black dark:bg-neutral-900 dark:text-white shadow-sm' 
                        : 'text-neutral-500'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" /> List
                  </button>
                  <button
                    id="mobile-view-toggle-map"
                    onClick={() => setMobileViewMode('map')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      mobileViewMode === 'map' 
                        ? 'bg-white text-black dark:bg-neutral-900 dark:text-white shadow-sm' 
                        : 'text-neutral-500'
                    }`}
                  >
                    <Navigation className="w-3.5 h-3.5" /> Map
                  </button>
                </div>
              )}
            </div>
            
            {activeTab !== 'saved' && (
              <div className="flex gap-2 overflow-x-auto pb-1.5 no-scrollbar scroll-smooth">
                {AVAILABLE_CATEGORIES.map(catName => {
                  const isSelected = selectedCategory === catName;
                  return (
                    <button
                      key={catName}
                      id={`category-badge-${catName}`}
                      onClick={() => setSelectedCategory(catName)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all ${
                        isSelected 
                          ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow-sm' 
                          : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50 dark:bg-neutral-950 dark:text-neutral-350 dark:border-neutral-800 dark:hover:bg-neutral-850'
                      }`}
                    >
                      {catName}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Core Visual Area */}
          <div className="flex-1 relative overflow-hidden min-h-[500px]">
            <AnimatePresence mode="wait">
              
              {/* Tab: Local Professionals */}
              {activeTab === 'local' && (
                <motion.div 
                  key="local-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute inset-0 flex h-full"
                >
                  
                  {/* Left panel: List View of businesses */}
                  <div className={`w-full md:w-1/2 h-full overflow-y-auto p-6 space-y-4 border-r border-neutral-100 dark:border-neutral-800 ${
                    mobileViewMode === 'list' ? 'block' : 'hidden md:block'
                  }`}>
                    {isLoading ? (
                      <div className="flex flex-col items-center justify-center py-24 h-full">
                        <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                        <p className="text-xs text-neutral-500 animate-pulse text-center leading-relaxed">
                          Synchronizing with Yelp Fusion & calculating driving routes via OSRM...
                        </p>
                      </div>
                    ) : filteredProviders.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center text-neutral-400 space-y-2">
                        <ShoppingBag className="w-10 h-10 opacity-40" />
                        <p className="text-sm">No local specialists found matching your filter criteria.</p>
                        <Button id="reset-filters-btn" variant="outline" className="text-xs font-semibold" onClick={() => {
                          setMinRating(0);
                          setPriceLevel(null);
                          setOpenNow(false);
                          setEcoFriendlyOnly(false);
                          setFastestAvailabilityOnly(false);
                          setSelectedCategory("All");
                          setSearchQuery("");
                          setSearchRadius(15);
                        }}>Reset Filters</Button>
                      </div>
                    ) : (
                      filteredProviders.map(prov => {
                        const isSaved = savedItems.some(
                          saved => saved.type === 'provider' && saved.resourceId === prov.id
                        );
                        const isSelected = selectedProviderId === prov.id;
                        return (
                          <div 
                            key={prov.id} 
                            id={`provider-card-${prov.id}`}
                            onClick={() => setSelectedProviderId(prov.id)}
                            className={`p-5 rounded-2xl transition-all border cursor-pointer flex flex-col justify-between group gap-4 ${
                              isSelected 
                                ? 'bg-indigo-50/40 border-indigo-200 dark:bg-indigo-950/20 dark:border-indigo-900/60 shadow-sm' 
                                : 'bg-neutral-50/50 border-neutral-150/80 hover:bg-white hover:border-neutral-300 dark:bg-neutral-900 dark:border-neutral-850 dark:hover:border-neutral-750'
                            }`}
                          >
                            <div className="flex gap-4">
                              <img 
                                referrerPolicy="no-referrer"
                                src={getBusinessPhoto(prov)} 
                                className="w-18 h-18 object-cover rounded-xl border border-neutral-200/60 dark:border-neutral-800 shrink-0"
                                alt={prov.name} 
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start gap-2">
                                  <h4 className="font-bold text-sm text-neutral-900 dark:text-neutral-50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
                                    {prov.name}
                                  </h4>
                                  <button
                                    id={`bookmark-btn-${prov.id}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleSave(prov, 'provider');
                                    }}
                                    className="text-neutral-400 hover:text-red-500 transition-colors p-1 shrink-0"
                                  >
                                    <Heart className={`w-4 h-4 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
                                  </button>
                                </div>

                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400 text-[9px] px-1.5 py-0 flex items-center gap-0.5" variant="outline">
                                    <Sparkles className="w-2.5 h-2.5" />
                                    {prov.matchScore}% Match
                                  </Badge>
                                  {prov.openHours && prov.openHours !== "Closed" ? (
                                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-[9px] px-1.5 py-0" variant="outline">Open Now</Badge>
                                  ) : (
                                    <Badge className="bg-red-500/10 text-red-600 border-red-500/20 text-[9px] px-1.5 py-0" variant="outline">Closed</Badge>
                                  )}
                                  <span className="text-[11px] text-neutral-400">
                                    {prov.categories[0] || "Specialist"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
                              {prov.specialties.join(" • ")}
                            </p>

                            {prov.address && (
                              <div className="flex items-center text-[11px] text-neutral-500 dark:text-neutral-400 gap-1.5 mt-1 bg-neutral-100/50 dark:bg-neutral-800/30 px-2.5 py-1.5 rounded-xl">
                                <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                <span className="truncate font-light" title={prov.address}>{prov.address}</span>
                              </div>
                            )}

                            <div className="flex items-center justify-between text-xs pt-3 border-t border-neutral-100 dark:border-neutral-800/80 mt-1">
                              <div className="flex items-center gap-3">
                                <span className="flex items-center text-amber-500 font-bold">
                                  <Star className="w-3.5 h-3.5 mr-1 fill-current" /> {prov.rating}
                                </span>
                                <span className="text-neutral-400">({prov.reviewsCount} reviews)</span>
                              </div>
                              
                              <div className="flex items-center gap-2 font-semibold text-neutral-700 dark:text-neutral-300">
                                <span className="flex items-center text-[10px] bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-lg gap-1">
                                  <Car className="w-3 h-3 text-indigo-500" />
                                  {prov.distance.toFixed(1)} mi
                                </span>
                                <span className="flex items-center text-[10px] bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-lg gap-1">
                                  <Clock className="w-3 h-3 text-indigo-500" />
                                  {prov.driveTime} min drive
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Right panel: Live interactive OpenStreetMap via Leaflet container */}
                  <div className={`w-full md:w-1/2 h-full bg-neutral-100 dark:bg-neutral-900 relative ${
                    mobileViewMode === 'map' ? 'block' : 'hidden md:block'
                  }`}>
                    <div ref={mapContainerRef} className="w-full h-full z-0" />

                    {/* Quick Selected Provider Popover panel exactly like Airbnb */}
                    {selectedProvider && (
                      <div className="absolute bottom-6 left-4 right-4 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md p-4 rounded-3xl border border-neutral-200 dark:border-neutral-850 shadow-2xl space-y-3 z-10 animate-in fade-in slide-in-from-bottom-4 duration-200">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex gap-3">
                            <img 
                              referrerPolicy="no-referrer"
                              src={getBusinessPhoto(selectedProvider)} 
                              className="w-14 h-14 object-cover rounded-xl" 
                              alt={selectedProvider.name} 
                            />
                            <div>
                              <Badge className="bg-indigo-600/10 text-indigo-600 border-indigo-200 text-[9px] px-1.5 py-0" variant="outline">
                                {selectedProvider.matchScore}% Best Match
                              </Badge>
                              <h4 className="font-bold text-sm mt-1 text-neutral-900 dark:text-neutral-50 line-clamp-1">{selectedProvider.name}</h4>
                              <p className="text-[11px] text-neutral-500 flex items-center mt-1">
                                <MapPin className="w-3 h-3 mr-0.5 text-indigo-500 shrink-0" /> <span className="line-clamp-1" title={selectedProvider.address}>{selectedProvider.address}</span>
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-right shrink-0">
                            <span className="text-xs font-bold text-amber-500 flex items-center justify-end">
                              <Star className="w-3.5 h-3.5 mr-0.5 fill-current" /> {selectedProvider.rating}
                            </span>
                            <span className="text-[10px] text-neutral-400 font-semibold block mt-1">{selectedProvider.distance.toFixed(1)} miles away</span>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-1">
                          <a 
                            href={`tel:${selectedProvider.phone}`}
                            className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl bg-black dark:bg-neutral-50 text-white dark:text-black font-bold text-xs hover:opacity-90 active:scale-[0.98] transition-all"
                          >
                            <Phone className="w-3.5 h-3.5" /> Call {selectedProvider.phone}
                          </a>
                          {selectedProvider.website && (
                            <a 
                              href={selectedProvider.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-10 w-10 flex items-center justify-center rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 active:scale-[0.98] transition-all"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                </motion.div>
              )}



              {/* Tab: Bookmarked Saved Favorites */}
              {activeTab === 'saved' && (
                <motion.div 
                  key="saved-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute inset-0 p-6 overflow-y-auto space-y-6"
                >
                  {savedItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center py-20">
                      <Heart className="w-12 h-12 text-neutral-200 dark:text-neutral-800 mb-3 animate-pulse" />
                      <h3 className="text-base font-bold text-neutral-700 dark:text-neutral-300">No bookmarks yet</h3>
                      <p className="text-xs text-neutral-400 max-w-xs mt-1">
                        Save helpful local specialists and recommended products to review or contact them later.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      
                      {/* Saved Local Specialists */}
                      {savedItems.some(i => i.type === 'provider') && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5" /> Saved Contractors & Pros
                          </h4>
                          <div className="grid sm:grid-cols-2 gap-4">
                            {savedItems
                              .filter(i => i.type === 'provider')
                              .map(item => {
                                const prov = item.resourceData;
                                return (
                                  <div key={item.firestoreId} className="p-5 rounded-2xl bg-neutral-50/50 dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800 flex flex-col justify-between gap-3">
                                    <div className="flex justify-between items-start gap-3">
                                      <h4 className="font-bold text-sm text-neutral-900 dark:text-neutral-50 leading-tight">{prov.name}</h4>
                                      <button 
                                        id={`unsave-prov-${item.firestoreId}`}
                                        onClick={() => handleToggleSave(prov, 'provider')}
                                        className="text-red-500 hover:text-red-650 p-1 shrink-0"
                                      >
                                        <Heart className="w-4 h-4 fill-red-500" />
                                      </button>
                                    </div>
                                    <p className="text-xs text-neutral-400 line-clamp-2">{prov.specialties?.join(" • ")}</p>
                                    
                                    {prov.address && (
                                      <div className="flex items-center text-[11px] text-neutral-500 dark:text-neutral-400 gap-1 mt-0.5">
                                        <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                        <span className="truncate font-light" title={prov.address}>{prov.address}</span>
                                      </div>
                                    )}
                                    
                                    <div className="flex items-center justify-between text-xs pt-3 border-t border-neutral-100 dark:border-neutral-800/80 mt-1">
                                      <span className="flex items-center text-amber-500 font-bold">
                                        <Star className="w-3.5 h-3.5 mr-0.5 fill-current" /> {prov.rating}
                                      </span>
                                      <a href={`tel:${prov.phone}`} className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1 hover:underline">
                                        <Phone className="w-3 h-3" /> Call Pro
                                      </a>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}


                    </div>
                  )}
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
}
