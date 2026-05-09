"use client";

import {
  Badge,
  Box,
  Button,
  Container,
  Field,
  Heading,
  HStack,
  Input,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { type SyntheticEvent, useCallback, useEffect, useRef, useState } from "react";
import { PhotoCapture } from "@/components/PhotoCapture";
import { StarRating } from "@/components/StarRating";
import { compressImage } from "@/lib/compression";
import { useGeolocation } from "@/hooks/useGeolocation";

type RatingCriteria = {
  overall: number;
  taste: number;
  foam: number;
  creamy: number;
  temperature: number;
  presentation: number;
  valueForMoney: number;
};

type Place = {
  id: string;
  name: string;
  type: string;
  lat: number;
  lon: number;
  distance?: number;
};

function isValidOptionalRating(value: number) {
  if (value === 0) return true;
  if (value < 1 || value > 5) return false;
  return Number.isInteger(value * 2);
}

async function getResponseErrorMessage(response: Response, fallbackMessage: string) {
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

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function InfoCard({
  title,
  description,
  children,
}: Readonly<{ title: string; description: string; children: React.ReactNode }>) {
  return (
    <Box
      borderRadius="lg"
      borderWidth="1px"
      borderColor="app.border"
      bg="app.surface"
      backdropFilter="blur(18px)"
      shadow="soft"
      p={{ base: 5, md: 6 }}
    >
      <Stack gap={4}>
        <Box>
          <Heading as="h2" size="md" color="app.fg" mb={1}>
            {title}
          </Heading>
          <Text fontSize="sm" color="app.muted">
            {description}
          </Text>
        </Box>
        {children}
      </Stack>
    </Box>
  );
}

// ─── Mapbox Search Box API types ─────────────────────────────────────────────

type SearchSuggestion = {
  mapbox_id: string;
  name: string;
  place_formatted?: string;
  poi_category?: string[];
};

type RetrievedFeature = {
  properties: {
    mapbox_id: string;
    name: string;
    poi_category?: string[];
    coordinates: { latitude: number; longitude: number };
  };
};

// ─── Step 1: Bar picker ──────────────────────────────────────────────────────

function BarPicker({ onSelect }: { onSelect: (place: Place) => void }) {
  const router = useRouter();
  const { latitude, longitude, loading: geoLoading, error: geoError } = useGeolocation();

  const [query, setQuery] = useState("");
  // Suggestions from /suggest (name only, no coords yet)
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [nearbyPlaces, setNearbyPlaces] = useState<Place[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [retrieving, setRetrieving] = useState<string | null>(null);
  const [retrieveError, setRetrieveError] = useState<string | null>(null);

  // One session token per BarPicker mount — refreshed on each new search session
  const sessionTokenRef = useRef<string>(crypto.randomUUID());
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const geoLat = typeof latitude === "number" && Number.isFinite(latitude) ? latitude : null;
  const geoLon = typeof longitude === "number" && Number.isFinite(longitude) ? longitude : null;

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "";

  // /category — fetch nearby bars once location resolves (per-request billing, no session token needed)
  useEffect(() => {
    if (!geoLat || !geoLon || !token) return;

    const fetchNearby = async () => {
      setLoadingNearby(true);
      try {
        const url = new URL("https://api.mapbox.com/search/searchbox/v1/category/bar,pub,nightlife");
        url.searchParams.set("proximity", `${geoLon},${geoLat}`);
        url.searchParams.set("limit", "10");
        url.searchParams.set("language", "fr");
        url.searchParams.set("access_token", token);

        const res = await fetch(url.toString());
        if (!res.ok) return;

        const data = await res.json();
        const features: RetrievedFeature[] = Array.isArray(data.features) ? data.features : [];

        setNearbyPlaces(
          features
            .filter((f) => f.properties.coordinates)
            .map((f) => {
              const { latitude: lat, longitude: lon } = f.properties.coordinates;
              return {
                id: `mapbox:${f.properties.mapbox_id}`,
                name: f.properties.name,
                type: f.properties.poi_category?.[0] ?? "bar",
                lat,
                lon,
                distance: haversineMeters(geoLat, geoLon, lat, lon),
              };
            })
            .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0)),
        );
      } finally {
        setLoadingNearby(false);
      }
    };

    fetchNearby();
  }, [geoLat, geoLon, token]);

  // /suggest — debounced autocomplete (session-billed)
  const runSuggest = useCallback(
    async (q: string) => {
      if (!token || q.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      setLoadingSearch(true);
      try {
        const url = new URL("https://api.mapbox.com/search/searchbox/v1/suggest");
        url.searchParams.set("q", q);
        url.searchParams.set("types", "poi");
        url.searchParams.set("poi_category", "bar,pub,nightlife,restaurant,cafe");
        url.searchParams.set("limit", "8");
        url.searchParams.set("language", "fr");
        url.searchParams.set("session_token", sessionTokenRef.current);
        if (geoLat && geoLon) url.searchParams.set("proximity", `${geoLon},${geoLat}`);
        url.searchParams.set("access_token", token);

        const res = await fetch(url.toString());
        if (!res.ok) { setSuggestions([]); return; }

        const data = await res.json();
        setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
      } finally {
        setLoadingSearch(false);
      }
    },
    [token, geoLat, geoLon],
  );

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (query.trim().length < 2) {
      setSuggestions([]);
      setLoadingSearch(false);
      return;
    }
    searchDebounceRef.current = setTimeout(() => runSuggest(query), 350);
    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); };
  }, [query, runSuggest]);

  // /retrieve — called only when user clicks a suggestion (ends the session)
  const handleSuggestionSelect = async (s: SearchSuggestion) => {
    if (!token) return;
    setRetrieving(s.mapbox_id);
    setRetrieveError(null);
    try {
      const url = new URL(`https://api.mapbox.com/search/searchbox/v1/retrieve/${s.mapbox_id}`);
      url.searchParams.set("session_token", sessionTokenRef.current);
      url.searchParams.set("access_token", token);

      const res = await fetch(url.toString());
      if (!res.ok) {
        setRetrieveError("Could not load bar details. Please try again.");
        return;
      }

      const data = await res.json();
      const feat: RetrievedFeature | undefined = data.features?.[0];
      if (!feat?.properties.coordinates) {
        setRetrieveError("No location data for this bar. Try a different result.");
        return;
      }

      const { latitude: lat, longitude: lon } = feat.properties.coordinates;

      // Session is now complete — rotate the token for the next search
      sessionTokenRef.current = crypto.randomUUID();

      onSelect({
        id: `mapbox:${feat.properties.mapbox_id}`,
        name: feat.properties.name,
        type: feat.properties.poi_category?.[0] ?? "bar",
        lat,
        lon,
        distance: geoLat && geoLon ? haversineMeters(geoLat, geoLon, lat, lon) : undefined,
      });
    } finally {
      setRetrieving(null);
    }
  };

  const showSearch = query.trim().length >= 2;

  return (
    <Box position="relative" overflow="hidden">
      <Container maxW="container.sm" py={{ base: 6, md: 10 }} position="relative">
        <Stack gap={6}>
          <Box
            borderRadius={'lg'}
            borderWidth="1px"
            borderColor="app.border"
            bg="app.surface"
            backdropFilter="blur(18px)"
            shadow="soft"
            p={{ base: 5, md: 6 }}
          >
            <Stack gap={3}>
              <Badge alignSelf="start" bg="brand.800" color={'white'} rounded="full" px={3} py={1}>
                Step 1 of 2
              </Badge>
              <Heading as="h1" size="xl" color="app.fg">
                Choose a bar
              </Heading>
              <Text color="app.muted">
                Search by name or pick one nearby. Your review will be tied to this venue.
              </Text>
            </Stack>
          </Box>

          <Box
            borderRadius={'lg'}
            borderWidth="1px"
            borderColor="app.border"
            bg="app.surface"
            backdropFilter="blur(18px)"
            shadow="soft"
            p={{ base: 5, md: 6 }}
          >
            <Stack gap={4}>
              <Field.Root>
                <Field.Label>Search a bar or pub</Field.Label>
                <Input
                  placeholder="Ex: Le Vieux Port, The Crown…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  bg="app.surfaceSolid"
                  borderColor="app.border"
                  autoFocus
                />
              </Field.Root>

              {/* Section label */}
              <Text fontSize="xs" fontWeight="semibold" color="app.muted" textTransform="uppercase" letterSpacing="wide">
                {showSearch
                  ? "Search results"
                  : geoLoading
                    ? "Detecting location…"
                    : geoLat
                      ? "Nearby bars"
                      : geoError
                        ? "Location unavailable"
                        : "Enable location to see nearby bars"}
              </Text>

              {/* Retrieve error */}
              {retrieveError && (
                <Text fontSize="sm" color="red.500">{retrieveError}</Text>
              )}

              {/* Geolocation error */}
              {!showSearch && !geoLoading && geoError && (
                <Text fontSize="sm" color="app.muted">{geoError}</Text>
              )}

              {/* Loading states */}
              {(showSearch ? loadingSearch : loadingNearby) && (
                <HStack>
                  <Spinner size="sm" color="brand.500" />
                  <Text fontSize="sm" color="app.muted">
                    {showSearch ? "Searching…" : "Loading nearby bars…"}
                  </Text>
                </HStack>
              )}

              {/* Empty states */}
              {!loadingSearch && showSearch && suggestions.length === 0 && query.trim().length >= 2 && (
                <Text fontSize="sm" color="app.muted">No results for &ldquo;{query}&rdquo;.</Text>
              )}
              {!loadingNearby && !showSearch && nearbyPlaces.length === 0 && geoLat && (
                <Text fontSize="sm" color="app.muted">No bars found nearby.</Text>
              )}

              {/* Search suggestions (name + subtitle only — coords come on retrieve) */}
              {showSearch && suggestions.length > 0 && (
                <Stack gap={2}>
                  {suggestions.map((s) => (
                    <Button
                      key={s.mapbox_id}
                      variant="outline"
                      justifyContent="flex-start"
                      borderColor="app.border"
                      bg="app.surfaceSolid"
                      h="auto"
                      py={3}
                      px={4}
                      onClick={() => handleSuggestionSelect(s)}
                      loading={retrieving === s.mapbox_id}
                      disabled={retrieving !== null}
                    >
                      <Stack gap={0} align="start" flex={1} minW={0}>
                        <Text fontWeight="semibold" textAlign="left" truncate>
                          {s.name}
                        </Text>
                        {s.place_formatted && (
                          <Text fontSize="xs" color="app.muted" textAlign="left" truncate>
                            {s.place_formatted}
                          </Text>
                        )}
                      </Stack>
                    </Button>
                  ))}
                </Stack>
              )}

              {/* Nearby places (coords already available from /category) */}
              {!showSearch && nearbyPlaces.length > 0 && (
                <Stack gap={2}>
                  {nearbyPlaces.map((place) => (
                    <Button
                      key={place.id}
                      variant="outline"
                      // bg="red"
                      justifyContent="space-between"
                      borderColor="app.border"
                      // bg="app.surfaceSolid"
                      h="auto"
                      py={3}
                      px={4}
                      onClick={() => onSelect(place)}
                    >
                      <Stack gap={0} align="start" flex={1} minW={0}>
                        <Text fontWeight="semibold" textAlign="left" truncate>
                          {place.name}
                        </Text>
                        <Text fontSize="xs" color="app.muted" textTransform="capitalize">
                          {place.type}
                        </Text>
                      </Stack>
                      {place.distance !== undefined && (
                        <Text fontSize="xs" color="app.muted" flexShrink={0} ml={2}>
                          {Math.round(place.distance)}m
                        </Text>
                      )}
                    </Button>
                  ))}
                </Stack>
              )}
            </Stack>
          </Box>

          <Button
            variant="outline"
            onClick={() => router.back()}
            borderColor="app.border"
            bg="app.surface"
          >
            Cancel
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}

// ─── Step 2: Rating form ─────────────────────────────────────────────────────

function RatingForm({ place }: { place: Place }) {
  const router = useRouter();

  const [criteria, setCriteria] = useState<RatingCriteria>({
    overall: 0,
    taste: 0,
    foam: 0,
    creamy: 0,
    temperature: 0,
    presentation: 0,
    valueForMoney: 0,
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [pintPrice, setPintPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (criteria.overall === 0) {
      setError("Overall rating is required");
      return;
    }

    if (!Number.isInteger(criteria.overall * 2)) {
      setError("Overall rating must use half-star increments");
      return;
    }

    const optionalCriteria = [
      criteria.taste,
      criteria.foam,
      criteria.creamy,
      criteria.temperature,
      criteria.presentation,
      criteria.valueForMoney,
    ];

    if (!optionalCriteria.every(isValidOptionalRating)) {
      setError("Optional criteria must be empty or between 1 and 5 in 0.5 steps");
      return;
    }

    const parsedPrice = pintPrice.trim() === "" ? null : Number(pintPrice);
    if (parsedPrice !== null && (!Number.isFinite(parsedPrice) || parsedPrice < 0)) {
      setError("Pint price must be a positive number");
      return;
    }

    setLoading(true);

    try {
      let imageUrl: string | null = null;

      if (photoFile) {
        const compressedPhoto = await compressImage(photoFile);
        const formData = new FormData();
        formData.append("file", compressedPhoto);
        formData.append("latitude", String(place.lat));
        formData.append("longitude", String(place.lon));

        const uploadResponse = await fetch("/api/upload", { method: "POST", body: formData });
        if (!uploadResponse.ok) {
          throw new Error(await getResponseErrorMessage(uploadResponse, "Failed to upload image"));
        }

        const uploadData = await uploadResponse.json();
        if (!uploadData || typeof uploadData.url !== "string" || uploadData.url.trim().length === 0) {
          throw new Error("Upload response is missing the image URL");
        }

        imageUrl = uploadData.url;
      }

      const ratingResponse = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          overallRating: criteria.overall,
          tasteRating: criteria.taste || null,
          foamRating: criteria.foam || null,
          creamyRating: criteria.creamy || null,
          temperatureRating: criteria.temperature || null,
          presentationRating: criteria.presentation || null,
          valueForMoneyRating: criteria.valueForMoney || null,
          barName: place.name,
          comment: null,
          pintPrice: parsedPrice,
          ratedAt: new Date().toISOString(),
          photoUrl: imageUrl,
          latitude: place.lat,
          longitude: place.lon,
          placeId: place.id,
        }),
      });

      if (!ratingResponse.ok) {
        throw new Error(await getResponseErrorMessage(ratingResponse, "Failed to submit rating"));
      }

      router.push("/");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box position="relative" overflow="hidden">
      <Box
        position="absolute"
        inset={0}
        pointerEvents="none"
        background="radial-gradient(circle at 12% 12%, rgba(255,255,255,0.72), transparent 30%), radial-gradient(circle at 88% 18%, rgba(224, 143, 30, 0.14), transparent 28%)"
      />
      <Container maxW="container.lg" py={{ base: 6, md: 10 }} position="relative">
        <Stack gap={6}>
          {/* Header */}
          <Box
            borderRadius={'lg'}
            borderWidth="1px"
            borderColor="app.border"
            bg="app.surface"
            backdropFilter="blur(18px)"
            shadow="soft"
            p={{ base: 5, md: 6 }}
          >
            <Stack gap={3}>
              <Badge alignSelf="start" bg="brand.800" color={'white'} rounded="full" px={3} py={1}>
                Step 2 of 2
              </Badge>
              <Heading as="h1" size="xl" color="app.fg">
                Rate your pint
              </Heading>
              <HStack gap={2} align="center">
                <Text fontSize="sm" color="app.muted">
                  at
                </Text>
                <Badge bg="harp.500" color={'white'} variant="subtle" fontSize="sm" px={3} py={1} rounded="full">
                  {place.name}
                </Badge>
              </HStack>
            </Stack>
          </Box>

          {error && (
            <Box bg="rgba(194, 59, 57, 0.08)" p={4} borderRadius="lg" borderWidth="1px" borderColor="app.danger">
              <Text color="app.danger">{error}</Text>
            </Box>
          )}

          <form onSubmit={handleSubmit}>
            <Stack gap={6}>
              {/* Price */}
              <Box
                borderRadius={'lg'}
                borderWidth="1px"
                borderColor="app.border"
                bg="app.surface"
                backdropFilter="blur(18px)"
                shadow="soft"
                p={{ base: 5, md: 6 }}
              >
                <Field.Root>
                  <Field.Label>Prix de la pinte</Field.Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    placeholder="Ex: 7.50"
                    value={pintPrice}
                    onChange={(event) => setPintPrice(event.target.value)}
                    bg="app.surfaceSolid"
                    borderColor="app.border"
                  />
                </Field.Root>
              </Box>

              {/* Ratings */}
              <InfoCard
                title="Rating"
                description="Keep the detailed scores empty if you only want to leave the overall rating."
              >
                <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                  {(
                    [
                      ["Goût", "taste"],
                      ["Mousse", "foam"],
                      ["Crémeuse", "creamy"],
                      ["Température", "temperature"],
                      ["Présentation", "presentation"],
                      ["Rapport qualité/prix", "valueForMoney"],
                    ] as const
                  ).map(([label, key]) => (
                    <Box key={key} borderRadius="lg" borderWidth="1px" borderColor="app.border" bg="app.surfaceSolid" p={4}>
                      <Field.Root>
                        <Field.Label>{label}</Field.Label>
                        <StarRating
                          value={criteria[key]}
                          onChange={(value) => setCriteria((prev) => ({ ...prev, [key]: value }))}
                        />
                      </Field.Root>
                    </Box>
                  ))}
                </SimpleGrid>

                <Box borderRadius={'lg'} borderWidth="1px" borderColor="app.border" bg="app.surfaceSolid" p={4}>
                  <Field.Root required>
                    <Field.Label>
                      Note générale <Field.RequiredIndicator />
                    </Field.Label>
                    <StarRating
                      value={criteria.overall}
                      onChange={(value) => setCriteria((prev) => ({ ...prev, overall: value }))}
                    />
                  </Field.Root>
                </Box>
              </InfoCard>

              {/* Photo */}
              <InfoCard title="Photo" description="Add a quick visual to preserve the pour, foam, or glass details.">
                <PhotoCapture
                  onPhotoCapture={(file) => setPhotoFile(file)}
                  onClear={() => setPhotoFile(null)}
                />
              </InfoCard>

              <HStack gap={3} justify="stretch" flexWrap="wrap">
                <Button
                  flex={1}
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                  borderColor="app.border"
                  bg="app.surface"
                >
                  Back
                </Button>
                <Button flex={1} bg="stout.400" type="submit" loading={loading} disabled={loading}>
                  Submit review
                </Button>
              </HStack>
            </Stack>
          </form>
        </Stack>
      </Container>
    </Box>
  );
}

// ─── Root: orchestrates steps ─────────────────────────────────────────────────

export default function RatePage() {
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  if (selectedPlace) {
    return <RatingForm place={selectedPlace} />;
  }

  return <BarPicker onSelect={setSelectedPlace} />;
}
