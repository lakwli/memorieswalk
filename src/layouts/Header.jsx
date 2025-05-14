import {
  Box,
  Container,
  Flex,
  Image,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  Text,
  HStack,
  Avatar,
  MenuDivider,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Header = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  return (
    <Box bg="backgrounds.header" borderBottom="1px" borderColor="borders.light">
      <Container maxW="container.xl">
        <Flex py={4} justify="space-between" align="center">
          <HStack spacing={8}>
            <Image
              h="32px"
              src="/logo.svg"
              alt="Logo"
              cursor="pointer"
              onClick={() => navigate("/dashboard")}
            />
            <HStack spacing={6}>
              <Text
                as={RouterLink}
                to="/dashboard"
                fontWeight="500"
                color="textColors.primary"
              >
                Dashboard
              </Text>
              <Text
                as={RouterLink}
                to="/templates"
                fontWeight="500"
                color="textColors.secondary"
              >
                Templates
              </Text>
              <Text
                as={RouterLink}
                to="/settings"
                fontWeight="500"
                color="textColors.secondary"
              >
                Settings
              </Text>
            </HStack>
          </HStack>

          <Menu>
            <MenuButton
              as={Button}
              variant="ghost"
              rightIcon={<ChevronDownIcon />}
            >
              <HStack>
                <Avatar size="sm" name="User Name" />
                <Text>John Doe</Text>
              </HStack>
            </MenuButton>
            <MenuList>
              <MenuItem>Profile</MenuItem>
              <MenuItem>Account Settings</MenuItem>
              <MenuItem>Help Center</MenuItem>
              <MenuDivider />
              <MenuItem
                color="red.500"
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
              >
                Sign Out
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </Container>
    </Box>
  );
};

export default Header;
