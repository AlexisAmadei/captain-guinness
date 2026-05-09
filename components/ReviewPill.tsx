"use client";

import {
  Badge,
  Box,
  Button,
  Card,
  HStack,
  Skeleton,
  Stack,
  Text,
} from "@chakra-ui/react";
import { FOCUS_MAP_POINT_EVENT, type FocusMapPointDetail } from "@/lib/map/events";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { LuChevronDown, LuPlus, LuStar, LuX } from "react-icons/lu";

type ReviewPoint = {
  id: string;
  placeId: string | null;
  name: string;
  latitude: number;
  longitude: number;
  averageRating: number;
  ratingCount: number;
  lastRatedAt: string | null;
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
    };
    window.dispatchEvent(new CustomEvent(FOCUS_MAP_POINT_EVENT, { detail }));
  };

  // ── Collapsed state ──────────────────────────────────────────────────────────
  if (!isOpen) {
    return (
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
          bg='brand.900'
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
    );
  }

  // ── Expanded state ───────────────────────────────────────────────────────────
  return (
    <Card.Root
      position="fixed"
      left={{ base: 3, md: 5 }}
      bottom={{ base: 4, md: 5 }}
      zIndex={30}
      w={{ base: "calc(100vw - 1.5rem)", sm: "21rem", md: "23rem" }}
      maxH="min(60vh, 34rem)"
      bg="bg"
      borderWidth="1px"
      borderColor="border"
      borderRadius="2xl"
      overflow="hidden"
      boxShadow="0 20px 60px rgba(15,23,42,0.22)"
      backdropFilter="blur(20px)"
      transform={entered ? "translateY(0)" : "translateY(36px)"}
      opacity={entered ? 1 : 0}
      transition="transform 480ms cubic-bezier(0.16,1,0.3,1), opacity 260ms ease"
      pointerEvents="auto"
      role="region"
      aria-label="Avis classés par note moyenne"
    >
      {/* Gradient accent */}
      <Box h="1" bgGradient="to-r" gradientFrom="brand.600" gradientTo="brand.400" />

      <Card.Body p="0" display="flex" flexDirection="column" minH={0}>
        {/* Header */}
        <HStack px="4" pt="4" pb="3" justify="space-between" flexShrink={0} borderBottomWidth="1px" borderColor="border">
          <Stack gap="0" minW={0}>
            <HStack gap="1.5">
              <LuStar size={13} color="var(--chakra-colors-yellow-400)" />
              <Text fontWeight="semibold" fontSize="sm">
                Meilleurs bars
              </Text>
            </HStack>
            <Text fontSize="xs" color="fg.muted">
              {reviews.length} lieux · {totalRatings} notes
              {overallAverage !== null && ` · moy. ${formatRating(overallAverage)}`}
            </Text>
          </Stack>
          <Button
            size="xs"
            variant="ghost"
            colorPalette="gray"
            borderRadius="full"
            boxSize="7"
            p="0"
            onClick={() => setIsOpen(false)}
            aria-label="Masquer"
          >
            <LuX size={13} />
          </Button>
        </HStack>

        {/* List */}
        <Stack gap="0" flex="1" minH={0} overflowY="auto">
          {loading ? (
            <Stack gap="0" p="3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} h="14" borderRadius="xl" mb="2" />
              ))}
            </Stack>
          ) : error ? (
            <Box px="4" py="3">
              <Text fontSize="sm" color="red.500">{error}</Text>
            </Box>
          ) : reviews.length === 0 ? (
            <Box px="4" py="6" textAlign="center">
              <Text fontSize="sm" color="fg.muted">Aucun avis pour le moment.</Text>
            </Box>
          ) : (
            reviews.map((review, index) => {
              const date = formatLastRatedAt(review.lastRatedAt);
              return (
                <HStack
                  key={review.id}
                  as="button"
                  align="center"
                  gap="3"
                  px="4"
                  py="2.5"
                  cursor="pointer"
                  textAlign="left"
                  borderBottomWidth={index < reviews.length - 1 ? "1px" : "0"}
                  borderColor="border"
                  transition="background 100ms ease"
                  _hover={{ bg: "bg.subtle" }}
                  _focusVisible={{ outline: "2px solid", outlineColor: "brand.500", outlineOffset: "-2px" }}
                  onClick={() => { focusPointOnMap(review); setIsOpen(false); }}
                  aria-label={`Voir ${review.name} sur la carte`}
                >
                  {/* Rank */}
                  <Text
                    flexShrink={0}
                    w="5"
                    fontSize="xs"
                    fontWeight="semibold"
                    color={index === 0 ? "app.accent" : "fg.muted"}
                    textAlign="center"
                  >
                    {index + 1}
                  </Text>

                  {/* Info */}
                  <Stack gap="0.5" minW={0} flex="1">
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
              );
            })
          )}
        </Stack>

        {/* Footer */}
        <HStack
          px="4"
          py="2.5"
          borderTopWidth="1px"
          borderColor="border"
          justify="space-between"
          flexShrink={0}
        >
          <Text fontSize="xs" color="fg.muted">Trié par note moyenne</Text>
          <Button
            size="xs"
            variant="ghost"
            bg="stout.400"
            borderRadius="full"
            gap="1"
            onClick={() => router.push("/rate")}
          >
            <LuPlus size={11} />
            <Text fontSize="xs">Ajouter</Text>
          </Button>
        </HStack>
      </Card.Body>
    </Card.Root>
  );
}
