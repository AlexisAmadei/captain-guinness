"use client";
import { useGeolocation } from "@/hooks/useGeolocation";
import { Box, Container, Stack, Badge, Heading, Text, Input, HStack, Spinner, Button, Field } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import { Place, SearchSuggestion, RetrievedFeature, haversineMeters } from "./page";

// ─── Step 1: Bar picker ──────────────────────────────────────────────────────
export function BarPicker({ onSelect }: { onSelect: (place: Place) => void; }) {
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
            .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0))
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
    [token, geoLat, geoLon]
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
                  autoFocus />
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
