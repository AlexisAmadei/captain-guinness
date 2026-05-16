"use client";

import { Box, Button, Flex, Icon, Menu, Portal, Text } from "@chakra-ui/react";
import Link from "next/link";
import { BiMenu } from "react-icons/bi";
import { logout } from "@/app/auth/login/actions";

function CaptainLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="cap-sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#241404" />
          <stop offset="60%" stopColor="#0a0501" />
        </linearGradient>
        <linearGradient id="cap-fg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff8e7" />
          <stop offset="100%" stopColor="#f0d878" />
        </linearGradient>
      </defs>
      <path
        d="M16 18 L48 18 L44 56 Q32 60 20 56 Z"
        fill="url(#cap-sg)"
        stroke="#241404"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M16 18 Q20 12 24 14 Q28 9 32 13 Q36 9 40 14 Q44 12 48 18 Q44 22 32 22 Q20 22 16 18 Z"
        fill="url(#cap-fg)"
        stroke="#241404"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M21 26 L23 50"
        stroke="rgba(255,220,160,0.35)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="48" cy="44" r="4.5" fill="#d4880e" stroke="#241404" strokeWidth="1.5" />
    </svg>
  );
}

export function AppBar() {
  const handleLogout = async () => {
    await logout();
  };

  return (
    <Box
      position="sticky"
      top={0}
      bg="white"
      borderBottomWidth={1}
      borderColor="app.border"
      shadow="soft"
      zIndex={10}
    >
      <Flex
        justifyContent={"flex-start"}
        alignItems={"center"}
        h="16"
        px={{ base: 4, md: 6 }}
        gap={2.5}
      >
        <CaptainLogo size={28} />
        <Text fontSize="2xl" fontWeight="semibold" color="var(--theme-soil)">
          Captain
        </Text>
      </Flex>

      <Box position="absolute" top={0} right={0} p={4}>
        <Menu.Root positioning={{ placement: "bottom-end" }}>
          <Menu.Trigger asChild>
            <Button
              variant="outline"
              size="sm"
              rounded="full"
              px={3}
              borderColor="app.border"
              bg="app.surfaceSolid"
            >
              <Icon fontSize="lg" color="app.fg">
                <BiMenu />
              </Icon>
            </Button>
          </Menu.Trigger>
          <Portal>
            <Menu.Positioner>
              <Menu.Content bg="app.surfaceSolid" borderColor="app.border" shadow="lifted" rounded="xl">
                <Menu.Item value="profile" asChild>
                  <Link href="/settings/profile">Profile</Link>
                </Menu.Item>
                <Menu.Item value="settings" asChild>
                  <Link href="/settings">Settings</Link>
                </Menu.Item>
                <Menu.Item value="logout" onClick={handleLogout} color="fg.error">
                  Logout
                </Menu.Item>
              </Menu.Content>
            </Menu.Positioner>
          </Portal>
        </Menu.Root>
      </Box>
    </Box>
  );
}
