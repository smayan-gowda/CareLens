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
 ShoppingBag, 
 Globe, 
 List, 
 Navigation,
 Check,
 RefreshCw,
 Clock,
 Car,
 Sparkles,
 X
} from "lucide-react";
import { toast } from "sonner";
import { getMatchReasons, matchLabel } from "@/components/marketplace/matchReasons";
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

// Transparent trade relevance scoring (0-3 rank) comparing provider specialties with latest scan recommendations
const calculateMatchScore = (provider: any, latestScan: any): number => {
  if (!latestScan || !latestScan.recommendations) {
    return provider.rating ? Math.round(provider.rating * 10) : 40;
  }

  const searchableString = [
    ...(provider.categories || []),
    ...(provider.specialties || []),
    provider.name || ""
  ].join(" ").toLowerCase();

  let rank = 10;
  latestScan.recommendations.forEach((rec: any) => {
    const recTitle = (rec.title || "").toLowerCase();
    if (searchableString.includes("plumb") && (recTitle.includes("plumb") || recTitle.includes("shower") || recTitle.includes("tub") || recTitle.includes("grab bar"))) {
      rank += 25;
    }
    if (searchableString.includes("floor") && (recTitle.includes("floor") || recTitle.includes("slip") || recTitle.includes("rug") || recTitle.includes("mat"))) {
      rank += 25;
    }
    if (searchableString.includes("light") && (recTitle.includes("light") || recTitle.includes("sensor") || recTitle.includes("illumination"))) {
      rank += 25;
    }
    if ((searchableString.includes("accessibility") || searchableString.includes("ada") || searchableString.includes("handyman")) && (recTitle.includes("rail") || recTitle.includes("grab bar") || recTitle.includes("ramp"))) {
      rank += 25;
    }
  });

  return rank;
};

export function ResourcesPage() {
 const { user } = useAuthStore();
 const { scans } = useScanStore();

 // Track which recommendation is currently being classified by AI
 const [classifyingRecId, setClassifyingRecId] = useState<string | number | null>(null);

 // AI Categorized Search State
 const [isAISearching, setIsAISearching] = useState(false);
 const [aiCategorizedInfo, setAiCategorizedInfo] = useState<{
 category: string;
 originalQuery: string;
 suggestedQuery?: string;
 } | null>(null);

 // Navigation & Listing States
 const [activeTab, setActiveTab] = useState<'local' | 'products' | 'saved'>('local');
 const [searchQuery, setSearchQuery] = useState("");
 const [selectedCategory, setSelectedCategory] = useState("All");

 // Location & Geocoding Coordinates
 const [locationQuery, setLocationQuery] = useState("Austin, TX");
 const [activeCityName, setActiveCityName] = useState("Austin, TX");
 const [coords, setCoords] = useState({ lat: 30.2672, lng: -97.7431 });

 // Filter Configurations (Advanced Filters)
 const [searchRadius] = useState<number>(15); // miles
 const [minRating] = useState<number>(0);
 const [priceLevel] = useState<number | null>(null);
 const [sortBy] = useState<'match' | 'rating' | 'distance' | 'popularity'>('match');

 // Mobile split toggle (Zillow/Airbnb style list vs map on small screens)
 const [mobileViewMode, setMobileViewMode] = useState<'list' | 'map'>('list');

 // Business Results State
 const [liveProviders, setLiveProviders] = useState<any[]>([]);
 const [isLoading, setIsLoading] = useState(false);
 const [providerSearchUnavailable, setProviderSearchUnavailable] = useState(false);
 const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
 const [savedItems, setSavedItems] = useState<any[]>([]);
 const savedProviderItems = savedItems.filter(
 item => item.type === "provider" && item.resourceData?.isYelp === true && String(item.resourceId).startsWith("yelp_")
 );
 const unavailableSavedProviderItems = savedItems.filter(
 item => item.type === "provider" && !savedProviderItems.includes(item)
 );

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

 // Call OSRM for optional road-route estimates; never synthesize a travel time.
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
 console.warn("OSRM route estimates are unavailable:", error);
 }
 return null;
 };

 // Synchronize Yelp and OSRM data based on category, coordinates, radius and filters
 useEffect(() => {
 let isMounted = true;
 
 const loadData = async () => {
 setIsLoading(true);
 setProviderSearchUnavailable(false);
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
 phone: b.display_phone || b.phone || "",
 website: b.url,
 address: b.location.display_address?.join(", ") || b.location.address1 || "",
 lat: b.coordinates.latitude,
 lng: b.coordinates.longitude,
 distance: dist,
 durationMinutes: durationMin,
 specialties,
 isYelp: true,
 priceLevel: b.price ? b.price.length : null,
 image: b.image_url
 };
 });
 
 setLiveProviders(mapped);
 } else {
 setLiveProviders([]);
 }
 } catch (err) {
 console.error("Error loading resources:", err);
 if (isMounted) {
 setLiveProviders([]);
 setProviderSearchUnavailable(true);
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

 // Map match scores
 const scored = result.map(p => {
 const matchScore = calculateMatchScore(p, latestScan);
 return {
 ...p,
 matchScore
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
 <span class="absolute inline-flex h-8 w-8 animate-ping bg-orange-400 opacity-60"></span>
 <div class="relative w-7 h-7 bg-orange-600 border-2 border-white flex items-center justify-center text-white shadow-xl">
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
 <div class="flex items-center gap-1.5 px-3 py-1.5 shadow-lg border-2 text-[11px] font-bold transition-all ${
 isSelected 
 ? 'bg-red-600 border-white text-white scale-110 ring-4 ring-red-500/30' 
 : 'bg-white border-border text-neutral-800 hover:border-brand hover:text-brand'
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

 // Handle Nominatim forward geocoding without inventing coordinates on failure.
 const handleSearchSubmit = async () => {
 if (!locationQuery.trim()) return;
 
 setIsLoading(true);
 const toastId = toast.loading(`Searching for: ${locationQuery}...`);
 
 try {
 const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationQuery)}&format=json&limit=1`;
 const response = await fetch(url, {
 headers: {
 "User-Agent": "CareLensAI/1.0 (carelens@example.com)" // friendly user agent required by Nominatim terms
 }
 });
 
 if (response.ok) {
 const data = await response.json();
 if (data && data.length > 0) {
 const result = data[0];
 const displayStr = result.display_name.split(",")[0] + ", " + (result.display_name.split(",")[1] || "").trim();
 const latitude = Number.parseFloat(result.lat);
 const longitude = Number.parseFloat(result.lon);
 if (!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
     latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
   toast.dismiss(toastId);
   toast.error("The location service returned invalid coordinates. The map location was not changed.");
   setIsLoading(false);
   return;
 }
 setActiveCityName(displayStr);
 setCoords({ lat: latitude, lng: longitude });
 toast.dismiss(toastId);
 toast.success(`Centered discovery map on ${displayStr}`);
 setIsLoading(false);
 return;
 }
  toast.dismiss(toastId);
  toast.error("No matching location was found. The map location was not changed.");
  setIsLoading(false);
  return;
 }
 } catch (err) {
 console.warn("Location search unavailable:", err);
 }
 
 toast.dismiss(toastId);
 toast.error("Location search is unavailable. The map location was not changed.");
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

 // AI Categorize user search query
 const handleAISearch = async (queryToClassify?: string) => {
 const q = (queryToClassify !== undefined ? queryToClassify : searchQuery).trim();
 if (!q) {
 toast.error("Please enter a search query or safety concern first.");
 return;
 }

 setIsAISearching(true);
 const toastId = toast.loading(`AI categorizing search: "${q}"...`);

 try {
 const response = await fetch("/api/classify-suggestion", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ title: q, description: "Marketplace search query" }),
 });

 if (!response.ok) {
 throw new Error("AI classification request failed");
 }

 const data = await response.json();
 const classifiedCategory = data.category || "All";
 const suggestedQuery = data.suggestedQuery || q;

 setSelectedCategory(classifiedCategory);
 setSearchQuery(suggestedQuery);
 setActiveTab("local");
 setAiCategorizedInfo({
 category: classifiedCategory,
 originalQuery: q,
 suggestedQuery: suggestedQuery
 });

 toast.success(`AI categorized as "${classifiedCategory}"! Showing matching stores.`, { id: toastId });
 } catch (err) {
 console.error("AI search classification error:", err);
 // Fallback matching
 const qLower = q.toLowerCase();
 let fallbackCat = "All";
 if (qLower.includes("grab bar") || qLower.includes("shower") || qLower.includes("tub") || qLower.includes("toilet") || qLower.includes("bath")) {
 fallbackCat = "Bathroom";
 } else if (qLower.includes("plumb") || qLower.includes("pipe") || qLower.includes("leak") || qLower.includes("drain")) {
 fallbackCat = "Plumbing";
 } else if (qLower.includes("light") || qLower.includes("wire") || qLower.includes("electric") || qLower.includes("switch") || qLower.includes("outlet")) {
 fallbackCat = "Electrical";
 } else if (qLower.includes("ramp") || qLower.includes("wheelchair") || qLower.includes("stair") || qLower.includes("access")) {
 fallbackCat = "Accessibility";
 } else if (qLower.includes("floor") || qLower.includes("slip") || qLower.includes("mat") || qLower.includes("carpet") || qLower.includes("tile")) {
 fallbackCat = "Flooring";
 } else if (qLower.includes("walker") || qLower.includes("medical") || qLower.includes("bed") || qLower.includes("scooter")) {
 fallbackCat = "Medical Equipment";
 } else if (qLower.includes("cabinet") || qLower.includes("shelf")) {
 fallbackCat = "Cabinets";
 } else {
 fallbackCat = "Handyman";
 }

 setSelectedCategory(fallbackCat);
 setActiveTab("local");
 setAiCategorizedInfo({
 category: fallbackCat,
 originalQuery: q,
 });
 toast.success(`Smart categorized search as "${fallbackCat}"!`, { id: toastId });
 } finally {
 setIsAISearching(false);
 }
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
 setAiCategorizedInfo({
 category: classifiedCategory,
 originalQuery: rec.title,
 suggestedQuery: suggestedQuery
 });

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
 setAiCategorizedInfo({
 category: fallbackCategory,
 originalQuery: rec.title
 });
 toast.success(`Smart match activated: "${rec.title}"`, { id: toastId });
 } finally {
 setClassifyingRecId(null);
 }
 };

 const heroHeadline = latestScan
 ? `Trusted professionals near you`
 : `Trusted professionals nearby`;
 const heroSubline = latestScan
 ? `Based on your latest ${latestScan.roomType} assessment, these specialists can help improve your home's safety.`
 : `Search local specialists, or run a room scan first for personalized matches.`;

 return (
 <div className="space-y-10">

 {/* Hero */}
 <div className="relative overflow-hidden bg-neutral-900 -mx-4 md:-mx-8 -mt-8 md:-mt-10 mb-2">
 <div className="absolute inset-0">
 <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,color-mix(in_oklch,var(--brand),transparent_60%),transparent_60%),linear-gradient(160deg,oklch(0.24_0.01_60),oklch(0.09_0.01_60))]" />
 <div className="absolute inset-0 bg-black/20" />
 </div>
 <div className="relative z-10 px-5 md:px-10 py-16 md:py-20 max-w-3xl">
 <span className="field-tag text-white/50 mb-4 block">Marketplace</span>
 <h1 className="narrative text-white text-4xl md:text-6xl text-balance mb-4">{heroHeadline}</h1>
 <p className="text-white/65 text-base md:text-lg leading-relaxed max-w-xl">{heroSubline}</p>
 </div>
 </div>

 {/* Directory Verification Disclosure Banner */}
 <div className="p-3.5 bg-muted/40 border border-border rounded-xl text-xs text-muted-foreground flex items-start gap-2.5 max-w-4xl">
 <MapPin className="w-4 h-4 text-brand shrink-0 mt-0.5" />
 <p className="leading-relaxed">
 <strong className="text-foreground font-medium">Independent Directory Notice:</strong> Local trade specialists and suppliers are indexed from public business directories for neighborhood discovery. CareLens does not endorse, employ, or guarantee contractor licensing or insurance. Always request proof of credentials, bonding, and local permits directly.
 </p>
 </div>

 {/* Tab Selection */}
 <div className="flex bg-muted/30 p-1 rounded-md border border-border self-start md:self-auto">
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
 className={`flex items-center justify-center gap-2 px-5 py-2 rounded-sm text-sm font-medium transition-colors ${
 activeTab === tab.id 
 ? 'bg-background text-foreground shadow-sm' 
 : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
 }`}
 >
 <tab.icon className="w-4 h-4" />
 {tab.label}
 {tab.id === 'saved' && savedItems.length > 0 && (
 <span className="ml-1.5 bg-brand/10 text-brand rounded-sm text-[10px] px-1.5 py-0.5 font-bold">
 {savedItems.length}
 </span>
 )}
 </button>
 ))}
 </div>

 {/* Main Core Section */}
 <div className="grid lg:grid-cols-12 gap-6 items-start">
 
  {/* Left Column: Context panel and search (Span 4) */}
  <div className="lg:col-span-4 space-y-8">
    <div className="space-y-6">
      {/* Primary Search */}
      <div className="space-y-3">
        <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70 block">Discovery</label>
        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 transition-colors group-focus-within:text-brand" />
          <Input 
            id="keyword-filter-bar"
            placeholder="Search specialties..." 
            className="pl-10 h-12 bg-muted/20 border-border/50 focus-visible:border-brand/50 focus-visible:ring-0 text-sm transition-all shadow-none rounded-none" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && searchQuery.trim()) {
                e.preventDefault();
                handleAISearch(searchQuery);
              }
            }}
          />
          {isAISearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand/60" />
            </div>
          )}
        </div>

        {/* AI Active Banner Integrated quietly */}
        <AnimatePresence>
          {aiCategorizedInfo && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="p-3 bg-brand/5 border border-brand/10 rounded-sm text-[11px] flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles className="w-3 h-3 text-brand shrink-0" />
                <span className="truncate text-muted-foreground">
                  Refining for <span className="text-foreground font-medium">{aiCategorizedInfo.category}</span>
                </span>
              </div>
              <button
                id="clear-ai-categorized-filter"
                onClick={() => {
                  setAiCategorizedInfo(null);
                  setSelectedCategory("All");
                  setSearchQuery("");
                }}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Location Search */}
      {activeTab === 'local' && (
        <div className="space-y-3">
          <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70 block">Location</label>
          <div className="flex flex-col gap-2">
            <div className="relative group">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 transition-colors group-focus-within:text-brand" />
              <Input 
                id="search-address-input"
                placeholder="City or ZIP code" 
                className="pl-10 h-12 bg-muted/20 border-border/50 focus-visible:border-brand/50 focus-visible:ring-0 text-sm transition-all shadow-none rounded-none" 
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearchSubmit();
                  }
                }}
              />
            </div>
            <Button 
              id="submit-search-btn" 
              variant="outline" 
              onClick={handleSearchSubmit}
              disabled={isLoading}
              className="h-10 border-border/50 hover:bg-muted/30 text-xs font-semibold rounded-none"
            >
              Update Map
            </Button>
          </div>
        </div>
      )}

      {/* Contextual Note */}
      {latestScan && (
        <div className="pt-6 border-t border-border/50">
          <div className="flex gap-3">
            <div className="mt-0.5">
              <Sparkles className="w-3.5 h-3.5 text-brand/60" />
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Results are prioritized using your <span className="text-foreground font-medium">{latestScan.roomType}</span> assessment data to surface the most relevant local safety specialists.
            </p>
          </div>
        </div>
      )}
    </div>
  </div>

 {/* Right Column: the map is the centerpiece — large, minimal chrome */}
 <div className="lg:col-span-8 flex flex-col min-h-[680px] bg-card border border-border overflow-hidden">

 {/* Header section with categories bar */}
 <div className="p-5 md:p-6 border-b border-border space-y-4">
 <div className="flex items-center justify-between">
 <h3 className="text-lg font-semibold tracking-tight text-foreground">
 {activeTab === 'local' && `${filteredProviders.length} specialists near ${activeCityName.split(',')[0]}`}
 {activeTab === 'products' && `${filteredProducts.length} products`}
 {activeTab === 'saved' && `${savedItems.length} saved`}
 </h3>

 {/* Mobile list vs map toggle */}
 {activeTab === 'local' && (
 <div className="flex md:hidden bg-muted p-1 rounded-md">
 <button
 id="mobile-view-toggle-list"
 onClick={() => setMobileViewMode('list')}
 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium transition-colors ${
 mobileViewMode === 'list' 
 ? 'bg-background text-foreground shadow-sm' 
 : 'text-muted-foreground'
 }`}
 >
 <List className="w-3.5 h-3.5" /> List
 </button>
 <button
 id="mobile-view-toggle-map"
 onClick={() => setMobileViewMode('map')}
 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium transition-colors ${
 mobileViewMode === 'map' 
 ? 'bg-background text-foreground shadow-sm' 
 : 'text-muted-foreground'
 }`}
 >
 <Navigation className="w-3.5 h-3.5" /> Map
 </button>
 </div>
 )}
 </div>
 
 {activeTab === 'local' && (
 <p className="text-xs text-muted-foreground">
 Live specialist listings are provided by Yelp. Route times are shown only when available.
 </p>
 )}

 {activeTab !== 'saved' && (
 <div className="flex gap-2 overflow-x-auto pb-1.5 no-scrollbar scroll-smooth">
 {AVAILABLE_CATEGORIES.map(catName => {
 const isSelected = selectedCategory === catName;
 return (
 <button
 key={catName}
 id={`category-badge-${catName}`}
 onClick={() => {
 setSelectedCategory(catName);
 if (aiCategorizedInfo && catName !== aiCategorizedInfo.category) {
 setAiCategorizedInfo(null);
 }
 }}
 className={`px-3.5 py-1.5 rounded-sm text-xs font-semibold whitespace-nowrap border transition-colors ${
 isSelected 
 ? 'bg-foreground text-background border-foreground' 
 : 'bg-background text-muted-foreground border-border hover:bg-muted'
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
 
 {/* Left panel: curated recommendations, not a directory list */}
 <div className={`w-full md:w-1/2 h-full overflow-y-auto p-5 md:p-6 space-y-1 border-r border-border ${
 mobileViewMode === 'list' ? 'block' : 'hidden md:block'
 }`}>
 {isLoading ? (
 <div className="flex flex-col items-center justify-center py-24 h-full">
 <RefreshCw className="w-5 h-5 text-brand animate-spin mb-4" strokeWidth={1.75} />
 <p className="text-xs text-muted-foreground animate-pulse text-center leading-relaxed">
 Finding specialists nearby...
 </p>
 </div>
 ) : filteredProviders.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
 <div className="w-12 h-12 border border-border flex items-center justify-center">
 <ShoppingBag className="w-5 h-5 text-muted-foreground/50" strokeWidth={1.5} />
 </div>
 <div>
 <p className="text-sm font-medium">
 {providerSearchUnavailable
 ? "Live specialist search is unavailable"
 : liveProviders.length === 0
 ? "No specialists found"
 : "Nothing matches this search"}
 </p>
 <p className="text-xs text-muted-foreground mt-1 max-w-[260px]">
 {providerSearchUnavailable
 ? "The directory could not be reached. No example businesses are shown as real listings."
 : liveProviders.length === 0
 ? "The live directory returned no specialists for this area and category."
 : "Try a different search or clear the filters."}
 </p>
 </div>
  <Button id="reset-filters-btn" variant="outline" size="sm" onClick={() => {
    setSelectedCategory("All");
    setSearchQuery("");
  }}>Clear Search</Button>
 </div>
 ) : (
 filteredProviders.map((prov, index) => {
 const isSaved = savedItems.some(
 saved => saved.type === 'provider' && saved.resourceId === prov.id
 );
 const isSelected = selectedProviderId === prov.id;
 const reasons = getMatchReasons(prov, latestScan);
 return (
 <motion.div
 key={prov.id}
 id={`provider-card-${prov.id}`}
 initial={{ opacity: 0, y: 8 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: Math.min(index, 6) * 0.04, duration: 0.4 }}
 onClick={() => setSelectedProviderId(prov.id)}
 className={`group cursor-pointer border-b border-border py-5 transition-colors ${isSelected ? 'bg-brand/[0.04]' : 'hover:bg-muted/30'}`}
 >
 <div className="flex gap-4">
 <div className="w-24 h-24 shrink-0 overflow-hidden bg-muted relative">
 {prov.image ? (
 <img
 referrerPolicy="no-referrer"
 src={prov.image}
 className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
 alt={`Photo provided for ${prov.name}`}
 />
 ) : (
 <div className="w-full h-full flex items-center justify-center text-muted-foreground/50" aria-label="No provider photo available">
 <ShoppingBag className="w-6 h-6" />
 </div>
 )}
 </div>

 <div className="flex-1 min-w-0">
 <div className="flex justify-between items-start gap-2">
 <h4 className="font-semibold text-base tracking-tight leading-snug group-hover:text-brand transition-colors truncate">
 {prov.name}
 </h4>
 <button
 id={`bookmark-btn-${prov.id}`}
 onClick={(e) => {
 e.stopPropagation();
 handleToggleSave(prov, 'provider');
 }}
 className="text-muted-foreground/50 hover:text-destructive transition-colors p-1 shrink-0 -mt-1 -mr-1"
 >
 <Heart className={`w-4 h-4 ${isSaved ? 'fill-destructive text-destructive' : ''}`} />
 </button>
 </div>

 <p className="text-xs text-muted-foreground mt-0.5">{prov.categories[0] || "Specialist"}</p>

 {prov.address && (
 <p className="text-xs text-foreground/80 flex items-start gap-1 mt-1.5 font-normal leading-relaxed">
 <MapPin className="w-3.5 h-3.5 shrink-0 text-brand mt-0.5" />
 <span className="break-words">{prov.address}</span>
 </p>
 )}

 <div className="flex items-center gap-3 mt-2 text-xs">
 <span className="flex items-center gap-1 text-foreground font-medium">
 <Star className="w-3 h-3 fill-warning text-warning" /> {prov.rating}
 </span>
 <span className="text-muted-foreground">({prov.reviewsCount})</span>
 </div>

 <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
 <span className="flex items-center gap-1"><Car className="w-3 h-3" /> About {prov.distance.toFixed(1)} mi away</span>
 {prov.durationMinutes !== null && prov.durationMinutes !== undefined && (
 <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> About {prov.durationMinutes} min by car</span>
 )}
 </div>
 </div>
 </div>

 {/* Descriptive Trade Badge & Verified Features */}
 <div className="mt-3 pl-0">
 <div className="flex items-center gap-2 mb-2 flex-wrap">
 <span className="text-xs font-semibold text-brand px-2 py-0.5 bg-brand/10 rounded">
 {matchLabel(prov, latestScan)}
 </span>
 </div>
 <ul className="space-y-1">
 {reasons.map((reason, i) => (
 <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
 <Check className="w-3 h-3 text-brand shrink-0 mt-0.5" strokeWidth={2.5} />
 <span className="leading-relaxed">{reason}</span>
 </li>
 ))}
 </ul>
 </div>
 </motion.div>
 );
 })
 )}
 </div>

 {/* Right panel: Live interactive OpenStreetMap via Leaflet container */}
 <div className={`w-full md:w-1/2 h-full bg-muted relative ${
 mobileViewMode === 'map' ? 'block' : 'hidden md:block'
 }`}>
 <div ref={mapContainerRef} className="w-full h-full z-0" />

 {/* Business detail panel — appears when a marker or card is selected */}
 <AnimatePresence>
 {selectedProvider && (
 <motion.div
 initial={{ opacity: 0, y: 24 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: 24 }}
 transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
 className="absolute bottom-5 left-5 right-5 bg-card/98 backdrop-blur-md border border-border shadow-[var(--elevation-floating)] z-10 overflow-hidden"
 >
 <div className="flex gap-4 p-5">
 {selectedProvider.image ? (
 <img
 referrerPolicy="no-referrer"
 src={selectedProvider.image}
 className="w-20 h-20 object-cover shrink-0"
 alt={`Photo provided for ${selectedProvider.name}`}
 />
 ) : (
 <div className="w-20 h-20 shrink-0 bg-muted flex items-center justify-center text-muted-foreground/50" aria-label="No provider photo available">
 <ShoppingBag className="w-6 h-6" />
 </div>
 )}
 <div className="flex-1 min-w-0">
 <div className="flex items-start justify-between gap-3">
 <div className="min-w-0">
 <div className="flex items-center gap-2 mb-1">
 <span className="text-xs font-semibold text-brand px-2 py-0.5 bg-brand/10 rounded">
 {matchLabel(selectedProvider, latestScan)}
 </span>
 </div>
 <h4 className="font-semibold text-base tracking-tight truncate">{selectedProvider.name}</h4>
 <p className="text-xs text-muted-foreground flex items-start gap-1 mt-1">
 <MapPin className="w-3.5 h-3.5 shrink-0 text-brand mt-0.5" /> <span className="break-words" title={selectedProvider.address}>{selectedProvider.address}</span>
 </p>
 </div>
 <div className="text-right shrink-0">
 <span className="flex items-center justify-end gap-1 text-sm font-medium">
 <Star className="w-3.5 h-3.5 fill-warning text-warning" /> {selectedProvider.rating}
 </span>
 <span className="text-xs text-muted-foreground block mt-0.5">
 About {selectedProvider.distance.toFixed(1)} mi away
 {selectedProvider.durationMinutes !== null && selectedProvider.durationMinutes !== undefined
 ? ` · about ${selectedProvider.durationMinutes} min by car`
 : ""}
 </span>
 </div>
 </div>

 <div className="flex gap-2 mt-3">
 {selectedProvider.phone && (
 <a
 href={`tel:${selectedProvider.phone}`}
 className="flex-1 flex items-center justify-center gap-1.5 h-9 bg-foreground text-background text-xs font-medium hover:brightness-110 active:scale-[0.98] transition-all"
 >
 <Phone className="w-3.5 h-3.5" /> Call
 </a>
 )}
 <a
 href={`https://www.google.com/maps/dir/?api=1&destination=${selectedProvider.lat},${selectedProvider.lng}`}
 target="_blank"
 rel="noopener noreferrer"
 className="flex-1 flex items-center justify-center gap-1.5 h-9 border border-border text-xs font-medium hover:bg-muted active:scale-[0.98] transition-all"
 >
 <Navigation className="w-3.5 h-3.5" /> Directions
 </a>
 {selectedProvider.website && (
 <a
 href={selectedProvider.website}
 target="_blank"
 rel="noopener noreferrer"
 className="h-9 w-9 flex items-center justify-center border border-border text-muted-foreground hover:bg-muted active:scale-[0.98] transition-all shrink-0"
 >
 <ExternalLink className="w-4 h-4" />
 </a>
 )}
 </div>
 </div>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
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
 {unavailableSavedProviderItems.length > 0 && (
 <div className="border border-warning/40 bg-warning/5 p-4 space-y-3">
 <p className="text-sm font-medium">Some saved specialist listings are no longer verified.</p>
 <p className="text-xs text-muted-foreground">
 {unavailableSavedProviderItems.length} previously saved listing{unavailableSavedProviderItems.length === 1 ? " is" : "s are"} hidden because it cannot be confirmed as a live directory result.
 </p>
 <div className="flex flex-wrap gap-2">
 {unavailableSavedProviderItems.map((item) => (
 <Button
 key={item.firestoreId}
 variant="outline"
 size="sm"
 onClick={() => handleToggleSave(item.resourceData || { id: item.resourceId }, "provider")}
 >
 Remove unverified listing
 </Button>
 ))}
 </div>
 </div>
 )}
 {savedItems.length === 0 ? (
 <div className="flex flex-col items-center justify-center text-center py-20">
 <div className="w-12 h-12 border border-border flex items-center justify-center mb-4">
 <Heart className="w-5 h-5 text-muted-foreground/50" strokeWidth={1.5} />
 </div>
 <h3 className="text-base font-semibold">No favorites yet</h3>
 <p className="text-sm text-muted-foreground max-w-xs mt-1.5">
 Save specialists and products here to review or contact them later.
 </p>
 </div>
 ) : (
 <div className="space-y-6">
 
 {/* Saved Local Specialists */}
 {savedProviderItems.length > 0 && (
 <div className="space-y-4">
 <span className="field-tag text-muted-foreground flex items-center gap-2">
 <MapPin className="w-3.5 h-3.5" /> Saved specialists
 </span>
 <div className="grid sm:grid-cols-2 gap-px bg-border border border-border">
 {savedProviderItems
 .map(item => {
 const prov = item.resourceData;
 return (
 <div key={item.firestoreId} className="p-5 bg-card flex flex-col justify-between gap-3">
 <div className="flex justify-between items-start gap-3">
 <h4 className="font-semibold text-sm leading-tight">{prov.name}</h4>
 <button 
 id={`unsave-prov-${item.firestoreId}`}
 onClick={() => handleToggleSave(prov, 'provider')}
 className="text-destructive hover:text-destructive/70 p-1 shrink-0"
 >
 <Heart className="w-4 h-4 fill-destructive" />
 </button>
 </div>
 <p className="text-xs text-muted-foreground line-clamp-2">{prov.specialties?.join(" • ")}</p>

 {prov.address && (
 <div className="flex items-start text-xs text-muted-foreground gap-1.5">
 <MapPin className="w-3.5 h-3.5 text-brand shrink-0 mt-0.5" />
 <span className="break-words" title={prov.address}>{prov.address}</span>
 </div>
 )}

 <div className="flex items-center justify-between text-xs pt-3 border-t border-border mt-1">
 <span className="flex items-center gap-1 font-medium">
 <Star className="w-3.5 h-3.5 fill-warning text-warning" /> {prov.rating}
 </span>
 {prov.phone && <a href={`tel:${prov.phone}`} className="text-brand font-medium flex items-center gap-1 hover:underline">
 <Phone className="w-3 h-3" /> Call
 </a>}
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
