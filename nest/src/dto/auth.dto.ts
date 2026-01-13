export class LoginDto {
  username: string;
  password: string; // 前端已MD5加密的密码
}

export class RegisterDto {
  username: string;
  password: string; // 前端已MD5加密的密码
  email?: string;
}

export class LoginResponseDto {
  success: boolean;
  message: string;
  data?: {
    token: string;
    expires_at: string;
    user: {
      id: number;
      username: string;
      email?: string;
    };
  };
}

export class LogoutResponseDto {
  success: boolean;
  message: string;
}