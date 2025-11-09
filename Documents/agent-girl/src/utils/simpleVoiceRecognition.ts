/**
 * Simple Voice Recognition System
 * Clean, straightforward implementation using webkitSpeechRecognition
 */

export interface VoiceRecognitionCallbacks {
  onTranscript: (transcript: string) => void;
  onError: (error: string) => void;
  onStart: () => void;
  onEnd: () => void;
}

export class SimpleVoiceRecognition {
  private callbacks: VoiceRecognitionCallbacks;
  private recognition: any = null;
  private isListening = false;

  constructor(callbacks: VoiceRecognitionCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Check if speech recognition is supported
   */
  static isSupported(): boolean {
    return 'webkitSpeechRecognition' in window;
  }

  /**
   * Start voice recognition
   */
  start(): void {
    if (this.isListening) {
      console.log('🎤 Already listening');
      return;
    }

    if (!SimpleVoiceRecognition.isSupported()) {
      this.callbacks.onError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    try {
      // Create new recognition instance
      this.recognition = new (window as any).webkitSpeechRecognition();

      // Configure recognition
      this.recognition.lang = 'en-US';
      this.recognition.interimResults = true;
      this.recognition.continuous = true;
      this.recognition.maxAlternatives = 1;

      // Handle results
      this.recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          const transcript = result[0].transcript;

          if (result.isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        // Send final or interim transcript
        const transcript = finalTranscript || interimTranscript;
        if (transcript) {
          this.callbacks.onTranscript(transcript);
        }
      };

      // Handle errors
      this.recognition.onerror = (event: any) => {
        console.error('❌ Recognition error:', event.error);

        let errorMessage = 'Speech recognition error';
        switch (event.error) {
          case 'network':
            errorMessage = 'Network error - please check your internet connection';
            break;
          case 'not-allowed':
          case 'service-not-allowed':
            errorMessage = 'Microphone permission denied. Please allow microphone access.';
            break;
          case 'no-speech':
            errorMessage = 'No speech detected. Please try speaking clearly.';
            break;
          case 'audio-capture':
            errorMessage = 'Microphone not found or not working.';
            break;
          default:
            errorMessage = `Speech recognition error: ${event.error}`;
        }

        this.callbacks.onError(errorMessage);
        this.stop();
      };

      // Handle end of recognition
      this.recognition.onend = () => {
        console.log('🏁 Recognition ended');
        this.isListening = false;
        this.callbacks.onEnd();
      };

      // Handle start of recognition
      this.recognition.onstart = () => {
        console.log('🎙️ Recognition started');
        this.isListening = true;
        this.callbacks.onStart();
      };

      // Start recognition
      this.recognition.start();
      console.log('🚀 Voice recognition started successfully');

    } catch (error) {
      console.error('❌ Failed to start voice recognition:', error);
      this.callbacks.onError('Failed to start voice recognition. Please check microphone permissions.');
      this.isListening = false;
    }
  }

  /**
   * Stop voice recognition
   */
  stop(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
        console.log('🛑 Voice recognition stopped');
      } catch (error) {
        console.log('Recognition already stopped or error stopping:', error);
      }
    }
    this.isListening = false;
  }

  /**
   * Check if currently listening
   */
  isActive(): boolean {
    return this.isListening;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stop();
    this.recognition = null;
  }
}

/**
 * Voice Recording Modal - for live transcript display and approval
 */
export class VoiceRecordingModal {
  private onApprove: (transcript: string) => void;
  private onCancel: () => void;
  private modalElement: HTMLDivElement | null = null;

  constructor(onApprove: (transcript: string) => void, onCancel: () => void) {
    this.onApprove = onApprove;
    this.onCancel = onCancel;
  }

  /**
   * Show the voice recording modal
   */
  show(): void {
    // Create modal container
    this.modalElement = document.createElement('div');
    this.modalElement.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      backdrop-filter: blur(4px);
    `;

    // Create modal content
    const content = document.createElement('div');
    content.style.cssText = `
      background: white;
      border-radius: 16px;
      padding: 2rem;
      max-width: 600px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      animation: slideIn 0.3s ease-out;
    `;

    content.innerHTML = `
      <style>
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-red {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .modal-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0 0 0.5rem 0;
          color: #1f2937;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .modal-subtitle {
          color: #6b7280;
          margin: 0 0 1.5rem 0;
          line-height: 1.5;
        }
        .transcript-container {
          background: #f9fafb;
          border-radius: 12px;
          padding: 1.5rem;
          margin: 1.5rem 0;
          border: 2px solid #e5e7eb;
          min-height: 120px;
          max-height: 300px;
          overflow-y: auto;
        }
        .transcript-text {
          font-size: 1.1rem;
          line-height: 1.6;
          color: #374151;
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        .transcript-placeholder {
          color: #9ca3af;
          font-style: italic;
        }
        .recording-indicator {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          color: #dc2626;
          font-weight: 600;
          margin-bottom: 1rem;
        }
        .recording-dot {
          width: 12px;
          height: 12px;
          background: #dc2626;
          border-radius: 50%;
          animation: pulse-red 1.5s infinite;
        }
        .button-container {
          display: flex;
          gap: 0.75rem;
          margin-top: 1.5rem;
        }
        .btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          flex: 1;
        }
        .btn-primary {
          background: #3b82f6;
          color: white;
        }
        .btn-primary:hover {
          background: #2563eb;
          transform: translateY(-1px);
        }
        .btn-primary:disabled {
          background: #9ca3af;
          cursor: not-allowed;
          transform: none;
        }
        .btn-secondary {
          background: #6b7280;
          color: white;
        }
        .btn-secondary:hover {
          background: #4b5563;
          transform: translateY(-1px);
        }
        .btn-danger {
          background: #ef4444;
          color: white;
        }
        .btn-danger:hover {
          background: #dc2626;
          transform: translateY(-1px);
        }
      </style>

      <h2 class="modal-title">
        <span class="recording-dot"></span>
        Voice Recording
      </h2>
      <p class="modal-subtitle">
        Speak clearly into your microphone. Your words will appear below as you speak.
      </p>

      <div class="recording-indicator">
        🎙️ Recording... Speak now
      </div>

      <div class="transcript-container">
        <div id="transcript-text" class="transcript-text transcript-placeholder">
          Waiting for speech...
        </div>
      </div>

      <div class="button-container">
        <button id="approve-btn" class="btn btn-primary" disabled>
          ✅ Approve & Insert
        </button>
        <button id="cancel-btn" class="btn btn-danger">
          ❌ Cancel
        </button>
      </div>
    `;

    this.modalElement.appendChild(content);
    document.body.appendChild(this.modalElement);

    // Set up event listeners
    this.setupEventListeners();

    // Close on escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        document.removeEventListener('keydown', handleEscape);
        this.hide();
        this.onCancel();
      }
    };
    document.addEventListener('keydown', handleEscape);
  }

  /**
   * Update the transcript text
   */
  updateTranscript(transcript: string): void {
    const transcriptElement = this.modalElement?.querySelector('#transcript-text') as HTMLDivElement;
    const approveBtn = this.modalElement?.querySelector('#approve-btn') as HTMLButtonElement;

    if (transcriptElement) {
      if (transcript.trim()) {
        transcriptElement.textContent = transcript;
        transcriptElement.classList.remove('transcript-placeholder');
        if (approveBtn) approveBtn.disabled = false;
      } else {
        transcriptElement.textContent = 'Waiting for speech...';
        transcriptElement.classList.add('transcript-placeholder');
        if (approveBtn) approveBtn.disabled = true;
      }
    }
  }

  /**
   * Update recording status
   */
  setRecordingStatus(isRecording: boolean): void {
    const indicator = this.modalElement?.querySelector('.recording-indicator') as HTMLDivElement;
    if (indicator) {
      if (isRecording) {
        indicator.innerHTML = `
          <span class="recording-dot"></span>
          🎙️ Recording... Speak now
        `;
      } else {
        indicator.innerHTML = `✅ Recording complete`;
        indicator.style.background = '#f0fdf4';
        indicator.style.borderColor = '#bbf7d0';
        indicator.style.color = '#16a34a';
      }
    }
  }

  /**
   * Hide the modal
   */
  hide(): void {
    if (this.modalElement && document.body.contains(this.modalElement)) {
      document.body.removeChild(this.modalElement);
    }
    this.modalElement = null;
  }

  /**
   * Set up event listeners for modal buttons
   */
  private setupEventListeners(): void {
    const approveBtn = this.modalElement?.querySelector('#approve-btn') as HTMLButtonElement;
    const cancelBtn = this.modalElement?.querySelector('#cancel-btn') as HTMLButtonElement;

    if (approveBtn) {
      approveBtn.addEventListener('click', () => {
        const transcriptElement = this.modalElement?.querySelector('#transcript-text') as HTMLDivElement;
        const transcript = transcriptElement?.textContent || '';

        if (transcript && transcript !== 'Waiting for speech...') {
          this.hide();
          this.onApprove(transcript.trim());
        }
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.hide();
        this.onCancel();
      });
    }
  }
}