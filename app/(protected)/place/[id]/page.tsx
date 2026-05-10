"use client";

import {
  Badge,
  Box,
  Button,
  Container,
  HStack,
  Image,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
} from "@chakra-ui/react";
import { FOCUS_MAP_POINT_EVENT, type FocusMapPointDetail } from "@/lib/map/events";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LuArrowLeft, LuCrosshair, LuStar } from "react-icons/lu";

type CategoryAverages = {
  taste: number | null;
  foam: number | null;
  temperature: number | null;
  presentation: number | null;
  valueForMoney: number | null;
};

type RatingItem = {
  id: string;
  rating: number;
  tasteRating: number | null;
  foamRating: number | null;
  temperatureRating: number | null;
  presentationRating: number | null;
  valueForMoneyRating: number | null;
  notes: string | null;
  photoUrl: string | null;
  pintPrice: number | null;
  createdAt: string | null;
  reviewerName: string | null;
  userId: string;
};

type PlaceDetail = {
  placeId: string;
  name: string;
  averageRating: number;
  ratingCount: number;
  latitude: number;
  longitude: number;
  categoryAverages: CategoryAverages;
  ratings: RatingItem[];
};

const CAT_LABELS: Record<keyof CategoryAverages, string> = {
  taste: "Goût",
  foam: "Mousse",
  temperature: "Température",
  presentation: "Présentation",
  valueForMoney: "Qualité/prix",
};

function ratingColor(v: number) {
  if (v >= 4) return "green.500";
  if (v >= 3) return "yellow.500";
  if (v >= 2) return "orange.400";
  return "red.500";
}

function ratingBg(v: number) {
  if (v >= 4) return "green.50";
  if (v >= 3) return "yellow.50";
  if (v >= 2) return "orange.50";
  return "red.50";
}

function formatRating(v: number) {
  return v.toFixed(1);
}

function formatDate(value: string | null) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(d);
}

function StarRow({ value, size = 13 }: { value: number; size?: number }) {
  const full = Math.floor(value);
  const half = value - full >= 0.25 && value - full < 0.75;
  return (
    <HStack gap="0.5" display="inline-flex">
      {Array.from({ length: 5 }, (_, i) => {
        const pos = i + 1;
        const filled = pos <= full || (pos === full + 1 && half);
        return (
          <Box key={i} as="span" color={filled ? "yellow.400" : "gray.200"} fontSize={`${size}px`} lineHeight="1">
            ★
          </Box>
        );
      })}
    </HStack>
  );
}

function CategoryBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round((value / 5) * 100);
  return (
    <Stack gap="1">
      <HStack justify="space-between">
        <Text fontSize="xs" color="fg.muted">{label}</Text>
        <Text fontSize="xs" fontWeight="semibold" color={ratingColor(value)}>{formatRating(value)}</Text>
      </HStack>
      <Box h="1.5" bg="bg.subtle" borderRadius="full" overflow="hidden" borderWidth="1px" borderColor="border">
        <Box h="full" w={`${pct}%`} bg={ratingColor(value)} borderRadius="full" transition="width 600ms ease" />
      </Box>
    </Stack>
  );
}

export default function PlacePage() {
  const router = useRouter();
  const params = useParams();
  const id = decodeURIComponent(String(params.id));

  const [place, setPlace] = useState<PlaceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/ratings/place/${encodeURIComponent(id)}`, {
          signal: controller.signal,
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error || "Impossible de charger les avis");
        setPlace(payload as PlaceDetail);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [id]);

  function focusOnMap() {
    if (!place) return;
    const detail: FocusMapPointDetail = {
      id: place.placeId,
      name: place.name,
      latitude: place.latitude,
      longitude: place.longitude,
      averageRating: place.averageRating,
      ratingCount: place.ratingCount,
    };
    window.dispatchEvent(new CustomEvent(FOCUS_MAP_POINT_EVENT, { detail }));
    router.push("/");
  }

  const hasCategories =
    place &&
    Object.values(place.categoryAverages).some((v) => v !== null);

  return (
    <Box position="relative" minH="100dvh">
      <Container maxW="container.sm" py={{ base: 4, md: 8 }}>
        <Stack gap={5}>
          {/* Top nav */}
          <HStack justify="space-between">
            <Button
              variant="ghost"
              colorPalette="gray"
              size="sm"
              gap="1"
              pl="1"
              onClick={() => router.back()}
            >
              <LuArrowLeft size={15} />
              Retour
            </Button>

            {place && (
              <Button
                size="sm"
                bg="brand.900"
                borderRadius="full"
                gap="1.5"
                onClick={focusOnMap}
              >
                <LuCrosshair size={13} />
                Localiser sur la carte
              </Button>
            )}
          </HStack>

          {/* Hero card */}
          <Box
            borderRadius="xl"
            borderWidth="1px"
            borderColor="app.border"
            bg="app.surface"
            backdropFilter="blur(18px)"
            overflow="hidden"
          >
            <Box h="1" bgGradient="to-r" gradientFrom="brand.600" gradientTo="brand.400" />
            <Stack gap={3} p={{ base: 5, md: 6 }}>
              {loading ? (
                <>
                  <Skeleton h="7" w="60%" borderRadius="md" />
                  <Skeleton h="4" w="40%" borderRadius="md" />
                </>
              ) : error ? (
                <Text color="red.500" fontSize="sm">{error}</Text>
              ) : place ? (
                <>
                  <Text fontWeight="bold" fontSize="xl" color="app.fg" lineHeight="1.2">
                    {place.name}
                  </Text>
                  <HStack gap={3} align="center" flexWrap="wrap">
                    <HStack gap="1.5">
                      <Text fontSize="3xl" fontWeight="black" color="fg" lineHeight="1">
                        {formatRating(place.averageRating)}
                      </Text>
                      <Stack gap="0">
                        <StarRow value={place.averageRating} size={14} />
                        <Text fontSize="xs" color="fg.muted">
                          {place.ratingCount === 1 ? "1 note" : `${place.ratingCount} notes`}
                        </Text>
                      </Stack>
                    </HStack>
                    <Badge
                      borderRadius="lg"
                      px="2.5"
                      py="1"
                      bg={ratingBg(place.averageRating)}
                      color={ratingColor(place.averageRating)}
                      fontSize="md"
                      fontWeight="bold"
                    >
                      {formatRating(place.averageRating)} / 5
                    </Badge>
                  </HStack>
                </>
              ) : null}
            </Stack>
          </Box>

          {/* Category breakdown */}
          {loading ? (
            <Box
              borderRadius="xl"
              borderWidth="1px"
              borderColor="app.border"
              bg="app.surface"
              backdropFilter="blur(18px)"
              p={{ base: 5, md: 6 }}
            >
              <Stack gap={3}>
                <Skeleton h="4" w="40%" borderRadius="md" />
                {[0, 1, 2, 3].map((i) => <Skeleton key={i} h="6" borderRadius="md" />)}
              </Stack>
            </Box>
          ) : hasCategories ? (
            <Box
              borderRadius="xl"
              borderWidth="1px"
              borderColor="app.border"
              bg="app.surface"
              backdropFilter="blur(18px)"
              p={{ base: 5, md: 6 }}
            >
              <Stack gap={4}>
                <HStack gap="1.5">
                  <LuStar size={13} color="var(--chakra-colors-yellow-400)" />
                  <Text fontWeight="semibold" fontSize="sm" color="fg">Sous-critères</Text>
                </HStack>
                <Stack gap={3}>
                  {(Object.keys(CAT_LABELS) as Array<keyof CategoryAverages>).map((key) => {
                    const value = place!.categoryAverages[key];
                    if (value === null) return null;
                    return <CategoryBar key={key} label={CAT_LABELS[key]} value={value} />;
                  })}
                </Stack>
              </Stack>
            </Box>
          ) : null}

          {/* Individual ratings */}
          {!loading && !error && place && place.ratings.length > 0 && (
            <Box
              borderRadius="xl"
              borderWidth="1px"
              borderColor="app.border"
              bg="app.surface"
              backdropFilter="blur(18px)"
              overflow="hidden"
            >
              <HStack px={{ base: 5, md: 6 }} pt={4} pb={3} borderBottomWidth="1px" borderColor="border">
                <Text fontWeight="semibold" fontSize="sm" color="fg">
                  {place.ratingCount === 1 ? "1 avis" : `${place.ratingCount} avis`}
                </Text>
              </HStack>
              <Stack gap={0}>
                {place.ratings.map((r, index) => {
                  const date = formatDate(r.createdAt);
                  const subcats = [
                    { label: "Goût", value: r.tasteRating },
                    { label: "Mousse", value: r.foamRating },
                    { label: "Température", value: r.temperatureRating },
                    { label: "Présentation", value: r.presentationRating },
                    { label: "Q/P", value: r.valueForMoneyRating },
                  ].filter((c) => c.value !== null);

                  return (
                    <Box
                      key={r.id}
                      px={{ base: 5, md: 6 }}
                      py={4}
                      borderBottomWidth={index < place.ratings.length - 1 ? "1px" : "0"}
                      borderColor="border"
                    >
                      <Stack gap={2}>
                        <HStack justify="space-between" align="flex-start">
                          <HStack gap={2} align="center" flexWrap="wrap">
                            <Badge
                              borderRadius="lg"
                              px="2"
                              py="0.5"
                              bg={ratingBg(r.rating)}
                              color={ratingColor(r.rating)}
                              fontSize="sm"
                              fontWeight="bold"
                            >
                              {formatRating(r.rating)}
                            </Badge>
                            <StarRow value={r.rating} size={12} />
                            <Text fontSize="xs" color="fg.muted" fontWeight="medium">
                              {r.reviewerName ?? "Anonyme"}
                            </Text>
                          </HStack>
                          {date && (
                            <Text fontSize="xs" color="fg.muted" flexShrink={0}>{date}</Text>
                          )}
                        </HStack>

                        {subcats.length > 0 && (
                          <SimpleGrid columns={3} gap={2}>
                            {subcats.map((c) => (
                              <HStack key={c.label} gap="1">
                                <Text fontSize="xs" color="fg.muted">{c.label}</Text>
                                <Text fontSize="xs" fontWeight="semibold" color={ratingColor(c.value!)}>
                                  {formatRating(c.value!)}
                                </Text>
                              </HStack>
                            ))}
                          </SimpleGrid>
                        )}

                        {r.pintPrice !== null && (
                          <Text fontSize="xs" color="fg.muted">
                            Pinte : <strong>{r.pintPrice.toFixed(2)} €</strong>
                          </Text>
                        )}

                        {r.notes && (
                          <Text fontSize="sm" color="fg" fontStyle="italic">
                            &ldquo;{r.notes}&rdquo;
                          </Text>
                        )}

                        {r.photoUrl && (
                          <Box borderRadius="lg" overflow="hidden" maxH="48" bg="bg.subtle">
                            <Image
                              src={r.photoUrl}
                              alt="Photo de la pinte"
                              w="full"
                              h="48"
                              objectFit="cover"
                            />
                          </Box>
                        )}
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            </Box>
          )}

          {/* Empty state */}
          {!loading && !error && place && place.ratings.length === 0 && (
            <Text fontSize="sm" color="fg.muted" textAlign="center" py={6}>
              Aucun avis pour le moment.
            </Text>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
