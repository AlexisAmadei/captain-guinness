export const FOCUS_MAP_POINT_EVENT = "captain-guiness:focus-map-point";

export type CategoryAverages = {
  taste: number | null;
  foam: number | null;
  temperature: number | null;
  presentation: number | null;
  valueForMoney: number | null;
};

export type FocusMapPointDetail = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  averageRating: number;
  ratingCount: number;
  categoryAverages?: CategoryAverages;
};