"use client";

import { Box, Button, Container, Field, Heading, HStack, Input, Spinner, Stack, Text } from "@chakra-ui/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

export const dynamic = "force-dynamic";

type Place = {
  id: string;
  name: string;
  type: string;
  distance: number;
  lat: number;
  lon: number;
};

function PlaceSelectorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const latitude = parseFloat(searchParams.get("lat") || "0");
  const longitude = parseFloat(searchParams.get("lon") || "0");
  const hasValidCoords = latitude !== 0 && longitude !== 0;

  useEffect(() => {
    const fetchNearbyPlaces = async () => {
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
      if (!token) {
        setError("Map service unavailable");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const url = new URL("https://api.mapbox.com/search/searchbox/v1/category/bar,pub,restaurant,cafe,night_club");
        url.searchParams.set("proximity", `${longitude},${latitude}`);
        url.searchParams.set("limit", "25");
        url.searchParams.set("language", "fr");
        url.searchParams.set("access_token", token);

        const response = await fetch(url.toString());

        if (!response.ok) {
          throw new Error("Failed to fetch nearby places");
        }

        const data = await response.json();
        const features: Array<{
          properties: { mapbox_id: string; name: string; poi_category?: string[] };
          geometry: { coordinates: [number, number] };
        }> = Array.isArray(data.features) ? data.features : [];

        const R = 6371000;
        const nearby: Place[] = features
          .map((f) => {
            const [lon, lat] = f.geometry.coordinates;
            const dLat = ((lat - latitude) * Math.PI) / 180;
            const dLon = ((lon - longitude) * Math.PI) / 180;
            const a =
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos((latitude * Math.PI) / 180) *
                Math.cos((lat * Math.PI) / 180) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
            return {
              id: `mapbox:${f.properties.mapbox_id}`,
              name: f.properties.name,
              type: f.properties.poi_category?.[0] ?? "bar",
              lat,
              lon,
              distance: R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)),
            };
          })
          .sort((a, b) => a.distance - b.distance);

        setPlaces(nearby);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (hasValidCoords) {
      fetchNearbyPlaces();
    }
  }, [latitude, longitude, hasValidCoords]);

  const handleSubmit = async () => {
    if (!selectedPlace) {
      setError("Please select a place");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/ratings/associate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId: selectedPlace }),
      });

      if (!response.ok) {
        throw new Error("Failed to associate place with rating");
      }

      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPlaces = places.filter(
    (place) =>
      place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.type.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading) {
    return (
      <Container maxW="container.sm" py={8}>
        <Stack align="center" gap={4}>
          <Spinner size="lg" color="brand.500" />
          <Text>Finding nearby places...</Text>
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxW="container.sm" py={8}>
      <Stack gap={6}>
        <Heading as="h1" size="lg">
          Choose the place you rated
        </Heading>

        {error && (
          <Box bg="red.50" p={4} borderRadius="md" borderLeft="4px" borderColor="red.500">
            <Text color="red.700">{error}</Text>
          </Box>
        )}

        {places.length === 0 ? (
          <Box textAlign="center" py={8}>
            <Text color="app.muted">No places found nearby. You can still submit without selecting a place.</Text>
          </Box>
        ) : (
          <>
            <Field.Root>
              <Field.Label>Search places</Field.Label>
              <Input
                placeholder="Search by name or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </Field.Root>

            <Stack gap={3}>
              {filteredPlaces.map((place) => (
                <Box
                  key={place.id}
                  p={4}
                  borderWidth={2}
                  borderColor={selectedPlace === place.id ? "brand.500" : "app.border"}
                  borderRadius="md"
                  cursor="pointer"
                  onClick={() => setSelectedPlace(place.id)}
                  bg={selectedPlace === place.id ? "brand.50" : "app.surfaceSolid"}
                  _hover={{ borderColor: "brand.400" }}
                >
                  <Text fontWeight="bold">{place.name}</Text>
                  <Text fontSize="sm" color="app.muted">
                    {place.type} · {Math.round(place.distance)}m away
                  </Text>
                </Box>
              ))}
            </Stack>
          </>
        )}

        <HStack gap={3} pt={4}>
          <Button flex={1} variant="outline" onClick={() => router.back()} disabled={submitting}>
            Back
          </Button>
          <Button
            flex={1}
            colorScheme="blue"
            onClick={handleSubmit}
            loading={submitting}
            disabled={submitting || (!selectedPlace && places.length > 0)}
          >
            Confirm Place
          </Button>
        </HStack>
      </Stack>
    </Container>
  );
}

export default function PlaceSelectorPage() {
  return (
    <Suspense
      fallback={
        <Container maxW="container.sm" py={8}>
          <Stack align="center" gap={4}>
            <Spinner size="lg" color="brand.500" />
            <Text>Loading...</Text>
          </Stack>
        </Container>
      }
    >
      <PlaceSelectorContent />
    </Suspense>
  );
}
