import React, { useState, useContext, useEffect } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import AuthContext from "../context/AuthContext"; // Changed to default import
import { updateUserProfile, changePassword } from "../services/userService";
import MasterLayout from "../layouts/MasterLayout.jsx"; // Import MasterLayout

const AccountSettingsPage = () => {
  const { user, token, setUser } = useContext(AuthContext); // setUser is now available
  const toast = useToast();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setProfileError("");
    setProfileSuccess("");
    try {
      const updatedUser = await updateUserProfile(token, { fullName, email });
      setUser(updatedUser); // Update user in AuthContext
      setProfileSuccess("Profile updated successfully!");
      toast({
        title: "Profile Updated",
        description: "Your profile information has been updated.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to update profile.";
      setProfileError(message);
      toast({
        title: "Update Failed",
        description: message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword !== confirmNewPassword) {
      setPasswordError("New passwords do not match.");
      setIsLoading(false);
      return;
    }
    if (newPassword.length < 6) {
      // Example: Basic password length validation
      setPasswordError("New password must be at least 6 characters long.");
      setIsLoading(false);
      return;
    }

    try {
      await changePassword(token, { currentPassword, newPassword });
      setPasswordSuccess("Password changed successfully!");
      toast({
        title: "Password Changed",
        description: "Your password has been updated.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to change password.";
      setPasswordError(message);
      toast({
        title: "Change Failed",
        description: message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return <Spinner />;
  }

  return (
    <MasterLayout>
      {" "}
      {/* Wrap content with MasterLayout */}
      <Box p={8} maxWidth="600px" mx="auto">
        <VStack spacing={8} align="stretch">
          <Box>
            <Heading as="h2" size="lg" mb={6}>
              Account Information
            </Heading>
            {profileError && (
              <Alert status="error" mb={4}>
                <AlertIcon />
                {profileError}
              </Alert>
            )}
            {profileSuccess && (
              <Alert status="success" mb={4}>
                <AlertIcon />
                {profileSuccess}
              </Alert>
            )}
            <form onSubmit={handleProfileUpdate}>
              <VStack spacing={4}>
                <FormControl id="fullName">
                  <FormLabel>Full Name</FormLabel>
                  <Input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                </FormControl>
                <FormControl id="email">
                  <FormLabel>Email Address</FormLabel>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                  />
                </FormControl>
                <FormControl id="username">
                  <FormLabel>Username</FormLabel>
                  <Input
                    type="text"
                    value={user.username}
                    isReadOnly
                    isDisabled
                  />
                </FormControl>
                <Button
                  type="submit"
                  colorScheme="blue"
                  isLoading={isLoading}
                  loadingText="Updating..."
                >
                  Update Profile
                </Button>
              </VStack>
            </form>
          </Box>

          <Box>
            <Heading as="h2" size="lg" mb={6}>
              Change Password
            </Heading>
            {passwordError && (
              <Alert status="error" mb={4}>
                <AlertIcon />
                {passwordError}
              </Alert>
            )}
            {passwordSuccess && (
              <Alert status="success" mb={4}>
                <AlertIcon />
                {passwordSuccess}
              </Alert>
            )}
            <form onSubmit={handlePasswordChange}>
              <VStack spacing={4}>
                <FormControl id="currentPassword">
                  <FormLabel>Current Password</FormLabel>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                </FormControl>
                <FormControl id="newPassword">
                  <FormLabel>New Password</FormLabel>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 6 characters)"
                  />
                </FormControl>
                <FormControl id="confirmNewPassword">
                  <FormLabel>Confirm New Password</FormLabel>
                  <Input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </FormControl>
                <Button
                  type="submit"
                  colorScheme="teal"
                  isLoading={isLoading}
                  loadingText="Changing..."
                >
                  Change Password
                </Button>
              </VStack>
            </form>
          </Box>
        </VStack>
      </Box>
    </MasterLayout> // Close MasterLayout
  );
};

export default AccountSettingsPage;
