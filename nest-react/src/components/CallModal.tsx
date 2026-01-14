/**
 * 音视频通话模态框
 */

import { useEffect, useRef, useState } from 'react';
import { webrtcService } from '../services/webrtcService';

interface CallModalProps {
  onClose: () => void;
}

export function CallModal({ onClose }: CallModalProps) {
  const [callState, setCallState] = useState(webrtcService.getCallState());
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // 监听通话状态变化
  useEffect(() => {
    webrtcService.onStateChange((state) => {
      setCallState(state);
      
      // 通话结束时关闭模态框
      if (state.status === 'idle') {
        onClose();
      }
    });

    // 监听本地流
    webrtcService.onLocalStream((stream) => {
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    });

    // 监听远程流
    webrtcService.onRemoteStream((stream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    });
  }, [onClose]);

  // 通话计时器
  useEffect(() => {
    if (callState.status === 'connected') {
      const timer = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);

      return () => clearInterval(timer);
    } else {
      setElapsedTime(0);
    }
  }, [callState.status]);

  // 格式化通话时长
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 接受通话
  const handleAccept = async () => {
    try {
      await webrtcService.acceptCall();
    } catch (error) {
      console.error('接受通话失败:', error);
      alert('接受通话失败，请检查麦克风和摄像头权限');
    }
  };

  // 拒绝通话
  const handleReject = () => {
    webrtcService.rejectCall();
  };

  // 挂断通话
  const handleHangup = () => {
    webrtcService.hangup();
  };

  // 切换音频
  const handleToggleAudio = () => {
    const enabled = webrtcService.toggleAudio();
    setIsAudioEnabled(enabled);
  };

  // 切换视频
  const handleToggleVideo = () => {
    const enabled = webrtcService.toggleVideo();
    setIsVideoEnabled(enabled);
  };

  // 渲染状态文本
  const getStatusText = () => {
    switch (callState.status) {
      case 'calling':
        return '正在呼叫...';
      case 'ringing':
        return '收到通话邀请';
      case 'connected':
        return formatTime(elapsedTime);
      default:
        return '';
    }
  };

  // 渲染通话类型图标
  const getCallTypeIcon = () => {
    if (callState.callType === 'video') {
      return (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      );
    }
    return (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg w-full max-w-4xl h-[600px] flex flex-col">
        {/* 头部 */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <div className="text-white">
            <div className="text-lg font-semibold">
              {callState.callType === 'video' ? '视频通话' : '语音通话'}
            </div>
            <div className="text-sm text-gray-400">{getStatusText()}</div>
          </div>
        </div>

        {/* 视频区域 */}
        <div className="flex-1 relative bg-gray-800">
          {callState.callType === 'video' ? (
            <>
              {/* 远程视频 (大窗口) */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />

              {/* 本地视频 (小窗口) */}
              <div className="absolute top-4 right-4 w-48 h-36 bg-gray-700 rounded-lg overflow-hidden shadow-lg">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
            </>
          ) : (
            /* 语音通话界面 */
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-white">
                {getCallTypeIcon()}
                <div className="mt-4 text-xl font-semibold">{getStatusText()}</div>
              </div>
            </div>
          )}
        </div>

        {/* 控制按钮 */}
        <div className="p-6 bg-gray-900">
          <div className="flex items-center justify-center space-x-4">
            {/* 响铃状态 - 显示接受/拒绝按钮 */}
            {callState.status === 'ringing' && (
              <>
                <button
                  onClick={handleAccept}
                  className="w-16 h-16 rounded-full bg-green-600 hover:bg-green-700 flex items-center justify-center text-white transition-colors"
                  title="接受"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </button>
                <button
                  onClick={handleReject}
                  className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white transition-colors"
                  title="拒绝"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </>
            )}

            {/* 通话中 - 显示控制按钮 */}
            {(callState.status === 'calling' || callState.status === 'connected') && (
              <>
                {/* 静音按钮 */}
                <button
                  onClick={handleToggleAudio}
                  className={`w-14 h-14 rounded-full flex items-center justify-center text-white transition-colors ${
                    isAudioEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
                  }`}
                  title={isAudioEnabled ? '静音' : '取消静音'}
                >
                  {isAudioEnabled ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    </svg>
                  )}
                </button>

                {/* 视频开关按钮 (仅视频通话) */}
                {callState.callType === 'video' && (
                  <button
                    onClick={handleToggleVideo}
                    className={`w-14 h-14 rounded-full flex items-center justify-center text-white transition-colors ${
                      isVideoEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
                    }`}
                    title={isVideoEnabled ? '关闭摄像头' : '打开摄像头'}
                  >
                    {isVideoEnabled ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                    )}
                  </button>
                )}

                {/* 挂断按钮 */}
                <button
                  onClick={handleHangup}
                  className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white transition-colors"
                  title="挂断"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
