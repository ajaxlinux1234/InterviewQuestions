/**
 * WebRTC 音视频通话服务
 */

import { socketService } from './socketService';

export type CallType = 'audio' | 'video';
export type CallStatus = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';

interface CallState {
  status: CallStatus;
  callType: CallType | null;
  isInitiator: boolean;
  remoteUserId: number | null;
  conversationId: number | null;
}

class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private isInitialized = false; // 防止重复初始化
  
  private callState: CallState = {
    status: 'idle',
    callType: null,
    isInitiator: false,
    remoteUserId: null,
    conversationId: null,
  };

  private onStateChangeCallback: ((state: CallState) => void) | null = null;
  private onRemoteStreamCallback: ((stream: MediaStream) => void) | null = null;
  private onLocalStreamCallback: ((stream: MediaStream) => void) | null = null;

  // ICE 服务器配置
  private iceServers: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  /**
   * 初始化 WebRTC 服务（注册 Socket 监听器）
   * 必须在 socket 连接后调用
   */
  init() {
    if (this.isInitialized) {
      console.log('WebRTC 服务已初始化，跳过重复初始化');
      return;
    }
    
    console.log('初始化 WebRTC 服务，注册 Socket 监听器');
    this.setupSocketListeners();
    this.isInitialized = true;
  }

  /**
   * 设置 Socket 监听器
   */
  private setupSocketListeners() {
    console.log('开始注册 Socket 监听器...');
    
    // 添加原始事件监听器用于调试
    socketService.on('callInvite', (data: any) => {
      console.log('!!! 原始 callInvite 事件收到 !!!', data);
    });
    
    // 收到通话邀请
    console.log('注册 callInvite 监听器');
    socketService.on('callInvite', this.handleCallInvite.bind(this));
    
    // 对方接受通话
    console.log('注册 callAccepted 监听器');
    socketService.on('callAccepted', this.handleCallAccepted.bind(this));
    
    // 对方拒绝通话
    console.log('注册 callRejected 监听器');
    socketService.on('callRejected', this.handleCallRejected.bind(this));
    
    // 对方挂断通话
    console.log('注册 callHangup 监听器');
    socketService.on('callHangup', this.handleCallHangup.bind(this));
    
    // WebRTC 信令
    console.log('注册 webrtcOffer 监听器');
    socketService.on('webrtcOffer', this.handleWebRTCOffer.bind(this));
    console.log('注册 webrtcAnswer 监听器');
    socketService.on('webrtcAnswer', this.handleWebRTCAnswer.bind(this));
    console.log('注册 webrtcIceCandidate 监听器');
    socketService.on('webrtcIceCandidate', this.handleWebRTCIceCandidate.bind(this));
    
    console.log('所有 Socket 监听器注册完成');
  }

  /**
   * 发起通话
   */
  async startCall(targetUserId: number, conversationId: number, callType: CallType) {
    try {
      this.callState = {
        status: 'calling',
        callType,
        isInitiator: true,
        remoteUserId: targetUserId,
        conversationId,
      };
      this.notifyStateChange();

      // 获取本地媒体流
      await this.getLocalStream(callType);

      // 发送通话邀请
      socketService.callInvite(targetUserId, conversationId, callType);

    } catch (error) {
      console.error('发起通话失败:', error);
      this.endCall();
      throw error;
    }
  }

  /**
   * 接受通话
   */
  async acceptCall() {
    try {
      if (!this.callState.remoteUserId || !this.callState.callType || !this.callState.conversationId) {
        throw new Error('无效的通话状态');
      }

      this.callState.status = 'connected';
      this.notifyStateChange();

      // 获取本地媒体流
      await this.getLocalStream(this.callState.callType);

      // 通知对方已接受
      socketService.callAccept(
        this.callState.remoteUserId,
        this.callState.conversationId
      );

    } catch (error) {
      console.error('接受通话失败:', error);
      this.endCall();
      throw error;
    }
  }

  /**
   * 拒绝通话
   */
  rejectCall() {
    if (!this.callState.remoteUserId || !this.callState.conversationId) return;

    socketService.callReject(
      this.callState.remoteUserId,
      this.callState.conversationId
    );

    this.endCall();
  }

  /**
   * 挂断通话
   */
  hangup() {
    if (!this.callState.remoteUserId || !this.callState.conversationId) return;

    socketService.callHangup(
      this.callState.remoteUserId,
      this.callState.conversationId
    );

    this.endCall();
  }

  /**
   * 结束通话并清理资源
   */
  private endCall() {
    // 关闭 PeerConnection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // 停止本地流
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // 清空远程流
    this.remoteStream = null;

    // 重置状态
    this.callState = {
      status: 'idle',
      callType: null,
      isInitiator: false,
      remoteUserId: null,
      conversationId: null,
    };
    this.notifyStateChange();
  }

  /**
   * 获取本地媒体流
   */
  private async getLocalStream(callType: CallType) {
    const constraints: MediaStreamConstraints = {
      audio: true,
      video: callType === 'video',
    };

    this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
    
    if (this.onLocalStreamCallback) {
      this.onLocalStreamCallback(this.localStream);
    }

    return this.localStream;
  }

  /**
   * 创建 PeerConnection
   */
  private createPeerConnection() {
    this.peerConnection = new RTCPeerConnection(this.iceServers);

    // 添加本地流到 PeerConnection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection!.addTrack(track, this.localStream!);
      });
    }

    // 监听远程流
    this.peerConnection.ontrack = (event) => {
      console.log('收到远程流');
      this.remoteStream = event.streams[0];
      if (this.onRemoteStreamCallback) {
        this.onRemoteStreamCallback(this.remoteStream);
      }
    };

    // 监听 ICE Candidate
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.callState.remoteUserId) {
        socketService.webrtcIceCandidate(
          this.callState.remoteUserId,
          event.candidate.toJSON()
        );
      }
    };

    // 监听连接状态
    this.peerConnection.onconnectionstatechange = () => {
      console.log('连接状态:', this.peerConnection?.connectionState);
      if (this.peerConnection?.connectionState === 'disconnected' || 
          this.peerConnection?.connectionState === 'failed') {
        this.endCall();
      }
    };

    return this.peerConnection;
  }

  /**
   * 处理收到通话邀请
   */
  private handleCallInvite(data: { callerId: number; conversationId: number; callType: CallType }) {
    console.log('=== WebRTC: 收到通话邀请 ===');
    console.log('邀请数据:', data);
    console.log('当前状态:', this.callState.status);
    
    this.callState = {
      status: 'ringing',
      callType: data.callType,
      isInitiator: false,
      remoteUserId: data.callerId,
      conversationId: data.conversationId,
    };
    
    console.log('更新后状态:', this.callState);
    console.log('是否有状态变化回调:', !!this.onStateChangeCallback);
    
    this.notifyStateChange();
    console.log('=== 状态变化通知已发送 ===');
  }

  /**
   * 处理对方接受通话
   */
  private async handleCallAccepted(data: { accepterId: number; conversationId: number }) {
    console.log('对方接受通话:', data);
    
    this.callState.status = 'connected';
    this.notifyStateChange();

    // 创建 PeerConnection 并发送 Offer
    await this.createOffer();
  }

  /**
   * 处理对方拒绝通话
   */
  private handleCallRejected(data: { rejecterId: number; conversationId: number }) {
    console.log('对方拒绝通话:', data);
    alert('对方拒绝了通话');
    this.endCall();
  }

  /**
   * 处理对方挂断通话
   */
  private handleCallHangup(data: { userId: number; conversationId: number }) {
    console.log('对方挂断通话:', data);
    this.endCall();
  }

  /**
   * 创建并发送 Offer
   */
  private async createOffer() {
    if (!this.callState.remoteUserId) {
      throw new Error('无效的远程用户 ID');
    }

    const pc = this.createPeerConnection();
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socketService.webrtcOffer(
      this.callState.remoteUserId,
      offer
    );
  }

  /**
   * 处理收到 WebRTC Offer
   */
  private async handleWebRTCOffer(data: { callerId: number; offer: RTCSessionDescriptionInit }) {
    console.log('收到 WebRTC Offer');
    
    const pc = this.createPeerConnection();
    await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
    
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socketService.webrtcAnswer(
      data.callerId,
      answer
    );
  }

  /**
   * 处理收到 WebRTC Answer
   */
  private async handleWebRTCAnswer(data: { answererId: number; answer: RTCSessionDescriptionInit }) {
    console.log('收到 WebRTC Answer');
    
    if (this.peerConnection) {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
    }
  }

  /**
   * 处理收到 ICE Candidate
   */
  private async handleWebRTCIceCandidate(data: { userId: number; candidate: RTCIceCandidateInit }) {
    console.log('收到 ICE Candidate');
    
    if (this.peerConnection) {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
  }

  /**
   * 切换音频静音
   */
  toggleAudio() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return audioTrack.enabled;
      }
    }
    return false;
  }

  /**
   * 切换视频
   */
  toggleVideo() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return videoTrack.enabled;
      }
    }
    return false;
  }

  /**
   * 设置状态变化回调
   */
  onStateChange(callback: (state: CallState) => void) {
    console.log('=== onStateChange 被调用 ===');
    console.log('当前回调是否存在:', !!this.onStateChangeCallback);
    
    this.onStateChangeCallback = callback;
    console.log('状态变化回调已设置');
  }

  /**
   * 设置远程流回调
   */
  onRemoteStream(callback: (stream: MediaStream) => void) {
    this.onRemoteStreamCallback = callback;
  }

  /**
   * 设置本地流回调
   */
  onLocalStream(callback: (stream: MediaStream) => void) {
    this.onLocalStreamCallback = callback;
  }

  /**
   * 通知状态变化
   */
  private notifyStateChange() {
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback({ ...this.callState });
    }
  }

  /**
   * 获取当前通话状态
   */
  getCallState() {
    return { ...this.callState };
  }
}

// 导出单例
export const webrtcService = new WebRTCService();
