import {
  Amenity,
  Announcement,
  GalleryItem,
  House,
  Park,
  SocietySettings,
} from '../types/society';

export const GENERATED_IMAGES = {
  heroEntrance: '/src/assets/images/hero_green_valley_entrance_1790917235575.jpg',
  villaKanal: '/src/assets/images/villa_kanal_luxury_1790917248491.jpg',
  villaTenMarla: '/src/assets/images/villa_ten_marla_modern_1790917262756.jpg',
  villaFiveMarla: '/src/assets/images/villa_five_marla_elegance_1790917274911.jpg',
  parkClubhouse: '/src/assets/images/community_park_clubhouse_1790917286744.jpg',
};

export const INITIAL_SOCIETY_SETTINGS: SocietySettings = {
  id: 'global_settings',
  heroHeading: 'Your Dream Home in a Green Environment',
  heroDescription:
    'Experience modern living in a secure, beautifully designed residential community with premium homes, lush green parks, and world-class amenities.',
  totalHouses: 8,
  availableHouses: 6,
  totalParks: 3,
  gymFacilitiesCount: 4,
  securityCheckpoints: 4,
  communityFacilities: 6,
  officeAddress: 'Main Boulevard Gate 1, Green Valley Residencia Administration Office (Configurable in Admin Settings)',
  contactPhone: '03298271687',
  contactEmail: 'concierge@greenvalleyresidencia.com',
  emergencyPhone: '+92 (300) 111-4872 (24/7 Control Room)',
  mapCoordinatesConfigured: true,
  mapSectorNote: 'Master-planned gated enclave divided into Sector A (Royal Kanal), Sector B (Emerald 10 Marla), and Sector C (Boulevard 5 & 3 Marla).',
};

export const INITIAL_HOUSES: House[] = [
  {
    id: 'house_gv_101',
    houseNumber: 'GV-101',
    title: 'The Emerald Crown Residence',
    houseType: '1 Kanal',
    plotSize: '1 Kanal',
    bedrooms: 6,
    bathrooms: 7,
    kitchenDetails: 'Dual chef kitchens (dirty + display kitchen) with quartz island, built-in convection ovens, and walk-in pantry.',
    coveredAreaSqFt: 6250,
    pricePKR: 98500000,
    availability: 'Available',
    sector: 'Sector A - Royal Enclave',
    street: 'Emerald Boulevard North',
    description:
      'Flagship 1 Kanal architectural villa overlooking the central park. Features cantilevered travertine slabs, warm cedar soffits, double-height formal reception atrium, private courtyard lawn, solar net-metering readiness, and smart home lighting control.',
    floorPlanSummary:
      'Ground Floor: 3-Car Porch, Double-Height Foyer, Drawing/Dining, 2 Master Suites, Display & Service Kitchens, Servant Quarter. First Floor: 4 En-Suite Bedrooms, Family Lounge, Rooftop Terrace Pavilion.',
    images: [
      GENERATED_IMAGES.villaKanal,
      GENERATED_IMAGES.heroEntrance,
      GENERATED_IMAGES.parkClubhouse,
    ],
    coordinates3D: { x: -26, z: -18, rotationY: 0 },
  },
  {
    id: 'house_gv_102',
    houseNumber: 'GV-102',
    title: 'The Cedar Pavilion Villa',
    houseType: '1 Kanal',
    plotSize: '1 Kanal',
    bedrooms: 5,
    bathrooms: 6,
    kitchenDetails: 'Italian matte-lacquer modular kitchen with breakfast bar, integrated dishwasher, and service scullery.',
    coveredAreaSqFt: 5900,
    pricePKR: 92000000,
    availability: 'Available',
    sector: 'Sector A - Royal Enclave',
    street: 'Emerald Boulevard North',
    description:
      'Designed for multigenerational luxury living, GV-102 pairs expansive floor-to-ceiling acoustic glazing with a wrap-around botanical garden, sunken patio seating, and custom architectural outdoor illumination.',
    floorPlanSummary:
      'Ground Floor: 3-Car Garage, Formal Lounge, Dining Room, Guest Bedroom Suite, Dual Kitchens, Lawn Veranda. First Floor: 4 En-Suite Bedrooms, Study Room, Sunset Balcony.',
    images: [
      GENERATED_IMAGES.villaKanal,
      GENERATED_IMAGES.villaTenMarla,
      GENERATED_IMAGES.parkClubhouse,
    ],
    coordinates3D: { x: -10, z: -18, rotationY: 0 },
  },
  {
    id: 'house_gv_103',
    houseNumber: 'GV-103',
    title: 'Veranda Stone Residence',
    houseType: '10 Marla',
    plotSize: '10 Marla',
    bedrooms: 4,
    bathrooms: 5,
    kitchenDetails: 'Contemporary open-concept kitchen with Spanish porcelain countertops, range hood, and spice kitchen.',
    coveredAreaSqFt: 3650,
    pricePKR: 54000000,
    availability: 'Available',
    sector: 'Sector B - Park View',
    street: 'Cypress Avenue',
    description:
      'A refined 10 Marla contemporary residence featuring natural stone cladding, vertical aluminum privacy louvers, skylit staircase core, and direct pedestrian access to the Central Botanical Park.',
    floorPlanSummary:
      'Ground Floor: 2-Car Porch, Drawing Room, TV Lounge, 1 Master Bedroom, Main + Grease Kitchen. First Floor: 3 En-Suite Bedrooms, Upper Lounge, Landscaped Terrace.',
    images: [
      GENERATED_IMAGES.villaTenMarla,
      GENERATED_IMAGES.villaKanal,
      GENERATED_IMAGES.heroEntrance,
    ],
    coordinates3D: { x: 10, z: -18, rotationY: 0 },
  },
  {
    id: 'house_gv_104',
    houseNumber: 'GV-104',
    title: 'Louvered Horizon Home',
    houseType: '10 Marla',
    plotSize: '10 Marla',
    bedrooms: 4,
    bathrooms: 5,
    kitchenDetails: 'Custom walnut cabinetry, central waterfall island, and separate utility laundry alcoves.',
    coveredAreaSqFt: 3580,
    pricePKR: 51500000,
    availability: 'Reserved',
    sector: 'Sector B - Park View',
    street: 'Cypress Avenue',
    description:
      'Corner 10 Marla residence bathed in natural daylight through dual-aspect corner windows. Includes insulated cavity walls, rainwater harvesting storage, and manicured perimeter planters.',
    floorPlanSummary:
      'Ground Floor: 2-Car Porch, Formal Drawing, Family Living, 1 Bedroom, Dual Kitchen. First Floor: 3 Bedrooms with Dress & Bath, Open Barbecue Roof Deck.',
    images: [
      GENERATED_IMAGES.villaTenMarla,
      GENERATED_IMAGES.villaFiveMarla,
      GENERATED_IMAGES.parkClubhouse,
    ],
    coordinates3D: { x: 26, z: -18, rotationY: 0 },
  },
  {
    id: 'house_gv_105',
    houseNumber: 'GV-105',
    title: 'Slate & Willow Residence',
    houseType: '5 Marla',
    plotSize: '5 Marla',
    bedrooms: 3,
    bathrooms: 4,
    kitchenDetails: 'Ergonomic L-shaped modern kitchen with soft-close drawers, quartz backsplash, and ventilation ducting.',
    coveredAreaSqFt: 2150,
    pricePKR: 28500000,
    availability: 'Available',
    sector: 'Sector C - Garden Walk',
    street: 'Olive Lane South',
    description:
      'Smartly proportioned 5 Marla family residence maximizing every square foot with high ceilings, minimalist white and dark-slate exterior geometry, and warm LED wall sconces.',
    floorPlanSummary:
      'Ground Floor: 1-Car Porch, Drawing & Dining Area, Living Lounge, Kitchen, Powder Room, Master Bedroom. First Floor: 2 En-Suite Bedrooms, Terrace Sit-Out, Laundry.',
    images: [
      GENERATED_IMAGES.villaFiveMarla,
      GENERATED_IMAGES.villaTenMarla,
      GENERATED_IMAGES.heroEntrance,
    ],
    coordinates3D: { x: -26, z: 18, rotationY: Math.PI },
  },
  {
    id: 'house_gv_106',
    houseNumber: 'GV-106',
    title: 'Botanica Courtyard House',
    houseType: '5 Marla',
    plotSize: '5 Marla',
    bedrooms: 3,
    bathrooms: 4,
    kitchenDetails: 'Sleek handleless cabinetry with integrated appliance tower and natural garden window.',
    coveredAreaSqFt: 2100,
    pricePKR: 27800000,
    availability: 'Available',
    sector: 'Sector C - Garden Walk',
    street: 'Olive Lane South',
    description:
      'Situated steps away from the Wellness & Fitness Pavilion, GV-106 offers an airy open-plan ground floor, private rear ventilation courtyard, and energy-efficient double-glazed windows.',
    floorPlanSummary:
      'Ground Floor: Carport, Open Living & Dining, Kitchen, 1 Bedroom with Bath. First Floor: 2 Bedrooms with Attached Baths, Balcony, Rooftop Access.',
    images: [
      GENERATED_IMAGES.villaFiveMarla,
      GENERATED_IMAGES.parkClubhouse,
      GENERATED_IMAGES.villaKanal,
    ],
    coordinates3D: { x: -10, z: 18, rotationY: Math.PI },
  },
  {
    id: 'house_gv_107',
    houseNumber: 'GV-107',
    title: 'Verde Compact Urban Villa',
    houseType: '3 Marla',
    plotSize: '3 Marla',
    bedrooms: 3,
    bathrooms: 3,
    kitchenDetails: 'Compact designer kitchen with solid-surface counters, built-in hob, and overhead storage.',
    coveredAreaSqFt: 1450,
    pricePKR: 17500000,
    availability: 'Available',
    sector: 'Sector C - Garden Walk',
    street: 'Jasmine Crossway',
    description:
      'Ideal starter luxury home in Green Valley Residencia. Features contemporary facade articulation, dedicated bike and compact car porch, and full access to all society parks and security systems.',
    floorPlanSummary:
      'Ground Floor: Compact Porch, Living Lounge, Open Kitchen, 1 Bedroom & Bath. First Floor: 2 Bedrooms, 2 Bathrooms, Front Balcony.',
    images: [
      GENERATED_IMAGES.villaFiveMarla,
      GENERATED_IMAGES.heroEntrance,
      GENERATED_IMAGES.parkClubhouse,
    ],
    coordinates3D: { x: 10, z: 18, rotationY: Math.PI },
  },
  {
    id: 'house_gv_108',
    houseNumber: 'GV-108',
    title: 'Solstice Terrace Home',
    houseType: '3 Marla',
    plotSize: '3 Marla',
    bedrooms: 3,
    bathrooms: 3,
    kitchenDetails: 'Modern galley kitchen with breakfast counter and natural skylight ventilation.',
    coveredAreaSqFt: 1480,
    pricePKR: 18200000,
    availability: 'Sold',
    sector: 'Sector C - Garden Walk',
    street: 'Jasmine Crossway',
    description:
      'Completed and occupied 3 Marla residence showcasing Green Valley Residencia’s signature architectural lighting and low-maintenance xeriscape planter beds.',
    floorPlanSummary:
      'Ground Floor: Porch, Lounge, Kitchen, Guest Bedroom. First Floor: 2 En-Suite Bedrooms, Sunlit Terrace.',
    images: [
      GENERATED_IMAGES.villaFiveMarla,
      GENERATED_IMAGES.villaTenMarla,
      GENERATED_IMAGES.parkClubhouse,
    ],
    coordinates3D: { x: 26, z: 18, rotationY: Math.PI },
  },
];

export const INITIAL_PARKS: Park[] = [
  {
    id: 'park_emerald_central',
    name: 'Emerald Central Botanical Park',
    sector: 'Central Spine - Between Sectors A & B',
    areaSize: '18 Kanals Lush Green Landscape',
    openingHours: '05:30 AM – 11:00 PM Daily',
    description:
      'The green heart of Green Valley Residencia. Features a cushioned 1.4 km Tartan jogging and walking track, curated seasonal flower gardens, shaded pergolas, family picnic lawns, and warm bollard pathway lighting for serene evening strolls.',
    facilities: [
      '1.4 km Cushioned Walking & Jogging Track',
      'Children’s Soft-Surface Adventure Playground',
      'Botanical Rose & Jasmine Parterre Gardens',
      'Solar-Lit Evening Pathway Bollards',
      'Teakwood Family Benches & Shaded Gazebos',
      'Outdoor Callisthenics & Stretching Deck',
    ],
    imageUrl: GENERATED_IMAGES.parkClubhouse,
  },
  {
    id: 'park_jasmine_family',
    name: 'Jasmine Pocket Park & Children’s Grove',
    sector: 'Sector C - Garden Walk',
    areaSize: '6 Kanals Family Recreation Zone',
    openingHours: '06:00 AM – 10:30 PM Daily',
    description:
      'A tranquil neighborhood sanctuary tailored for young families and senior residents, complete with ergonomic seating alcoves, sensory herb planters, and a dedicated children’s play zone.',
    facilities: [
      'Dedicated Kids’ Swings & Climbing Frames',
      'Senior Citizens’ Quiet Reading Pergola',
      'reflexology Stone Footpath',
      'Automated Smart Irrigation Lawns',
      '24/7 CCTV Monitored Perimeter',
    ],
    imageUrl: GENERATED_IMAGES.heroEntrance,
  },
  {
    id: 'park_canopy_linear',
    name: 'Canopy Linear Greenway',
    sector: 'Main Boulevard East & West Spine',
    areaSize: '12 Kanals Tree-Lined Promenade',
    openingHours: 'Open 24 Hours',
    description:
      'Continuous landscaped greenbelt flanking the main residential boulevards with mature indigenous shade trees, dedicated cycling lanes, and architectural uplighting.',
    facilities: [
      'Protected Bicycle & Pedestrian Greenway',
      'Indigenous Shade Tree Canopy',
      'Ornamental Nighttime Tree Uplighting',
      'Drinking Water Filtration Stations',
    ],
    imageUrl: GENERATED_IMAGES.parkClubhouse,
  },
];

export const INITIAL_AMENITIES: Amenity[] = [
  {
    id: 'amenity_modern_gym',
    name: 'Green Valley Wellness & Fitness Club',
    category: 'Gym',
    openingHours: '06:00 AM – 11:00 PM (Mon–Sun)',
    description:
      'A glass-walled architectural fitness pavilion overlooking Emerald Central Park. Equipped with commercial-grade cardio treadmills, spin bikes, Olympic free weights, selectorized strength machines, and luxury changing suites.',
    highlights: [
      'Commercial Treadmills, Ellipticals & Spin Bikes',
      'Full Dumbbell Rack (2kg – 50kg) & Olympic Barbells',
      'Pin-Loaded Biomechanical Strength Machines',
      'Functional Turf & Core Conditioning Zone',
      'Private Lockers, Steam Shower & Changing Rooms',
      'Certified Personal Trainers Available',
    ],
    imageUrl: GENERATED_IMAGES.parkClubhouse,
  },
  {
    id: 'amenity_security_gate',
    name: 'Main Boulevard Command & Security Gate',
    category: 'Security',
    openingHours: '24/7 Active Operations',
    description:
      'Multi-tiered residential security architecture featuring RFID resident boom barriers, staffed guard cabins, ANPR license plate cameras, and digital visitor pre-registration.',
    highlights: [
      'Grand Architectural Entrance Gate with Dual Lanes',
      '24/7 Staffed Guard Cabins & Rapid Response Patrol',
      'Digital Visitor Registration & Entry/Exit Logs',
      'Perimeter Fiber-Optic Intrusion Detection',
      'Underground Backup Power for Street & Gate Lighting',
    ],
    imageUrl: GENERATED_IMAGES.heroEntrance,
  },
];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann_security_rfid',
    title: 'RFID Windshield Tag Upgrading at Gate 1 Cabin',
    category: 'Security',
    content:
      'All residents in Sector A and Sector B are invited to collect their updated fast-lane RFID vehicle tags from the Main Entrance Security Cabin between 09:00 AM and 06:00 PM.',
    priority: 'High',
    publishedDate: 'October 2026',
  },
  {
    id: 'ann_autumn_horticulture',
    title: 'Autumn Botanical Plantation Drive in Emerald Central Park',
    category: 'Community',
    content:
      'Join fellow residents this Saturday at 08:30 AM at Emerald Central Park as our horticulture team plants 250 additional native flowering trees along the walking track.',
    priority: 'Normal',
    publishedDate: 'October 2026',
  },
  {
    id: 'ann_solar_streetlights',
    title: 'Smart Dusk-to-Dawn LED Streetlight Calibration Completed',
    category: 'Maintenance',
    content:
      'All boulevard streetlights across Sectors A, B, and C have been upgraded with automated astronomical twilight sensors for seamless evening illumination.',
    priority: 'Normal',
    publishedDate: 'September 2026',
  },
];

export const INITIAL_GALLERY: GalleryItem[] = [
  {
    id: 'gal_1',
    title: 'Grand Entrance Gate & Main Boulevard',
    category: 'Society Entrance',
    caption: 'Architectural entrance portal welcoming residents with lush landscaping and dual-carriageway roads.',
    imageUrl: GENERATED_IMAGES.heroEntrance,
  },
  {
    id: 'gal_2',
    title: '1 Kanal Flagship Villa (GV-101)',
    category: 'Modern Houses',
    caption: 'Cantilevered travertine and cedar facade with double-height glazing in Sector A.',
    imageUrl: GENERATED_IMAGES.villaKanal,
  },
  {
    id: 'gal_3',
    title: '10 Marla Designer Residence (GV-103)',
    category: 'Modern Houses',
    caption: 'Natural stone cladding and architectural privacy louvers in Sector B Park View.',
    imageUrl: GENERATED_IMAGES.villaTenMarla,
  },
  {
    id: 'gal_4',
    title: '5 Marla Contemporary Home (GV-105)',
    category: 'Modern Houses',
    caption: 'Minimalist white and dark-slate geometry along tree-lined Olive Lane South.',
    imageUrl: GENERATED_IMAGES.villaFiveMarla,
  },
  {
    id: 'gal_5',
    title: 'Emerald Central Park & Fitness Pavilion',
    category: 'Parks',
    caption: 'Expansive manicured lawns, cushioned jogging track, and the glass-walled community gym.',
    imageUrl: GENERATED_IMAGES.parkClubhouse,
  },
  {
    id: 'gal_6',
    title: 'Wellness & Fitness Club Interior View',
    category: 'Gym',
    caption: 'Full cardio and strength training zones overlooking the botanical gardens.',
    imageUrl: GENERATED_IMAGES.parkClubhouse,
  },
  {
    id: 'gal_7',
    title: 'Main Boulevard & Pedestrian Walkways',
    category: 'Roads',
    caption: '40-foot to 80-foot wide carpeted roads with underground utilities and LED streetlamps.',
    imageUrl: GENERATED_IMAGES.heroEntrance,
  },
  {
    id: 'gal_8',
    title: 'Illuminated Twilight Residences',
    category: 'Night View',
    caption: 'Warm architectural exterior sconces, glowing windows, and pathway lighting after sunset.',
    imageUrl: GENERATED_IMAGES.villaKanal,
  },
  {
    id: 'gal_9',
    title: '24/7 Gated Security Checkpoint',
    category: 'Security',
    caption: 'Controlled access barrier and guard cabin monitoring all resident and visitor traffic.',
    imageUrl: GENERATED_IMAGES.heroEntrance,
  },
  {
    id: 'gal_10',
    title: 'Botanical Parterre & Family Gardens',
    category: 'Gardens',
    caption: 'Curated seasonal flora, shaded benches, and irrigated emerald turf.',
    imageUrl: GENERATED_IMAGES.parkClubhouse,
  },
  {
    id: 'gal_11',
    title: 'Resident Clubhouse & Community Hub',
    category: 'Community Facilities',
    caption: 'Dedicated gathering lounge, management concierges, and wellness amenities.',
    imageUrl: GENERATED_IMAGES.parkClubhouse,
  },
];
