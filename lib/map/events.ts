export const FOCUS_MAP_POINT_EVENT = "captain-guinness:focus-map-point";

export type CategoryAverages = {
  taste: number | null;
  foam: number | null;
  temperature: number | null;
  presentation: number | null;
  valueForMoney: number | null;
};

export type FocusMapPointDetail = {
  id: string;
  placeId?: string | null;
  name: string;
  latitude: number;
  longitude: number;
  averageRating: number;
  ratingCount: number;
  lastRatedAt?: string | null;
  categoryAverages?: CategoryAverages;
};