// API client with automatic JWT token attachment
export class ApiClient {
  private baseUrl = '/api';

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  async fetch(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutMs = process.env.NODE_ENV === 'development' ? 45000 : 20000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        signal: options.signal ?? controller.signal,
        headers: {
          ...this.getHeaders(),
          ...(options.headers as Record<string, string>),
        },
      });
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `API Error: ${response.statusText}`);
    }

    return response.json();
  }

  // Vehicles
  getVehicles(filters?: { category?: string; available?: boolean }) {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.available !== undefined) params.append('available', String(filters.available));
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.fetch(`/vehicles${query}`);
  }

  getVehicle(id: string) {
    return this.fetch(`/vehicles/${id}`);
  }

  createVehicle(data: any) {
    return this.fetch('/vehicles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateVehicle(id: string, data: any) {
    return this.fetch(`/vehicles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  deleteVehicle(id: string) {
    return this.fetch(`/vehicles/${id}`, {
      method: 'DELETE',
    });
  }

  // Bookings
  getBookings(filters?: { userId?: string; status?: string }) {
    const params = new URLSearchParams();
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.status) params.append('status', filters.status);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.fetch(`/bookings${query}`);
  }

  getBooking(id: string) {
    return this.fetch(`/bookings/${id}`);
  }

  createBooking(data: any) {
    return this.fetch('/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateBooking(id: string, data: any) {
    return this.fetch(`/bookings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  deleteBooking(id: string) {
    return this.fetch(`/bookings/${id}`, {
      method: 'DELETE',
    });
  }

  // Auth
  login(email: string, password: string) {
    return this.fetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  register(
    name: string,
    email: string,
    password: string,
    phone: string,
    nicNumber?: string,
    address?: string,
    identityCardImage?: string,
    ocrText?: string
  ) {
    return this.fetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name,
        email,
        password,
        phone,
        nicNumber,
        address,
        identityCardImage,
        ocrText,
      }),
    });
  }
}

export const apiClient = new ApiClient();
