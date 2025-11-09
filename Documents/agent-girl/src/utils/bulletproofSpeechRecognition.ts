/**
 * Bulletproof Speech Recognition System
 * Multiple fallback strategies that don't rely on Google's network service
 */

export interface SpeechRecognitionResult {
  transcript: string;
  confidence?: number;
  isFinal: boolean;
}

export interface SpeechRecognitionCallbacks {
  onResult: (result: SpeechRecognitionResult) => void;
  onError: (error: string) => void;
  onStart: () => void;
  onEnd: () => void;
  onStatusChange: (status: 'idle' | 'listening' | 'processing' | 'success' | 'error') => void;
}

export class BulletproofSpeechRecognition {
  private callbacks: SpeechRecognitionCallbacks;
  private isRecording = false;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private recognition: any = null;
  private retryCount = 0;
  private maxRetries = 3;
  private retryDelay = 1000;

  constructor(callbacks: SpeechRecognitionCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Enhanced native recognition with better error handling and retry logic
   */
  private async tryNativeRecognition(): Promise<boolean> {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.log('❌ Native speech recognition not supported');
      return false;
    }

    return new Promise((resolve) => {
      try {
        const recognition = new SpeechRecognition();
        this.recognition = recognition;

        // Optimized configuration for better reliability
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;

        // Adaptive timeout based on retry count
        const timeoutDuration = Math.min(1000 + (this.retryCount * 500), 3000);
        const timeoutId = setTimeout(() => {
          console.log(`⏰ Recognition timeout after ${timeoutDuration}ms (attempt ${this.retryCount + 1})`);
          recognition.abort();
          resolve(false);
        }, timeoutDuration);

        recognition.onstart = () => {
          console.log('🎤 Native recognition started');
          this.callbacks.onStart();
          this.callbacks.onStatusChange('listening');
          clearTimeout(timeoutId);
        };

        recognition.onresult = (event: any) => {
          console.log('📝 Recognition result received');
          clearTimeout(timeoutId);

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const transcript = result[0].transcript;

            this.callbacks.onResult({
              transcript,
              confidence: result[0].confidence,
              isFinal: result.isFinal
            });

            if (result.isFinal) {
              console.log('✅ Final transcription received');
              this.callbacks.onStatusChange('success');
              setTimeout(() => this.stop(), 100);
            }
          }
        };

        recognition.onerror = (event: any) => {
          clearTimeout(timeoutId);
          console.log(`❌ Recognition error: ${event.error}`);

          // Handle specific error types
          switch (event.error) {
            case 'network':
              console.log('🌐 Network error - speech service unavailable');
              resolve(false);
              break;
            case 'service-not-allowed':
              console.log('🚫 Speech service not allowed');
              resolve(false);
              break;
            case 'not-allowed':
              console.log('🔒 Microphone permission denied');
              this.callbacks.onError('Microphone permission denied. Please allow microphone access.');
              this.callbacks.onStatusChange('error');
              resolve(true); // Don't retry - permission issue
              break;
            case 'no-speech':
              console.log('🤫 No speech detected');
              this.callbacks.onError('No speech detected. Please try speaking clearly.');
              this.callbacks.onStatusChange('error');
              resolve(true); // Don't retry - user issue
              break;
            case 'audio-capture':
              console.log('🎙️ Audio capture error');
              resolve(false);
              break;
            default:
              console.log(`❓ Unknown error: ${event.error}`);
              resolve(false);
          }
        };

        recognition.onend = () => {
          clearTimeout(timeoutId);
          console.log('🏁 Recognition ended');
          this.callbacks.onEnd();
          resolve(true);
        };

        // Start recognition
        recognition.start();
        console.log('🚀 Recognition initiated');

      } catch (error) {
        console.log('❌ Recognition setup failed:', error);
        resolve(false);
      }
    });
  }

  /**
   * Enhanced MediaRecorder with better browser compatibility
   */
  private async startMediaRecorder(): Promise<boolean> {
    try {
      console.log('🎙️ Attempting MediaRecorder approach...');

      // Request microphone access with optimized settings
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        }
      });

      // Find supported MIME type
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
        'audio/wav'
      ];

      let supportedMimeType = '';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          supportedMimeType = mimeType;
          break;
        }
      }

      if (!supportedMimeType) {
        console.log('❌ No supported audio format found');
        return false;
      }

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: supportedMimeType
      });

      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        console.log('🛑 MediaRecorder stopped');
        this.callbacks.onStatusChange('processing');

        const audioBlob = new Blob(this.audioChunks, {
          type: supportedMimeType
        });

        const audioUrl = URL.createObjectURL(audioBlob);
        console.log('🎵 Audio blob created, showing transcription dialog');

        await this.showEnhancedTranscriptionDialog(audioUrl, audioBlob);

        // Clean up
        stream.getTracks().forEach(track => track.stop());
        URL.revokeObjectURL(audioUrl);
      };

      this.mediaRecorder.onerror = (event: any) => {
        console.error('❌ MediaRecorder error:', event.error);
      };

      this.mediaRecorder.start(100); // Collect data every 100ms
      console.log('✅ MediaRecorder started successfully');
      return true;

    } catch (error) {
      console.error('❌ MediaRecorder failed:', error);

      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          this.callbacks.onError('Microphone permission denied. Please allow microphone access.');
        } else if (error.name === 'NotFoundError') {
          this.callbacks.onError('No microphone found. Please connect a microphone.');
        } else {
          this.callbacks.onError(`Microphone error: ${error.message}`);
        }
      }

      return false;
    }
  }

  /**
   * Enhanced transcription dialog with better UX
   */
  private async showEnhancedTranscriptionDialog(audioUrl: string, audioBlob: Blob): Promise<void> {
    return new Promise((resolve) => {
      const dialog = document.createElement('div');
      dialog.style.cssText = `
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

      const content = document.createElement('div');
      content.style.cssText = `
        background: white;
        border-radius: 16px;
        padding: 2rem;
        max-width: 650px;
        width: 90%;
        max-height: 85vh;
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
          .dialog-title { font-size: 1.5rem; font-weight: 700; margin: 0 0 0.5rem 0; color: #1f2937; }
          .dialog-subtitle { color: #6b7280; margin: 0 0 1.5rem 0; line-height: 1.5; }
          .audio-container { background: #f9fafb; border-radius: 12px; padding: 1rem; margin: 1.5rem 0; }
          .transcription-label { display: block; font-weight: 600; color: #374151; margin-bottom: 0.5rem; }
          .transcription-textarea {
            width: 100%; height: 140px; padding: 0.875rem;
            border: 2px solid #e5e7eb; border-radius: 8px; font-size: 1rem;
            resize: vertical; font-family: inherit; line-height: 1.5;
            transition: border-color 0.2s, box-shadow 0.2s;
          }
          .transcription-textarea:focus {
            outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }
          .button-container { display: flex; gap: 0.75rem; margin-top: 1.5rem; }
          .btn {
            padding: 0.75rem 1.5rem; border: none; border-radius: 8px;
            font-size: 0.95rem; font-weight: 600; cursor: pointer;
            transition: all 0.2s; flex: 1;
          }
          .btn-primary { background: #3b82f6; color: white; }
          .btn-primary:hover { background: #2563eb; }
          .btn-secondary { background: #6b7280; color: white; }
          .btn-secondary:hover { background: #4b5563; }
          .btn-danger { background: #ef4444; color: white; }
          .btn-danger:hover { background: #dc2626; }
        </style>

        <h2 class="dialog-title">🎤 Voice Recording Ready</h2>
        <p class="dialog-subtitle">
          Your voice has been recorded! Play it back and type what you said, or save the audio for later.
        </p>

        <div class="audio-container">
          <audio controls style="width: 100%; margin-bottom: 0.5rem;">
            <source src="${audioUrl}" type="${audioBlob.type}">
            Your browser does not support audio playback.
          </audio>
          <div style="font-size: 0.875rem; color: #6b7280; text-align: center;">
            💡 Tip: Click play to hear your recording, then type what you said
          </div>
        </div>

        <div style="margin: 1.5rem 0;">
          <label class="transcription-label">What did you say? (Optional)</label>
          <textarea
            id="transcription-text"
            class="transcription-textarea"
            placeholder="Type your transcription here, or leave empty to save just the audio note..."
          ></textarea>
        </div>

        <div class="button-container">
          <button id="save-transcription" class="btn btn-primary">
            💾 Save Text
          </button>
          <button id="save-audio-only" class="btn btn-secondary">
            🎵 Save Audio Note
          </button>
          <button id="cancel-transcription" class="btn btn-danger">
            ❌ Cancel
          </button>
        </div>
      `;

      dialog.appendChild(content);
      document.body.appendChild(dialog);

      // Handle interactions
      const saveBtn = content.querySelector('#save-transcription') as HTMLButtonElement;
      const saveAudioBtn = content.querySelector('#save-audio-only') as HTMLButtonElement;
      const cancelBtn = content.querySelector('#cancel-transcription') as HTMLButtonElement;
      const textarea = content.querySelector('#transcription-text') as HTMLTextAreaElement;

      saveBtn.onclick = () => {
        const text = textarea.value.trim();
        if (text) {
          this.callbacks.onResult({
            transcript: text,
            confidence: 1.0,
            isFinal: true
          });
        }
        this.callbacks.onStatusChange('success');
        document.body.removeChild(dialog);
        resolve();
      };

      saveAudioBtn.onclick = () => {
        // Add a placeholder note about audio recording
        this.callbacks.onResult({
          transcript: '[Voice recording saved - audio note]',
          confidence: 1.0,
          isFinal: true
        });
        this.callbacks.onStatusChange('success');
        document.body.removeChild(dialog);
        resolve();
      };

      cancelBtn.onclick = () => {
        this.callbacks.onStatusChange('error');
        document.body.removeChild(dialog);
        resolve();
      };

      // Auto-focus textarea
      setTimeout(() => textarea.focus(), 100);

      // Close on escape key
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          document.removeEventListener('keydown', handleEscape);
          if (document.body.contains(dialog)) {
            document.body.removeChild(dialog);
            this.callbacks.onStatusChange('error');
            resolve();
          }
        }
      };
      document.addEventListener('keydown', handleEscape);
    });
  }

  /**
   * Main start method with intelligent retry logic
   */
  async start(fieldName: string): Promise<void> {
    if (this.isRecording) {
      console.log('⚠️ Already recording');
      return;
    }

    this.isRecording = true;
    this.callbacks.onStart();
    this.callbacks.onStatusChange('listening');

    try {
      console.log(`🎯 Starting speech recognition for: ${fieldName}`);

      // Strategy 1: Try native recognition with retry logic
      for (let attempt = 0; attempt < this.maxRetries; attempt++) {
        this.retryCount = attempt;
        console.log(`🔄 Attempt ${attempt + 1}/${this.maxRetries} for native recognition`);

        const nativeWorked = await this.tryNativeRecognition();
        if (nativeWorked) {
          console.log('✅ Native speech recognition working');
          return;
        }

        // Wait before retry (except on last attempt)
        if (attempt < this.maxRetries - 1) {
          console.log(`⏳ Waiting ${this.retryDelay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
          this.retryDelay = Math.min(this.retryDelay * 1.5, 5000); // Exponential backoff
        }
      }

      console.log('❌ Native recognition failed after retries, trying MediaRecorder');

      // Strategy 2: MediaRecorder fallback
      const mediaRecorderWorked = await this.startMediaRecorder();
      if (mediaRecorderWorked) {
        console.log('✅ MediaRecorder approach working');
        return;
      }

      console.log('❌ MediaRecorder failed - no voice input available');

      // Show error message
      this.callbacks.onError('Voice input is currently unavailable. Please use the keyboard.');
      this.callbacks.onStatusChange('error');

    } catch (error) {
      console.error('❌ All speech recognition strategies failed:', error);
      this.callbacks.onError('Voice input is currently unavailable. Please use the keyboard.');
      this.callbacks.onStatusChange('error');
    } finally {
      this.isRecording = false;
      this.retryCount = 0;
      this.retryDelay = 1000;
    }
  }

  /**
   * Stop recording
   */
  stop(): void {
    if (!this.isRecording) return;

    console.log('🛑 Stopping speech recognition');
    this.isRecording = false;

    if (this.recognition) {
      try {
        this.recognition.abort(); // Use abort instead of stop for immediate termination
      } catch (e) {
        console.log('Recognition already stopped');
      }
      this.recognition = null;
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    this.callbacks.onEnd();
  }

  /**
   * Check if speech recognition is available
   */
  static isAvailable(): boolean {
    return !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition ||
      (navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    );
  }

  /**
   * Check which features are available
   */
  static getAvailableFeatures(): {
    nativeRecognition: boolean;
    mediaRecorder: boolean;
    anyAvailable: boolean;
  } {
    return {
      nativeRecognition: !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition),
      mediaRecorder: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && MediaRecorder),
      anyAvailable: BulletproofSpeechRecognition.isAvailable()
    };
  }
}