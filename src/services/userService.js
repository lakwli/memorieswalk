import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

export const updateUserProfile = async (token, profileData) => {
  try {
    const response = await axios.put(`${API_URL}/users/profile`, profileData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Error updating user profile:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const changePassword = async (token, passwordData) => {
  try {
    const response = await axios.put(
      `${API_URL}/users/password`,
      passwordData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error changing password:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const getUserProfile = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/users/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching user profile:",
      error.response?.data || error.message
    );
    throw error;
  }
};
