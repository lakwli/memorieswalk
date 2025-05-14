import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Heading,
  Button,
  InputGroup,
  InputLeftElement,
  Input,
  Flex,
  Avatar,
  Link,
  SimpleGrid,
  Text,
  useToast,
  Spinner,
  useTheme, // Import useTheme
} from "@chakra-ui/react";
import { SearchIcon, AddIcon } from "@chakra-ui/icons";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import PropTypes from "prop-types"; // Import PropTypes
import { canvasService } from "../services/canvasService"; // Assuming path is correct
import ErrorBoundary from "../components/ErrorBoundary"; // Import ErrorBoundary
// import AppHeader from '../components/common/AppHeader'; // Placeholder
// import SearchBar from '../components/dashboard/SearchBar'; // Placeholder
// import CanvasGrid from '../components/dashboard/CanvasGrid'; // Placeholder
// import LoadingSpinner from '../components/common/LoadingSpinner'; // Placeholder

const DashboardPage = () => {
  const [canvases, setCanvases] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();
  const navigate = useNavigate();
  const theme = useTheme(); // Access the theme object

  useEffect(() => {
    const fetchCanvases = async () => {
      try {
        console.log("Dashboard: Attempting to fetch canvases");
        setIsLoading(true);
        setError(null);
        const fetchedCanvases = await canvasService.getCanvases();
        console.log("Dashboard: Canvases fetched:", fetchedCanvases);
        setCanvases(fetchedCanvases);
      } catch (err) {
        console.error("Dashboard: Error fetching canvases:", err);
        setError(err.message);
        toast({
          title: "Error fetching canvases",
          description: err.message,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchCanvases();
  }, [toast]);

  const handleCreateCanvas = async () => {
    try {
      // For now, prompt for a title or use a default.
      // In a real app, you might have a modal for this.
      const title = prompt("Enter canvas title:", "New Canvas");
      if (title) {
        const newCanvas = await canvasService.createCanvas(title);
        toast({
          title: "Canvas Created",
          description: `Canvas "${newCanvas.title}" created successfully.`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        // Add to local state or refetch
        setCanvases((prev) => [newCanvas, ...prev]); // Add to top for immediate visibility
        navigate(`/canvas/${newCanvas.id}`); // Navigate to editor (Phase 3)
      }
    } catch (err) {
      toast({
        title: "Error creating canvas",
        description: err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const filteredCanvases = canvases.filter((canvas) =>
    canvas.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Placeholder for AppHeader component
  const AppHeader = () => (
    <Flex
      px={6}
      py={4}
      justifyContent="space-between"
      alignItems="center"
      borderBottomWidth="1px"
      borderColor="borders.light" // from theme
    >
      <Heading fontSize="24px" fontWeight="bold" fontFamily="heading">
        {" "}
        {/* Explicitly 24px */}
        My Canvas
      </Heading>
      <Avatar name="User" bg="gray.300" boxSize="40px" />{" "}
      {/* Explicitly 40px */}
      {/* Replace with actual user data later */}
    </Flex>
  );

  // Placeholder for SearchBar component
  const SearchBar = () => (
    <Box px={6} py={4}>
      <InputGroup>
        <InputLeftElement pointerEvents="none">
          <SearchIcon color="gray.400" />
        </InputLeftElement>
        <Input
          variant="dashboardSearch" // Using custom variant from theme
          placeholder="Search photos, albums or places..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </InputGroup>
    </Box>
  );

  // Placeholder for LoadingSpinner
  const LoadingSpinner = () => (
    <Flex justify="center" align="center" height="200px">
      <Spinner
        thickness="4px"
        speed="0.65s"
        emptyColor="gray.200"
        color="brand.primary" // Use theme color
        size="xl"
      />
    </Flex>
  );

  // Placeholder for CanvasGrid component
  const CanvasGrid = ({ items }) => (
    <Box px={6} pb={6}>
      <Flex justifyContent="space-between" alignItems="center" mb={4}>
        <Heading size="md" fontWeight="bold" fontFamily="heading">
          Recent Canvas
        </Heading>
        <Link as={RouterLink} to="/canvases/all" color="textColors.link">
          View All
        </Link>
      </Flex>
      {items.length === 0 && !isLoading && (
        <Text textAlign="center" color="textColors.secondary" py={10}>
          No canvases yet. Create one to get started!
        </Text>
      )}
      <SimpleGrid columns={{ base: 1, sm: 2 }} spacing="16px">
        {" "}
        {/* Adhering to 2 columns from dashboard.png.md */}
        {items.map(
          (
            canvas,
            index // Added index for color cycling
          ) => (
            <Box
              key={canvas.id}
              as={RouterLink}
              to={`/canvas/${canvas.id}`}
              // Cycle through accentPastels from theme
              bg={
                theme.colors.accentPastels[
                  Object.keys(theme.colors.accentPastels)[
                    index % Object.keys(theme.colors.accentPastels).length
                  ]
                ] || "gray.100"
              }
              borderRadius="8px" // from dashboard.png.md
              height="100px" // from dashboard.png.md
              width="100%" // Cards will take full width of their grid cell
              p={4}
              borderWidth="1px"
              borderColor="borders.light"
              _hover={{
                transform: "translateY(-4px)",
                shadow: "md",
                cursor: "pointer",
              }}
              display="flex"
              alignItems="center"
              justifyContent="center"
              textAlign="center"
            >
              <Text fontWeight="bold" color="textColors.dashboardCanvasTitle">
                {canvas.title}
              </Text>
              {/* Thumbnail would go here if available: <Image src={canvas.thumbnail_url} /> */}
            </Box>
          )
        )}
      </SimpleGrid>
    </Box>
  );

  CanvasGrid.propTypes = {
    items: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
          .isRequired,
        title: PropTypes.string.isRequired,
        // thumbnail_url: PropTypes.string, // Optional, if you plan to use it directly
      })
    ).isRequired,
    isLoading: PropTypes.bool, // Added isLoading to propTypes as it's used in conditional rendering
  };

  return (
    <Container
      maxW="360px" // Fixed width as per dashboard.png.md
      centerContent // Centers the container itself
      py={{ base: 4, md: 8 }}
      bg="backgrounds.app" // white
      minH="100vh"
    >
      <Box
        width="100%"
        borderWidth="1px"
        borderRadius="lg"
        shadow="sm"
        bg="white"
      >
        {" "}
        {/* Simulating the card */}
        <AppHeader />
        <SearchBar />
        <Box px={6} pt={2} pb={6}>
          <Button
            variant="createCanvas" // Using custom variant from theme
            leftIcon={<AddIcon />}
            width="100%"
            onClick={handleCreateCanvas}
          >
            Create Canvas
          </Button>
        </Box>
        {isLoading && <LoadingSpinner />}
        {error && (
          <Text color="red.500" textAlign="center" p={4}>
            Error: {error}
          </Text>
        )}
        {!isLoading && !error && <CanvasGrid items={filteredCanvases} />}
      </Box>
    </Container>
  );
};

export default function WrappedDashboard() {
  return (
    <ErrorBoundary>
      <DashboardPage />
    </ErrorBoundary>
  );
}
