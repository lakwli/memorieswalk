import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import authService from "../services/authService";
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Heading,
  Text,
  useToast,
  Image,
} from "@chakra-ui/react";
import logo from "../assets/logo.svg"; // Make sure this path is correct

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const from = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    console.log("Login attempt started...");

    try {
      const data = await authService.login(username, password);
      console.log("Login API response:", data);

      login(data.user, data.token);
      console.log("Auth context updated, navigating to:", from);

      navigate(from, { replace: true });

      toast({
        title: "Login successful",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error("Login error:", err);
      toast({
        title: "Login failed",
        description: err.message || "Network error. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = authService.getAuthToken();
    if (token) {
      console.log("Token found, redirecting to dashboard");
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  return (
    <Box
      minH="100vh"
      bg="gray.50"
      py={{ base: "12", md: "16" }}
      px={{ base: "4", sm: "6", lg: "8" }}
    >
      <Container maxW="md">
        <Stack spacing="8">
          <Stack spacing="6" align="center">
            <Image h="48px" src={logo} alt="Moments Logo" />
            <Stack spacing="3" textAlign="center">
              <Heading size="xl" fontWeight="bold" color="gray.900">
                My Memories
              </Heading>
              <Text color="gray.500" fontSize="lg">
                Sign in to access your creative space
              </Text>
            </Stack>
          </Stack>

          <Box
            py={{ base: "8", sm: "12" }}
            px={{ base: "6", sm: "8" }}
            bg="white"
            boxShadow="md"
            borderRadius="xl"
          >
            <form onSubmit={handleSubmit}>
              <Stack spacing="6">
                <Stack spacing="5">
                  <FormControl isRequired>
                    <FormLabel htmlFor="username" color="gray.700">
                      Username
                    </FormLabel>
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      borderRadius="md"
                      borderColor="gray.300"
                      _hover={{
                        borderColor: "gray.400",
                      }}
                      _focus={{
                        borderColor: "blue.500",
                        boxShadow: "outline",
                      }}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel htmlFor="password" color="gray.700">
                      Password
                    </FormLabel>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      borderRadius="md"
                      borderColor="gray.300"
                      _hover={{
                        borderColor: "gray.400",
                      }}
                      _focus={{
                        borderColor: "blue.500",
                        boxShadow: "outline",
                      }}
                    />
                  </FormControl>
                </Stack>

                <Button
                  type="submit"
                  colorScheme="blue"
                  size="lg"
                  fontSize="md"
                  isLoading={isLoading}
                  loadingText="Signing in..."
                >
                  Sign in
                </Button>

                <Text mt={2} textAlign="center" color="gray.600" fontSize="sm">
                  Contact your administrator if you need access
                </Text>
              </Stack>
            </form>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
};

export default LoginPage;
