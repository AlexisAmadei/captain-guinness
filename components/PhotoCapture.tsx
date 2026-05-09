"use client";

import { Box, Button, HStack, Icon, Image } from "@chakra-ui/react";
import { useRef, useState } from "react";
import { BiCamera, BiX } from "react-icons/bi";

type PhotoCaptureProps = {
  onPhotoCapture: (file: File) => void;
  onClear?: () => void;
};

export function PhotoCapture({ onPhotoCapture, onClear }: PhotoCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      console.error("Selected file is not an image");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
      onPhotoCapture(file);
    };
    reader.readAsDataURL(file);
  };

  const handleClear = () => {
    setPreview(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    onClear?.();
  };

  const handleCapture = () => {
    inputRef.current?.click();
  };

  return (
    <Box
      borderWidth="1px"
      borderStyle="dashed"
      borderColor="app.border"
      bg="app.surface"
      borderRadius="lg"
      p={4}
      shadow="soft"
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      {preview ? (
        <Box>
          <Image
            src={preview}
            alt="Captured photo"
            w="100%"
            h={{ base: "220px", md: "280px" }}
            objectFit="cover"
            borderRadius="lg"
            mb={3}
            shadow="soft"
          />
          <HStack>
            <Button
              flex={1}
              bg="stout.400"
              onClick={handleCapture}
            >
              Retake
            </Button>
            <Button
              flex={1}
              variant="outline"
              onClick={handleClear}
            >
              Clear
            </Button>
          </HStack>
        </Box>
      ) : (
        <Button
          w="100%"
          h={{ base: "180px", md: "220px" }}
          variant="outline"
          borderColor="app.border"
          bg="app.surfaceSolid"
          color="app.fg"
          onClick={handleCapture}
          flexDirection="column"
          gap={3}
          borderRadius="lg"
          shadow="sm"
          _hover={{
            transform: "translateY(-1px)",
            shadow: "soft",
            borderColor: "app.accent",
          }}
        >
          <Icon fontSize="3xl" color="app.accent">
            <BiCamera />
          </Icon>
          <Box as="span" fontSize="md">
            Take a photo
          </Box>
        </Button>
      )}
    </Box>
  );
}
