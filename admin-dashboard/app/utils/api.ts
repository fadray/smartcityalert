import axios from 'axios';

const API_URL = 'http://localhost:3001';

export const apiClient = (token: string) => {
  return axios.create({
    baseURL: API_URL,
    headers: { Authorization: `Bearer ${token}` },
  });
};
