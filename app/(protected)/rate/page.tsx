"use client";

import { useState } from "react";
import { BarPicker } from "./BarPicker";
import { RatingForm } from "./RatingForm";

export type RatingCriteria = {
  overall: number;
  taste: number;
  foam: number;
  creamy: number;
  temperature: number;
  presentation: number;
  valueForMoney: number;
};

export type Place = {
  id: string;
  name: string;
  type: string;
  lat: number;
  lon: number;
  distance?: number;
};

export function isValidOptionalRating(value: number) {
  if (value === 0) return true;
  if (value < 1 || value > 5) return false;
  return Number.isInteger(value * 2);
}

export async function getResponseErrorMessage(response: Response, fallbackMessage: string) {
  try {
    const payload = await response.json();
    if (payload && typeof payload.error === "string" && payload.error.trim().length > 0) {
      return payload.error;
    }
  } catch {
    return fallbackMessage;
  }
  return fallbackMessage;
}

export function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Mapbox Search Box API types ─────────────────────────────────────────────

export type SearchSuggestion = {
  mapbox_id: string;
  name: string;
  place_formatted?: string;
  poi_category?: string[];
};

export type RetrievedFeature = {
  properties: {
    mapbox_id: string;
    name: string;
    poi_category?: string[];
    coordinates: { latitude: number; longitude: number };
  };
};

export default function RatePage() {
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  if (selectedPlace) {
    return <RatingForm place={selectedPlace} />;
  }

  return <BarPicker onSelect={setSelectedPlace} />;
}
