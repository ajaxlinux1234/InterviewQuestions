export interface User {
  id: number;
  username: string;
  email: string;
  created_at?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    expires_at: string;
    user: User;
  };
}

export interface ProfileResponse {
  success: boolean;
  data: User;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}