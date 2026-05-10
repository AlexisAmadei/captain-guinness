"use client";

import {
  Badge,
  Box,
  Button,
  Container,
  Dialog,
  HStack,
  Heading,
  Image,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import { LuTrash2 } from "react-icons/lu";

type Profile = {
  fullName: string | null;
  avatarUrl: string | null;
};

type Stats = {
  totalRatings: number;
  avgRating: number | null;
  distinctPlaces: number;
};

type Review = {
  id: string;
  rating: number;
  placeId: string | null;
  barName: string | null;
  notes: string | null;
  photoUrl: string | null;
  pintPrice: number | null;
  ratedAt: string | null;
  tasteRating: number | null;
  foamRating: number | null;
  temperatureRating: number | null;
  presentationRating: number | null;
  valueForMoneyRating: number | null;
};

function ratingGradient(v: number) {
  if (v >= 4) return "to-r, green.600, teal.700";
  if (v >= 3) return "to-r, yellow.700, orange.600";
  if (v >= 2) return "to-r, orange.700, red.600";
  return "to-r, red.700, pink.700";
}

// Used for badge text on light backgrounds — must contrast against *.50 bg
function ratingColor(v: number) {
  if (v >= 4) return "green.800";
  if (v >= 3) return "yellow.900";
  if (v >= 2) return "orange.800";
  return "red.800";
}

function ratingBg(v: number) {
  if (v >= 4) return "green.100";
  if (v >= 3) return "yellow.100";
  if (v >= 2) return "orange.100";
  return "red.100";
}

function StarRow({ value, size='13' }: { value: number, size?: string }) {
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

function formatDate(value: string | null) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(d);
}

export default function ProfileSettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats>({ totalRatings: 0, avgRating: null, distinctPlaces: 0 });
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        );

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const [profileResult, ratingsResult] = await Promise.all([
            supabase
              .from("profiles")
              .select("full_name, avatar_url")
              .eq("id", user.id)
              .single(),
            supabase
              .from("ratings")
              .select(
                "id, rating, place_id, bar_name, notes, photo_url, pint_price, rated_at, taste_rating, foam_rating, temperature_rating, presentation_rating, value_for_money_rating",
              )
              .eq("user_id", user.id)
              .order("rated_at", { ascending: false }),
          ]);

          setProfile({
            fullName: profileResult.data?.full_name || user.email,
            avatarUrl: profileResult.data?.avatar_url,
          });

          const rows = ratingsResult.data ?? [];
          const totalRatings = rows.length;
          const avgRating = totalRatings
            ? rows.reduce((sum, r) => sum + Number(r.rating), 0) / totalRatings
            : null;
          const distinctPlaces = new Set(rows.map((r) => r.place_id).filter(Boolean)).size;

          setStats({ totalRatings, avgRating, distinctPlaces });
          setReviews(
            rows.map((r) => ({
              id: r.id,
              rating: Number(r.rating),
              placeId: r.place_id ?? null,
              barName: r.bar_name ?? null,
              notes: r.notes ?? null,
              photoUrl: r.photo_url ?? null,
              pintPrice: r.pint_price != null ? Number(r.pint_price) : null,
              ratedAt: r.rated_at ?? null,
              tasteRating: r.taste_rating != null ? Number(r.taste_rating) : null,
              foamRating: r.foam_rating != null ? Number(r.foam_rating) : null,
              temperatureRating: r.temperature_rating != null ? Number(r.temperature_rating) : null,
              presentationRating: r.presentation_rating != null ? Number(r.presentation_rating) : null,
              valueForMoneyRating: r.value_for_money_rating != null ? Number(r.value_for_money_rating) : null,
            })),
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      );
      const { error } = await supabase.from("ratings").delete().eq("id", id);
      if (!error) {
        setReviews((prev) => {
          const next = prev.filter((r) => r.id !== id);
          const total = next.length;
          const avg = total ? next.reduce((s, r) => s + r.rating, 0) / total : null;
          const distinctPlaces = new Set(next.map((r) => r.placeId).filter(Boolean)).size;
          setStats({ totalRatings: total, avgRating: avg, distinctPlaces });
          return next;
        });
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Container maxW="container.sm" py={6}>
      <Stack gap={6} pb={20}>
        {/* Profile Header */}
        <VStack gap={4} textAlign="center" py={4}>
          <Box
            w="20"
            h="20"
            borderRadius="full"
            bg="brand.100"
            display="flex"
            alignItems="center"
            justifyContent="center"
            fontSize="2xl"
          >
            👤
          </Box>
          <VStack gap={1}>
            <Heading as="h1" size="md">
              {loading ? "Loading..." : profile?.fullName || "User"}
            </Heading>
            <Text color="fg" fontSize="sm">
              @captain_user
            </Text>
          </VStack>
        </VStack>

        {/* Stats */}
        <Stack
          direction="row"
          justify="space-around"
          p={4}
          bg="app.surface"
          borderRadius="lg"
          borderWidth={1}
          borderColor="app.border"
        >
          <VStack align="center" gap={1}>
            <Heading as="h3" size="sm" color="fg">
              {loading ? "-" : stats.totalRatings}
            </Heading>
            <Text fontSize="xs" color="fg">
              Ratings
            </Text>
          </VStack>
          <Box w="1px" bg="app.border" />
          <VStack align="center" gap={1}>
            <Heading as="h3" size="sm" color="fg">
              {loading ? "-" : stats.avgRating !== null ? stats.avgRating.toFixed(1) : "-"}
            </Heading>
            <Text fontSize="xs" color="fg">
              Note générale
            </Text>
          </VStack>
          <Box w="1px" bg="app.border" />
          <VStack align="center" gap={1}>
            <Heading as="h3" size="sm" color="fg">
              {loading ? "-" : stats.distinctPlaces}
            </Heading>
            <Text fontSize="xs" color="fg">
              Lieux notés
            </Text>
          </VStack>
        </Stack>

        {/* Reviews list */}
        {!loading && reviews.length > 0 && (
          <Stack gap={3}>
            <Text fontWeight="semibold" fontSize="sm" color="fg">
              {reviews.length === 1 ? "1 avis" : `${reviews.length} avis`}
            </Text>
            {reviews.map((r) => {
              const date = formatDate(r.ratedAt);
              const subcats = [
                { label: "Goût", value: r.tasteRating },
                { label: "Mousse", value: r.foamRating },
                { label: "Temp.", value: r.temperatureRating },
                { label: "Présentation", value: r.presentationRating },
                { label: "Q/P", value: r.valueForMoneyRating },
              ].filter((c) => c.value !== null);

              const gradient = ratingGradient(r.rating);

              return (
                <Box
                  key={r.id}
                  borderRadius="2xl"
                  overflow="hidden"
                  borderWidth="1px"
                  borderColor="app.border"
                  bg="app.surface"
                  boxShadow="sm"
                >
                  {/* Gradient header */}
                  <Box bgGradient={gradient} px={4} py={3}>
                    <HStack justify="space-between" align="center">
                      <HStack gap={2} align="center" minW={0}>
                        <Text
                          fontWeight="bold"
                          fontSize="md"
                          color="black"
                          overflow="hidden"
                          textOverflow="ellipsis"
                          whiteSpace="nowrap"
                        >
                          {r.barName ?? "Bar inconnu"}
                        </Text>
                      </HStack>
                      <Text fontWeight="black" fontSize="lg" color="black" flexShrink={0}>
                        {r.rating.toFixed(1)}<Text as="span" fontSize="xs" fontWeight="normal"> / 5</Text>
                      </Text>
                    </HStack>
                  </Box>

                  {/* Body */}
                  <Stack gap={3} px={4} py={3}>
                    <HStack justify="space-between" align="center">
                      <StarRow value={r.rating} size="24" />
                      {date && (
                        <Text fontSize="xs" color="fg">{date}</Text>
                      )}
                    </HStack>

                    {subcats.length > 0 && (
                      <HStack gap={2} flexWrap="wrap">
                        {subcats.map((c) => (
                          <Badge
                            key={c.label}
                            borderRadius="full"
                            px="2.5"
                            py="0.5"
                            bg={ratingBg(c.value!)}
                            color={ratingColor(c.value!)}
                            fontSize="xs"
                            fontWeight="semibold"
                          >
                            {c.label} {c.value!.toFixed(1)}
                          </Badge>
                        ))}
                      </HStack>
                    )}

                    {r.pintPrice !== null && (
                      <HStack gap={1}>
                        <Text fontSize="xs" color="fg">Pinte :</Text>
                        <Badge borderRadius="full" px="2" colorPalette="gray" fontSize="xs">
                          {r.pintPrice.toFixed(2)} €
                        </Badge>
                      </HStack>
                    )}

                    {r.notes && (
                      <Text fontSize="sm" color="app.fg" fontStyle="italic" lineClamp={3}>
                        &ldquo;{r.notes}&rdquo;
                      </Text>
                    )}

                    {r.photoUrl && (
                      <Box borderRadius="xl" overflow="hidden">
                        <Image
                          src={r.photoUrl}
                          alt="Photo de la pinte"
                          w="full"
                          h="48"
                          objectFit="cover"
                        />
                      </Box>
                    )}

                    <HStack justify="flex-end">
                      <Button
                        size="xs"
                        variant="ghost"
                        colorPalette="red"
                        borderRadius="full"
                        p="1"
                        minW="0"
                        h="auto"
                        aria-label="Supprimer cet avis"
                        loading={deletingId === r.id}
                        onClick={() => setPendingDeleteId(r.id)}
                      >
                        <LuTrash2 size={14} />
                      </Button>
                    </HStack>
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        )}

        {!loading && reviews.length === 0 && (
          <Box
            p={8}
            bg="app.surfaceSolid"
            borderRadius="2xl"
            borderWidth={1}
            borderColor="app.border"
            textAlign="center"
          >
            <Text fontSize="2xl" mb={2}>🍺</Text>
            <Text fontSize="sm" color="white">
              Aucun avis pour le moment.
            </Text>
          </Box>
        )}

        {/* Edit Profile Button */}
        <Button asChild colorPalette="brand" size="lg">
          <Link href="/settings/profile/edit">Edit Profile</Link>
        </Button>
      </Stack>

      <Dialog.Root
        open={pendingDeleteId !== null}
        onOpenChange={({ open }) => { if (!open) setPendingDeleteId(null); }}
        size="xs"
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content borderRadius="2xl" mx={4}>
            <Dialog.Header px="5" pt="5" pb="2">
              <Dialog.Title fontSize="md">Supprimer cet avis ?</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body px="5" pb="2">
              <Text fontSize="sm" color="fg.muted">
                Cette action est irréversible.
              </Text>
            </Dialog.Body>
            <Dialog.Footer px="5" py="4" gap="2">
              <Button
                variant="outline"
                size="sm"
                borderRadius="full"
                onClick={() => setPendingDeleteId(null)}
              >
                Annuler
              </Button>
              <Button
                colorPalette="red"
                size="sm"
                borderRadius="full"
                loading={deletingId !== null}
                onClick={async () => {
                  if (!pendingDeleteId) return;
                  await handleDelete(pendingDeleteId);
                  setPendingDeleteId(null);
                }}
              >
                Supprimer
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Container>
  );
}
