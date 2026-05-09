"use client";

import { Box, Button, Flex, Icon, Menu, Portal, Text } from "@chakra-ui/react";
import Link from "next/link";
import { BiMenu } from "react-icons/bi";
import { logout } from "@/app/auth/login/actions";
import Image from "next/image";

export function AppBar() {
  const handleLogout = async () => {
    await logout();
  };

  return (
    <Box
      position="sticky"
      top={0}
      bg="app.surface"
      backdropFilter="blur(20px)"
      borderBottomWidth={1}
      borderColor="app.border"
      shadow="soft"
      zIndex={10}
    >
      <Flex
        justifyContent={'flex-start'}
        alignItems={'center'}
        h="16"
        px={{ base: 4, md: 6 }}
      >
        <Text fontSize="2xl" fontWeight="semibold" color="var(--theme-soil)">
          Captain
        </Text>

        <Image
          src={'/guinness-logo.png'}
          alt="Logo"
          width={100}
          height={100}
        />
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
