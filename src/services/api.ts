import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

export interface SKU {
  name: string;
  ownership: string;
  category: string;
  segment: string;
  volume?: number;
  customer_price?: number;
  gp?: number;
  volume_sold?: number;
  price_elasticity?: number;
  price?: number;
  rsv?: number;
  gp_mass?: number;
  volume_share?: number;
  value_share?: number;
  unit_sold?: number;
}

export const api = {
  async getAllSKUs(): Promise<SKU[]> {
    const response = await axios.get(`${API_BASE_URL}/skus`);
    return response.data;
  },

  async searchSKUs(params: {
    query?: string;
    ownership?: string;
    category?: string;
    segment?: string;
  }): Promise<SKU[]> {
    const response = await axios.get(`${API_BASE_URL}/skus/search`, { params });
    return response.data;
  }
}; 