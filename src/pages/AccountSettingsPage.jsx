import React, { useState, useContext, useEffect } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  Grid,
  GridItem,
} from "@chakra-ui/react";
import AuthContext from "../context/AuthContext";
import { updateUserProfile, changePassword } from "../services/userService";
import PageLayout from "../layouts/PageLayout";

const AccountSettingsPage = () => {
  const { user, token, setUser } = useContext(AuthContext);
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
      setUser(updatedUser);
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
    <PageLayout title="Account Settings">
      <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={10}>
        <GridItem>
          <Box>
            <Box fontSize="xl" fontWeight="semibold" mb={4}>
              Profile Information
            </Box>
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
              <VStack spacing={4} align="stretch">
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
                  alignSelf="flex-start"
                >
                  Update Profile
                </Button>
              </VStack>
            </form>
          </Box>
        </GridItem>

        <GridItem>
          <Box>
            <Box fontSize="xl" fontWeight="semibold" mb={4}>
              Change Password
            </Box>
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
              <VStack spacing={4} align="stretch">
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
                  alignSelf="flex-start"
                >
                  Change Password
                </Button>
              </VStack>
            </form>
          </Box>
        </GridItem>
      </Grid>
    </PageLayout>
  );
};

export default AccountSettingsPage;
