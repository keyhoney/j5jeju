export interface ExternalLinks {
  naverMap?: string;
  kakaoMap?: string;
}

export interface RouteNote {
  distance?: string;
  estimatedTime?: string;
}

export interface PlaceLocation {
  lat: number;
  lng: number;
}

export interface Place {
  id: string;
  name: string;
  memo?: string;
  cost?: number;
  actualCost?: number;
  category?: "meal" | "transport" | "ticket" | "cafe" | "etc";
  order: number;
  location: PlaceLocation;
  tags?: string[];
  checklist?: string[];
  sharedNote?: string;
  externalLinks?: ExternalLinks;
  routeNote?: RouteNote;
}

export interface Day {
  id: string;
  dayNumber: number;
  date: string;
}

export interface Trip {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  totalBudget?: number;
  ownerId: string;
}

export interface NewPlace extends Omit<Place, "id"> {}
export interface NewTrip extends Omit<Trip, "id"> {}
