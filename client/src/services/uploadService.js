// src/services/uploadService.js (or could be part of a more general api.js)
import axios from 'axios';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const publicApiClient = axios.create({ // Separate client for non-admin routes if needed, or reuse
  baseURL: API_BASE_URL,
  headers: {
    // Content-Type for FormData is set automatically by browser/axios
  },
  withCredentials: true,
});

export const uploadFileAPI = async (file, fieldName = 'file') => {
  const formData = new FormData();
  formData.append(fieldName, file);

  try {
    // Assuming your upload endpoint is /api/upload/single
    const response = await publicApiClient.post('/upload/single', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data; // Expects ApiResponse: { success, data: { url, ... }, message }
  } catch (error) {
    console.error('Error uploading file:', error.response?.data || error.message);
    throw error.response?.data || new Error('File upload failed');
  }
};
