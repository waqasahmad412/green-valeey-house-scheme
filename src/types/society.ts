export type HouseType = '3 Marla' | '5 Marla' | '10 Marla' | '1 Kanal';
export type AvailabilityStatus = 'Available' | 'Reserved' | 'Sold';
export type LightingMode = 'day' | 'night' | 'auto';
export type ActivePage =
  | 'home'
  | 'colony3d'
  | 'houses'
  | 'parks'
  | 'gym'
  | 'security'
  | 'gallery'
  | 'contact'
  | 'user-dashboard'
  | 'admin-dashboard'
  | 'not-found';

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  phone: string;
  role: 'resident' | 'admin';
  status: 'active' | 'suspended';
  favoriteHouseIds: string[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface House {
  id: string;
  houseNumber: string;
  title: string;
  houseType: HouseType;
  plotSize: HouseType;
  bedrooms: number;
  bathrooms: number;
  kitchenDetails: string;
  coveredAreaSqFt: number;
  pricePKR: number;
  availability: AvailabilityStatus;
  sector: string;
  street: string;
  description: string;
  floorPlanSummary: string;
  images: string[];
  coordinates3D?: {
    x: number;
    z: number;
    rotationY?: number;
  };
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Park {
  id: string;
  name: string;
  sector: string;
  areaSize: string;
  openingHours: string;
  description: string;
  facilities: string[];
  imageUrl: string;
  updatedAt?: unknown;
}

export interface Amenity {
  id: string;
  name: string;
  category: 'Gym' | 'Security' | 'Community' | 'Recreation';
  openingHours: string;
  description: string;
  highlights: string[];
  imageUrl: string;
  updatedAt?: unknown;
}

export interface HouseInquiry {
  id: string;
  userId: string;
  houseId: string;
  houseNumber: string;
  fullName: string;
  email: string;
  phone: string;
  message: string;
  status: 'Pending' | 'Responded' | 'Closed';
  adminResponse: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface VisitBooking {
  id: string;
  userId: string;
  houseId: string;
  houseNumber: string;
  fullName: string;
  email: string;
  phone: string;
  preferredDate: string;
  preferredTime: string;
  notes: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface GymInquiry {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  preferredPlan: 'Monthly Standard' | 'Quarterly Executive' | 'Annual Family' | 'Personal Training';
  status: 'Pending' | 'Approved' | 'Closed';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface VisitorLog {
  id: string;
  userId: string;
  visitorName: string;
  purpose: string;
  houseNumber: string;
  entryTime: string;
  exitTime: string;
  status: 'Pre-Registered' | 'Checked-In' | 'Checked-Out';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Announcement {
  id: string;
  title: string;
  category: 'Security' | 'Community' | 'Maintenance' | 'Event';
  content: string;
  priority: 'Normal' | 'High' | 'Urgent';
  publishedDate: string;
  createdAt?: unknown;
}

export interface GalleryItem {
  id: string;
  title: string;
  category:
    | 'Modern Houses'
    | 'Society Entrance'
    | 'Roads'
    | 'Parks'
    | 'Gardens'
    | 'Gym'
    | 'Security'
    | 'Night View'
    | 'Community Facilities';
  caption: string;
  imageUrl: string;
  createdAt?: unknown;
}

export interface ContactMessage {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: 'Unread' | 'Responded' | 'Archived';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface SocietySettings {
  id: string;
  heroHeading: string;
  heroDescription: string;
  totalHouses: number;
  availableHouses: number;
  totalParks: number;
  gymFacilitiesCount: number;
  securityCheckpoints: number;
  communityFacilities: number;
  officeAddress: string;
  contactPhone: string;
  contactEmail: string;
  emergencyPhone: string;
  mapCoordinatesConfigured: boolean;
  mapSectorNote: string;
  updatedAt?: unknown;
}
