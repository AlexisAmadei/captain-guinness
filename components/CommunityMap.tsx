"use client";

import { Box, Button, HStack, Spinner, Stack, Text } from "@chakra-ui/react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Drawer } from "vaul";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Scope = "all" | "mine";

type MapPoint = {
  id: string;
  placeId: string | null;
  name: string;
  latitude: number;
  longitude: number;
  averageRating: number;
  ratingCount: number;
  lastRatedAt: string | null;
};

type MapApiResponse = {
  points: MapPoint[];
  scope: Scope;
  isAuthenticated: boolean;
  error?: string;
};

type GeoFeatureProperties = {
  id: string;
  placeId: string | null;
  name: string;
  averageRating: number;
  ratingCount: number;
  lastRatedAt: string | null;
};

const SOURCE_ID = "community-ratings";
const CLUSTER_LAYER_ID = "clusters";
const CLUSTER_COUNT_LAYER_ID = "cluster-count";
const POINT_LAYER_ID = "unclustered-point";

const DEFAULT_CENTER: [number, number] = [2.3522, 48.8566];
const DEFAULT_ZOOM = 11;

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function pointsToGeoJson(points: MapPoint): GeoJSON.Feature<GeoJSON.Point, GeoFeatureProperties>;
function pointsToGeoJson(points: MapPoint[]): GeoJSON.FeatureCollection<GeoJSON.Point, GeoFeatureProperties>;
function pointsToGeoJson(points: MapPoint | MapPoint[]) {
  if (!Array.isArray(points)) {
    return {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [points.longitude, points.latitude],
      },
      properties: {
        id: points.id,
        placeId: points.placeId,
        name: points.name,
        averageRating: points.averageRating,
        ratingCount: points.ratingCount,
        lastRatedAt: points.lastRatedAt,
      },
    };
  }

  return {
    type: "FeatureCollection",
    features: points.map((point) => pointsToGeoJson(point)),
  };
}

export function CommunityMap() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const [scope, setScope] = useState<Scope>("all");
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isRecentering, setIsRecentering] = useState(false);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  const mapStyleUrl = useMemo(() => {
    return "mapbox://styles/mapbox/streets-v12";
  }, []);

  const loadMapData = useCallback(async (nextScope: Scope) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/ratings/map?scope=${nextScope}`);
      const payload: MapApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Impossible de charger la carte");
      }

      setPoints(payload.points || []);
      setIsAuthenticated(payload.isAuthenticated);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Erreur inconnue");
      setPoints([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMapData(scope);
  }, [scope, loadMapData]);

  useEffect(() => {
    if (!mapboxToken) {
      setError("Clé Mapbox manquante");
      return;
    }

    let removed = false;

    const initializeMap = () => {
      if (!mapContainerRef.current || mapRef.current) return;

      const map = new mapboxgl.Map({
        accessToken: mapboxToken,
        container: mapContainerRef.current,
        style: mapStyleUrl,
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
      });

      mapRef.current = map;
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

      map.on("load", () => {
        if (removed) return;

        map.addSource(SOURCE_ID, {
          type: "geojson",
          data: pointsToGeoJson([]),
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 48,
        });

        map.addLayer({
          id: CLUSTER_LAYER_ID,
          type: "circle",
          source: SOURCE_ID,
          filter: ["has", "point_count"],
          paint: {
            "circle-color": "#2563eb",
            "circle-radius": ["step", ["get", "point_count"], 18, 15, 22, 40, 28],
            "circle-opacity": 0.8,
          },
        });

        map.addLayer({
          id: CLUSTER_COUNT_LAYER_ID,
          type: "symbol",
          source: SOURCE_ID,
          filter: ["has", "point_count"],
          layout: {
            "text-field": ["get", "point_count_abbreviated"],
            "text-size": 12,
          },
          paint: {
            "text-color": "#ffffff",
          },
        });

        map.addLayer({
          id: POINT_LAYER_ID,
          type: "circle",
          source: SOURCE_ID,
          filter: ["!", ["has", "point_count"]],
          paint: {
            "circle-color": [
              "step",
              ["get", "averageRating"],
              "#dc2626",
              2,
              "#f97316",
              3,
              "#facc15",
              4,
              "#16a34a",
            ],
            "circle-radius": ["interpolate", ["linear"], ["get", "ratingCount"], 1, 7, 20, 14],
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          },
        });

        map.on("click", CLUSTER_LAYER_ID, async (event) => {
          const feature = event.features?.[0];
          if (!feature) return;

          const clusterId = feature.properties?.cluster_id;
          if (typeof clusterId !== "number") return;

          const source = map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource;
          const zoom = await new Promise<number>((resolve, reject) => {
            source.getClusterExpansionZoom(clusterId, (expansionError, expansionZoom) => {
              if (expansionError || typeof expansionZoom !== "number") {
                reject(expansionError ?? new Error("Unable to expand cluster"));
                return;
              }
              resolve(expansionZoom);
            });
          });
          if (!feature.geometry || feature.geometry.type !== "Point") return;

          map.easeTo({
            center: feature.geometry.coordinates as [number, number],
            zoom,
          });
        });

        map.on("click", POINT_LAYER_ID, (event) => {
          const feature = event.features?.[0];
          if (!feature || !feature.properties || feature.geometry.type !== "Point") return;

          const properties = feature.properties as GeoFeatureProperties;
          const point: MapPoint = {
            id: String(properties.id),
            placeId: properties.placeId ? String(properties.placeId) : null,
            name: String(properties.name ?? "Lieu"),
            latitude: feature.geometry.coordinates[1],
            longitude: feature.geometry.coordinates[0],
            averageRating: Number(properties.averageRating),
            ratingCount: Number(properties.ratingCount),
            lastRatedAt: properties.lastRatedAt ? String(properties.lastRatedAt) : null,
          };

          setSelectedPoint(point);
          setIsDrawerOpen(true);
        });

        map.on("mouseenter", POINT_LAYER_ID, () => {
          map.getCanvas().style.cursor = "pointer";
        });

        map.on("mouseleave", POINT_LAYER_ID, () => {
          map.getCanvas().style.cursor = "";
        });
      });
    };

    initializeMap();

    return () => {
      removed = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [mapboxToken, mapStyleUrl]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getSource(SOURCE_ID)) return;

    const source = map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource;
    source.setData(pointsToGeoJson(points));
  }, [points]);

  const handleRecenter = useCallback(() => {
    const map = mapRef.current;
    if (!map || !navigator.geolocation) {
      setError("La géolocalisation n'est pas disponible sur ce navigateur");
      return;
    }

    setIsRecentering(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        map.flyTo({
          center: [coords.longitude, coords.latitude],
          zoom: 14,
          essential: true,
        });
        setIsRecentering(false);
      },
      () => {
        setError("Impossible de récupérer votre position");
        setIsRecentering(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  return (
    <Stack gap={3} h="full" px={3} py={3}>
      <HStack justify="space-between" align="center">
        <Text fontWeight="semibold">Carte communautaire</Text>
        {isAuthenticated && (
          <HStack gap={2}>
            <Button
              size="sm"
              variant={scope === "mine" ? "solid" : "outline"}
              colorPalette="brand"
              onClick={() => setScope("mine")}
            >
              Mes notes
            </Button>
            <Button
              size="sm"
              variant={scope === "all" ? "solid" : "outline"}
              colorPalette="brand"
              onClick={() => setScope("all")}
            >
              Toutes les notes
            </Button>
          </HStack>
        )}
      </HStack>

      {error && (
        <Box bg="red.50" p={3} borderRadius="md" borderLeft="4px" borderColor="red.500">
          <Text color="red.700" fontSize="sm">
            {error}
          </Text>
        </Box>
      )}

      <Box position="relative" flex={1} minH="22rem" borderRadius="lg" overflow="hidden" borderWidth={1}>
        <Box ref={mapContainerRef} h="full" w="full" />

        <Button
          position="absolute"
          top={3}
          left={3}
          size="sm"
          colorPalette="brand"
          onClick={handleRecenter}
          loading={isRecentering}
        >
          Me recentrer
        </Button>

        {loading && (
          <Stack
            position="absolute"
            inset={0}
            align="center"
            justify="center"
            bg="blackAlpha.300"
            color="white"
          >
            <Spinner size="lg" />
            <Text fontSize="sm">Chargement des notes...</Text>
          </Stack>
        )}
      </Box>

      <Drawer.Root open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <Drawer.Portal>
          <Drawer.Overlay
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0, 0, 0, 0.5)",
              zIndex: 40,
            }}
          />
          <Drawer.Content
            style={{
              position: "fixed",
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 50,
              background: "#fdf8f0",
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              padding: 16,
              minHeight: 140,
            }}
          >
            <Stack gap={2}>
              <Drawer.Handle
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 999,
                  background: "#c9a87a",
                  alignSelf: "center",
                }}
              />
              <Text fontWeight="bold">{selectedPoint?.name ?? "Lieu"}</Text>
              <Text fontSize="sm" color="app.muted">
                Note moyenne: {selectedPoint ? selectedPoint.averageRating.toFixed(2) : "—"} / 5
              </Text>
              <Text fontSize="sm" color="app.muted">
                Nombre de notes: {selectedPoint?.ratingCount ?? 0}
              </Text>
              <Text fontSize="sm" color="app.muted">
                Dernière note: {formatDate(selectedPoint?.lastRatedAt ?? null)}
              </Text>
            </Stack>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </Stack>
  );
}
