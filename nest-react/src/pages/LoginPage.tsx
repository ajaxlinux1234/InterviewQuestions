import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, Navigate } from 'react-router-dom';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { LoginRequest } from '../types/auth';

const loginSchema = z.object({
  username: z.string().min(1, '请输入用户名').min(3, '用户名至少3个字符'),
  password: z.string().min(1, '请输入密码').min(6, '密码至少6个字符'),
});

export const LoginPage: React.FC = () => {
  const { login, isLoading, isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginRequest>({
    resolver: zodResolver(loginSchema)
  });

  // 如果已经登录，重定向到仪表板
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = (data: LoginRequest) => {
    login(data);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div>
          <div className="flex justify-center">
            <LogIn className="w-12 h-12 text-indigo-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            登录您的账户
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            还没有账户？{' '}
            <Link
              to="/register"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              立即注册
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                用户名
              </label>
              <input
                {...register('username')}
                type="text"
                autoComplete="username"
                className="form-input mt-1"
                placeholder="请输入用户名"
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                密码
              </label>
              <div className="mt-1 relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="form-input pr-10"
                  placeholder="请输入密码"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  登录中...
                </>
              ) : (
                '登录'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};