import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
// @ts-ignore
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { LoginRequest, RegisterRequest } from '../types/auth';

export const useAuth = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setAuth, clearAuth, setLoading, user, isAuthenticated } = useAuthStore();

  // 登录
  const loginMutation = useMutation({
    mutationFn: authAPI.login,
    onMutate: () => {
      setLoading(true);
    },
    onSuccess: (data) => {
      if (data.success && data.data) {
        setAuth(data.data.user, data.data.token);
        toast.success('登录成功！');
        navigate('/dashboard');
      } else {
        toast.error(data.message || '登录失败');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '登录失败');
      setLoading(false);
    }
  });

  // 注册
  const registerMutation = useMutation({
    mutationFn: authAPI.register,
    onMutate: () => {
      setLoading(true);
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success('注册成功！请登录');
        navigate('/login');
      } else {
        toast.error(data.message || '注册失败');
      }
      setLoading(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '注册失败');
      setLoading(false);
    }
  });

  // 退出登录
  const logoutMutation = useMutation({
    mutationFn: authAPI.logout,
    onSuccess: () => {
      clearAuth();
      queryClient.clear();
      toast.success('已退出登录');
      navigate('/login');
    },
    onError: (error: any) => {
      // 即使退出失败也清除本地状态
      clearAuth();
      queryClient.clear();
      toast.error('退出登录失败，但已清除本地状态');
      navigate('/login');
    }
  });

  // 获取用户信息
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: authAPI.getProfile,
    enabled: isAuthenticated,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5分钟
  });

  const login = (data: LoginRequest) => {
    loginMutation.mutate(data);
  };

  const register = (data: RegisterRequest) => {
    registerMutation.mutate(data);
  };

  const logout = () => {
    logoutMutation.mutate();
  };

  return {
    user,
    isAuthenticated,
    isLoading: loginMutation.isPending || registerMutation.isPending || logoutMutation.isPending,
    profileLoading,
    profile: profile?.data,
    login,
    register,
    logout,
    loginError: loginMutation.error,
    registerError: registerMutation.error
  };
};