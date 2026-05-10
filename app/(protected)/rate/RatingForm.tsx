"use client";
import { PhotoCapture } from "@/components/PhotoCapture";
import { StarRating } from "@/components/StarRating";
import { compressImage } from "@/lib/compression";
import { Box, Container, Stack, Badge, Heading, HStack, Text, Input, SimpleGrid, Button, Field } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useState, type SyntheticEvent } from "react";
import { InfoCard } from "./InfoCard";
import { Place, RatingCriteria, isValidOptionalRating, getResponseErrorMessage } from "./page";

// ─── Step 2: Rating form ─────────────────────────────────────────────────────
export function RatingForm({ place }: { place: Place; }) {
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
        background="radial-gradient(circle at 12% 12%, rgba(255,255,255,0.72), transparent 30%), radial-gradient(circle at 88% 18%, rgba(224, 143, 30, 0.14), transparent 28%)" />
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
                    borderColor="app.border" />
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
                          onChange={(value) => setCriteria((prev) => ({ ...prev, [key]: value }))} />
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
                      onChange={(value) => setCriteria((prev) => ({ ...prev, overall: value }))} />
                  </Field.Root>
                </Box>
              </InfoCard>

              {/* Photo */}
              <InfoCard title="Photo" description="Add a quick visual to preserve the pour, foam, or glass details.">
                <PhotoCapture
                  onPhotoCapture={(file) => setPhotoFile(file)}
                  onClear={() => setPhotoFile(null)} />
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
