"use client";

import { Box, Spinner, Stack, Text } from "@chakra-ui/react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef, useState } from "react";

type LocationPinPickerProps = {
  latitude: number | null;
  longitude: number | null;
  onSelect: (latitude: number, longitude: number) => void;
};

const DEFAULT_CENTER: [number, number] = [2.3522, 48.8566];
const DEFAULT_ZOOM = 12;

export function LocationPinPicker({ latitude, longitude, onSelect }: LocationPinPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const onSelectRef = useRef(onSelect);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!mapboxToken) {
      setError("Map is unavailable (missing NEXT_PUBLIC_MAPBOX_TOKEN)");
      setLoading(false);
      return;
    }

    let disposed = false;

    const initializeMap = async () => {
      if (!mapContainerRef.current || mapRef.current) return;
      const center: [number, number] =
        latitude !== null && longitude !== null
          ? [longitude, latitude]
          : DEFAULT_CENTER;

      const map = new mapboxgl.Map({
        accessToken: mapboxToken,
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center,
        zoom: latitude !== null && longitude !== null ? 14 : DEFAULT_ZOOM,
      });

      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

      const emitCenterCoordinates = () => {
        const mapCenter = map.getCenter();
        onSelectRef.current(mapCenter.lat, mapCenter.lng);
      };

      map.on("load", () => {
        if (disposed) return;
        emitCenterCoordinates();
        setLoading(false);
      });

      map.on("moveend", emitCenterCoordinates);

      mapRef.current = map;
    };

    initializeMap().catch((initializationError) => {
      setError(initializationError instanceof Error ? initializationError.message : "Failed to initialize map");
      setLoading(false);
    });

    return () => {
      disposed = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [latitude, longitude]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || latitude === null || longitude === null) return;

    const mapCenter = map.getCenter();
    if (Math.abs(mapCenter.lat - latitude) < 0.000001 && Math.abs(mapCenter.lng - longitude) < 0.000001) {
      return;
    }

    map.jumpTo({ center: [longitude, latitude] });
  }, [latitude, longitude]);

  if (error) {
    return (
      <Box p={3} borderWidth={1} borderColor="red.200" bg="red.50" borderRadius="md">
        <Text fontSize="sm" color="red.700">{error}</Text>
      </Box>
    );
  }

  return (
    <Box position="relative" h="64" borderWidth={1} borderColor="app.border" borderRadius="md" overflow="hidden">
      <Box ref={mapContainerRef} h="full" w="full" />
      <Text
        position="absolute"
        top="50%"
        left="50%"
        transform="translate(-50%, -100%)"
        fontSize="2xl"
        lineHeight="1"
        pointerEvents="none"
        zIndex={1}
      >
        📍
      </Text>
      {loading && (
        <Stack position="absolute" inset={0} align="center" justify="center" bg="whiteAlpha.800">
          <Spinner size="md" color="brand.500" />
          <Text fontSize="sm" color="app.muted">Loading map...</Text>
        </Stack>
      )}
    </Box>
  );
}
