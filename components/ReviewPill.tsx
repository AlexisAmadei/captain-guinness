"use client";

import {
  Badge,
  Box,
  Button,
  Dialog,
  HStack,
  Separator,
  Skeleton,
  Stack,
  Text,
} from "@chakra-ui/react";
import { FOCUS_MAP_POINT_EVENT, type CategoryAverages, type FocusMapPointDetail } from "@/lib/map/events";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { LuArrowUpRight, LuCrosshair, LuPlus, LuStar, LuX } from "react-icons/lu";

type ReviewPoint = {
  id: string;
  placeId: string | null;
  name: string;
  latitude: number;
  longitude: number;
  averageRating: number;
  ratingCount: number;
  lastRatedAt: string | null;
  categoryAverages: CategoryAverages;
};

type ReviewsMapResponse = {
  points?: ReviewPoint[];
  error?: string;
};

function ratingColor(value: number): string {
  if (value >= 4) return "green.500";
  if (value >= 3) return "yellow.500";
  if (value >= 2) return "orange.400";
  return "red.500";
}

function ratingBg(value: number): string {
  if (value >= 4) return "green.50";
  if (value >= 3) return "yellow.50";
  if (value >= 2) return "orange.50";
  return "red.50";
}

function formatRating(value: number) {
  return value.toFixed(1);
}

function formatCount(count: number) {
  return count === 1 ? "1 note" : `${count} notes`;
}

function formatLastRatedAt(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(parsed);
}

function StarRow({ value }: { value: number }) {
  const full = Math.floor(value);
  const half = value - full >= 0.25 && value - full < 0.75;
  return (
    <HStack gap="0.5" display="inline-flex">
      {Array.from({ length: 5 }, (_, i) => {
        const pos = i + 1;
        const filled = pos <= full || (pos === full + 1 && half);
        return (
          <Box
            key={i}
            as="span"
            color={filled ? "yellow.400" : "gray.200"}
            fontSize="11px"
            lineHeight="1"
          >
            ★
          </Box>
        );
      })}
    </HStack>
  );
}

export function ReviewPill() {
  const router = useRouter();
  const [reviews, setReviews] = useState<ReviewPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entered, setEntered] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setEntered(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadReviews() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/ratings/map?scope=all", {
          signal: controller.signal,
        });
        const payload: ReviewsMapResponse = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Impossible de charger les avis");
        }

        const nextReviews = (payload.points ?? []).slice().sort((a, b) => {
          if (b.averageRating !== a.averageRating) return b.averageRating - a.averageRating;
          if (b.ratingCount !== a.ratingCount) return b.ratingCount - a.ratingCount;
          return a.name.localeCompare(b.name);
        });

        setReviews(nextReviews);
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setError(loadError instanceof Error ? loadError.message : "Erreur inconnue");
        setReviews([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadReviews();
    return () => controller.abort();
  }, []);

  const totalRatings = useMemo(
    () => reviews.reduce((sum, r) => sum + r.ratingCount, 0),
    [reviews],
  );

  const overallAverage = useMemo(() => {
    if (reviews.length === 0) return null;
    const weighted = reviews.reduce((sum, r) => sum + r.averageRating * r.ratingCount, 0);
    return weighted / totalRatings;
  }, [reviews, totalRatings]);

  const focusPointOnMap = (review: ReviewPoint) => {
    const detail: FocusMapPointDetail = {
      id: review.id,
      name: review.name,
      latitude: review.latitude,
      longitude: review.longitude,
      averageRating: review.averageRating,
      ratingCount: review.ratingCount,
      categoryAverages: review.categoryAverages,
    };
    window.dispatchEvent(new CustomEvent(FOCUS_MAP_POINT_EVENT, { detail }));
  };

  return (
    <>
      {/* ── Floating pill buttons ────────────────────────────────────────────── */}
      <HStack
        position="fixed"
        bottom={{ base: 4, md: 5 }}
        left={{ base: 3, md: 5 }}
        zIndex={30}
        gap={2}
        transform={entered ? "translateY(0)" : "translateY(24px)"}
        opacity={entered ? 1 : 0}
        transition="transform 400ms cubic-bezier(0.16,1,0.3,1), opacity 260ms ease"
      >
        {/* Add rating */}
        <Button
          borderRadius="full"
          boxSize="11"
          p="0"
          bg="brand.900"
          boxShadow="0 4px 20px rgba(15,23,42,0.20)"
          aria-label="Ajouter un avis"
          onClick={() => router.push("/rate")}
        >
          <LuPlus size={18} />
        </Button>

        {/* Avis pill */}
        <Button
          borderRadius="full"
          px="4"
          h="11"
          bg="brand.900"
          variant="solid"
          boxShadow="0 4px 20px rgba(15,23,42,0.20)"
          onClick={() => setIsOpen(true)}
          gap={2}
        >
          <LuStar size={14} />
          <Text fontWeight="semibold" fontSize="sm">Avis</Text>
          {!loading && (
            <Badge
              variant="solid"
              bg="rgba(255,255,255,0.22)"
              color="white"
              borderRadius="full"
              px="2"
              fontSize="xs"
              fontWeight="semibold"
            >
              {reviews.length}
            </Badge>
          )}
          {overallAverage !== null && (
            <HStack gap="1" borderLeftWidth="1px" borderColor="rgba(255,255,255,0.3)" pl="2">
              <Text fontSize="sm" fontWeight="bold">{formatRating(overallAverage)}</Text>
              <Text fontSize="xs" opacity={0.75}>/ 5</Text>
            </HStack>
          )}
        </Button>
      </HStack>

      {/* ── Dialog ──────────────────────────────────────────────────────────── */}
      <Dialog.Root
        open={isOpen}
        onOpenChange={({ open }) => setIsOpen(open)}
        size="md"
        scrollBehavior="inside"
        id="all-reviews-dialog"
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content borderRadius="2xl" overflow="hidden" mx={2}>
            {/* Gradient accent */}
            <Box h="1" bgGradient="to-r" gradientFrom="brand.600" gradientTo="brand.400" flexShrink={0} />

            <Dialog.Header px="5" pt="4" pb="0" flexShrink={0}>
              {/* Overall stats */}
              {overallAverage !== null && !loading && (
                <HStack
                  mt="6"
                  p="3"
                  bg="bg.subtle"
                  borderRadius="xl"
                  borderWidth="1px"
                  borderColor="border"
                  gap="4"
                  w={'100%'}
                >
                  <Stack gap="0" flex="1" align="center">
                    <Text fontSize="2xl" fontWeight="bold" color="fg" >
                      {totalRatings}
                    </Text>
                    <Text fontSize="xs" textAlign={'center'} color="fg.muted">Notes au total</Text>
                  </Stack>
                  <Separator orientation="vertical" h="12" />
                  <Stack gap="0" flex="1" align="center">
                    <Text fontSize="2xl" fontWeight="bold" color="fg">
                      {reviews.length}
                    </Text>
                    <Text fontSize="xs" color="fg.muted" mt="0.5">Lieux notés</Text>
                  </Stack>

                  <Dialog.CloseTrigger asChild>
                    <Button size="md" variant="ghost" colorPalette="gray" borderRadius="full" boxSize="7" m="1" aria-label="Fermer">
                      <LuX size={13} />
                    </Button>
                  </Dialog.CloseTrigger>
                </HStack>
              )}
            </Dialog.Header>

            <Dialog.Body px="5" py="3">
              <Stack gap="0">
                {loading ? (
                  <Stack gap="2">
                    {[0, 1, 2].map((i) => (
                      <Skeleton key={i} h="20" borderRadius="xl" />
                    ))}
                  </Stack>
                ) : error ? (
                  <Text fontSize="sm" color="red.500" py="2">{error}</Text>
                ) : reviews.length === 0 ? (
                  <Text fontSize="sm" color="fg.muted" py="6" textAlign="center">
                    Aucun avis pour le moment.
                  </Text>
                ) : (
                  reviews.map((review, index) => {
                    const date = formatLastRatedAt(review.lastRatedAt);
                    return (
                      <Box
                        key={review.id}
                        borderBottomWidth={index < reviews.length - 1 ? "1px" : "0"}
                        borderColor="border"
                        py="3"
                      >
                        <HStack align="flex-start" gap="3">
                          {/* Rank */}
                          <Text
                            flexShrink={0}
                            w="5"
                            fontSize="xs"
                            fontWeight="semibold"
                            color={index === 0 ? "app.accent" : "fg.muted"}
                            textAlign="center"
                            pt="0.5"
                          >
                            {index + 1}
                          </Text>

                          {/* Info */}
                          <Stack gap="1" minW={0} flex="1">
                            <Text
                              fontWeight="medium"
                              fontSize="sm"
                              whiteSpace="nowrap"
                              overflow="hidden"
                              textOverflow="ellipsis"
                            >
                              {review.name}
                            </Text>
                            <HStack gap="1.5">
                              <StarRow value={review.averageRating} />
                              <Text fontSize="xs" color="fg.muted">
                                {formatCount(review.ratingCount)}
                                {date ? ` · ${date}` : ""}
                              </Text>
                            </HStack>

                            {/* CTAs */}
                            <HStack gap="2" mt="0.5" flexWrap="wrap">
                              <Button
                                size="xs"
                                variant="outline"
                                borderRadius="full"
                                gap="1"
                                onClick={() => router.push(`/place/${encodeURIComponent(review.placeId ?? review.id)}`)}
                              >
                                <LuArrowUpRight size={11} />
                                Voir tous les avis
                              </Button>
                              <Button
                                size="xs"
                                variant="solid"
                                bg="brand.900"
                                borderRadius="full"
                                gap="1"
                                onClick={() => { focusPointOnMap(review); setIsOpen(false); }}
                              >
                                <LuCrosshair size={11} />
                                Localiser
                              </Button>
                            </HStack>
                          </Stack>

                          {/* Score badge */}
                          <Badge
                            flexShrink={0}
                            borderRadius="lg"
                            px="2"
                            py="1"
                            bg={ratingBg(review.averageRating)}
                            color={ratingColor(review.averageRating)}
                            fontSize="sm"
                            fontWeight="bold"
                          >
                            {formatRating(review.averageRating)}
                          </Badge>
                        </HStack>
                      </Box>
                    );
                  })
                )}
              </Stack>
            </Dialog.Body>

            <Dialog.Footer px="5" py="3" borderTopWidth="1px" borderColor="border" flexShrink={0}>
              <Text fontSize="xs" color="fg.muted" flex="1">Trié par note moyenne</Text>
              <Button
                size="xs"
                variant="ghost"
                bg="stout.400"
                borderRadius="full"
                gap="1"
                color="white"
                onClick={() => router.push("/rate")}
              >
                <LuPlus size={11} />
                Ajouter un avis
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </>
  );
}
