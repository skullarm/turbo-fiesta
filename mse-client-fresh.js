/**
 * Fresh MP4 MSE Client - Clean implementation for streaming fragmented MP4s
 * Uses mp4box.js for on-the-fly MP4 fragmentation and MediaSource Extensions for playback
 * 
 * Key design principles:
 * - Simple, focused flow: receive chunks → parse → fragment → feed to MSE → play
 * - Intelligent memory management: trim buffers as video plays
 * - Chrome-optimized (MSE support, codec detection)
 * - No external dependencies beyond mp4box.js
 */

class MP4StreamPlayer {
  constructor(options = {}) {
    this.videoElement = options.videoElement || document.querySelector('video');
    this.serverUrl = options.serverUrl || 'ws://localhost:8000';
    
    // MP4 parsing state
    this.mp4file = null;
    this.ws = null;
    this.isConnected = false;
    
    // MSE state
    this.mediaSource = null;
    this.sourceBuffers = {}; // { 'video': SourceBuffer, 'audio': SourceBuffer }
    this.codecStrings = null;
    
    // Buffering & playback state
    this.isInitialized = false;
    this.totalDuration = 0;
    this.lastTrimTime = 0;
    this.TRIM_THRESHOLD = 30; // seconds - keep 30s behind playback
    this.MAX_BUFFER_AHEAD = 60; // seconds - max buffer ahead of playback
    
    this.log('Initializing MP4StreamPlayer');
  }

  log(msg, data) {
    const time = new Date().toLocaleTimeString();
    console.log(`[${time}] ${msg}`, data || '');
  }

  /**
   * Connect to WebSocket server and start streaming
   */
  async connect(url) {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = url || this.serverUrl;
        this.ws = new WebSocket(wsUrl);
        
        this.ws.binaryType = 'arraybuffer';
        
        this.ws.onopen = () => {
          this.isConnected = true;
          this.log('✓ WebSocket connected');
          resolve();
        };
        
        this.ws.onmessage = (event) => this.handleStreamData(event.data);
        
        this.ws.onerror = (error) => {
          this.log('✗ WebSocket error:', error);
          reject(error);
        };
        
        this.ws.onclose = () => {
          this.isConnected = false;
          this.log('WebSocket closed');
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Request a file from the server
   */
  requestFile(fileUrl) {
    if (!this.isConnected) {
      throw new Error('Not connected to server');
    }
    this.log(`Requesting: ${fileUrl}`);
    this.ws.send(JSON.stringify({ action: 'request', url: fileUrl }));
  }

  /**
   * Handle incoming stream data from server
   */
  handleStreamData(data) {
    if (data instanceof ArrayBuffer) {
      this.feedMP4Data(data);
    } else if (typeof data === 'string') {
      try {
        const msg = JSON.parse(data);
        this.handleServerMessage(msg);
      } catch (e) {
        this.log('Failed to parse server message', e);
      }
    }
  }

  /**
   * Handle server control messages
   */
  handleServerMessage(msg) {
    if (msg.type === 'ready') {
      this.log('Server ready for streaming');
    } else if (msg.type === 'error') {
      this.log('Server error:', msg.message);
    }
  }

  /**
   * Feed raw MP4 data to parser
   */
  feedMP4Data(buffer) {
    if (!this.mp4file) {
      this.initializeMP4Parser();
    }

    try {
      const uint8arr = new Uint8Array(buffer);
      const boxBuffer = this.createMP4BoxBuffer(buffer);
      
      // appendBuffer triggers parsing and onReady/onSegment callbacks
      const nextPos = this.mp4file.appendBuffer(boxBuffer, false);
      
      if (nextPos === undefined) {
        this.log('⚠ appendBuffer returned undefined');
      }
    } catch (err) {
      this.log('✗ Error feeding MP4 data:', err);
    }
  }

  /**
   * Create MP4BoxBuffer with proper fileStart tracking
   */
  createMP4BoxBuffer(arrayBuffer) {
    // MP4BoxBuffer is defined in mp4box.js - it's an ArrayBuffer with fileStart tracking
    const buffer = new ArrayBuffer(arrayBuffer.byteLength);
    new Uint8Array(buffer).set(new Uint8Array(arrayBuffer));
    
    buffer.fileStart = 0;
    buffer.usedBytes = 0;
    
    return buffer;
  }

  /**
   * Initialize the mp4box.js ISOFile parser
   */
  initializeMP4Parser() {
    this.log('Initializing mp4box parser...');
    
    // createFile is exported from mp4box.js
    this.mp4file = createFile(false); // false = discardMdatData (we want the data)
    
    // Called when moov box is received and file is playable
    this.mp4file.onReady = (info) => {
      this.log('✓ MP4 ready', {
        duration: info.duration,
        timescale: info.timescale,
        tracks: info.videoTracks.length + info.audioTracks.length
      });
      this.handleMP4Ready(info);
    };
    
    // Called when segments are ready for playback
    this.mp4file.onSegment = (segmentId, userId, segmentBuffer, sampleNum, isLast) => {
      this.log(`Segment ready: id=${segmentId} samples=${sampleNum} ${isLast ? '(FINAL)' : ''}`);
      // Note: for initial implementation, we use sample-level feeding
    };
    
    // Called when samples are extracted
    this.mp4file.onSamples = (trackId, userId, samples) => {
      this.feedSamplesToBuffer(trackId, samples);
    };
  }

  /**
   * Handle when MP4 file is ready for playback
   */
  async handleMP4Ready(info) {
    this.log('📊 File info:', {
      videoTracks: info.videoTracks.length,
      audioTracks: info.audioTracks.length,
      duration: (info.duration / info.timescale).toFixed(2) + 's',
      mime: info.mime
    });

    if (info.videoTracks.length === 0) {
      this.log('✗ No video track found');
      return;
    }

    this.totalDuration = info.duration / info.timescale;
    this.codecStrings = this.extractCodecs(info);

    try {
      // Set extraction options to get samples as they're available
      for (const track of info.VideoTracks || []) {
        this.mp4file.setExtractionOptions(track.id, null, { nbSamples: 10 });
      }
      for (const track of info.AudioTracks || []) {
        if (info.audioTracks.length > 0) {
          this.mp4file.setExtractionOptions(info.audioTracks[0].id, null, { nbSamples: 10 });
        }
      }

      // Initialize MediaSource
      await this.initializeMediaSource(info);
      
      // Start pulling samples
      this.mp4file.start();
    } catch (err) {
      this.log('✗ Error in onReady:', err);
    }
  }

  /**
   * Extract codec strings from track info
   */
  extractCodecs(info) {
    const codecs = {};
    
    if (info.videoTracks && info.videoTracks.length > 0) {
      const videoTrack = info.videoTracks[0];
      codecs.video = videoTrack.codec;
      codecs.videoInfo = {
        id: videoTrack.id,
        width: videoTrack.video.width,
        height: videoTrack.video.height,
        type: videoTrack.type
      };
    }
    
    if (info.audioTracks && info.audioTracks.length > 0) {
      const audioTrack = info.audioTracks[0];
      codecs.audio = audioTrack.codec;
      codecs.audioInfo = {
        id: audioTrack.id,
        channels: audioTrack.audio.channel_count,
        rate: audioTrack.audio.sample_rate,
        type: audioTrack.type
      };
    }
    
    return codecs;
  }

  /**
   * Initialize MediaSource and SourceBuffers
   */
  async initializeMediaSource(info) {
    return new Promise((resolve, reject) => {
      try {
        this.mediaSource = new MediaSource();
        
        this.mediaSource.addEventListener('sourceopen', () => {
          this.log('✓ MediaSource opened');
          
          // Create video SourceBuffer
          if (info.videoTracks.length > 0) {
            const videoTrack = info.videoTracks[0];
            const videoMimeType = `video/mp4; codecs="${videoTrack.codec}"`;
            
            if (!MediaSource.isTypeSupported(videoMimeType)) {
              this.log('✗ Video codec not supported:', videoMimeType);
              return reject(new Error('Unsupported video codec'));
            }
            
            this.sourceBuffers.video = this.mediaSource.addSourceBuffer(videoMimeType);
            this.sourceBuffers.video.addEventListener('update', () => this.onBufferUpdate());
            this.sourceBuffers.video.addEventListener('updateend', () => this.onBufferUpdateEnd('video'));
            this.log('✓ Video SourceBuffer created:', videoMimeType);
          }
          
          // Create audio SourceBuffer
          if (info.audioTracks.length > 0) {
            const audioTrack = info.audioTracks[0];
            const audioMimeType = `audio/mp4; codecs="${audioTrack.codec}"`;
            
            if (!MediaSource.isTypeSupported(audioMimeType)) {
              this.log('⚠ Audio codec not supported:', audioMimeType);
            } else {
              this.sourceBuffers.audio = this.mediaSource.addSourceBuffer(audioMimeType);
              this.sourceBuffers.audio.addEventListener('update', () => this.onBufferUpdate());
              this.sourceBuffers.audio.addEventListener('updateend', () => this.onBufferUpdateEnd('audio'));
              this.log('✓ Audio SourceBuffer created:', audioMimeType);
            }
          }
          
          this.isInitialized = true;
          resolve();
        });
        
        this.mediaSource.addEventListener('error', (e) => {
          this.log('✗ MediaSource error:', e);
          reject(e);
        });
        
        // Attach MediaSource to video element
        this.videoElement.src = URL.createObjectURL(this.mediaSource);
        
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Feed samples to appropriate SourceBuffer
   */
  feedSamplesToBuffer(trackId, samples) {
    if (!this.isInitialized || !samples || samples.length === 0) {
      return;
    }

    try {
      // Determine track type
      const trackInfo = this.codecStrings.videoInfo?.id === trackId ? 'video' : 'audio';
      const buffer = this.sourceBuffers[trackInfo];
      
      if (!buffer) {
        return;
      }

      // Queue samples for this track
      if (!this.sampleQueues) {
        this.sampleQueues = { video: [], audio: [] };
      }
      
      this.sampleQueues[trackInfo].push(...samples);
      
      // Process queue if buffer is ready
      this.processBufferQueue(trackInfo);
      
    } catch (err) {
      this.log('✗ Error feeding samples:', err);
    }
  }

  /**
   * Process queued samples into SourceBuffer
   */
  processBufferQueue(trackType) {
    const buffer = this.sourceBuffers[trackType];
    const queue = this.sampleQueues?.[trackType];
    
    if (!buffer || !queue || queue.length === 0) {
      return;
    }

    // Only append if buffer is not updating
    if (buffer.updating) {
      return;
    }

    try {
      const sample = queue.shift();
      
      if (sample.data) {
        buffer.appendBuffer(sample.data);
      }
      
      // Continue processing if more samples
      if (queue.length > 0) {
        setTimeout(() => this.processBufferQueue(trackType), 0);
      }
      
    } catch (err) {
      this.log(`✗ Error appending to ${trackType} buffer:`, err);
    }
  }

  /**
   * Called when SourceBuffer finishes updating
   */
  onBufferUpdateEnd(trackType) {
    // Continue feeding more samples
    this.processBufferQueue(trackType);
    
    // Manage buffer size
    this.trimBuffers();
  }

  /**
   * Called when SourceBuffer is updating
   */
  onBufferUpdate() {
    // Can check buffer status here
  }

  /**
   * Trim old data from buffers to manage memory
   */
  trimBuffers() {
    if (!this.videoElement || this.videoElement.paused) {
      return;
    }

    const currentTime = this.videoElement.currentTime;
    const now = Date.now();
    
    // Only trim every 2 seconds to avoid frequent operations
    if (now - this.lastTrimTime < 2000) {
      return;
    }
    this.lastTrimTime = now;

    try {
      for (const [trackType, buffer] of Object.entries(this.sourceBuffers)) {
        if (!buffer || buffer.updating) {
          continue;
        }

        // Remove buffered data that's more than TRIM_THRESHOLD behind current playback
        const trimBeforeTime = Math.max(0, currentTime - this.TRIM_THRESHOLD);
        
        if (trimBeforeTime > 0 && buffer.buffered.length > 0) {
          for (let i = 0; i < buffer.buffered.length; i++) {
            const end = buffer.buffered.end(i);
            if (end < trimBeforeTime) {
              // Safe to remove this range
              const start = buffer.buffered.start(i);
              try {
                buffer.remove(start, end);
                this.log(`Trimmed ${trackType} buffer: ${start.toFixed(2)}s - ${end.toFixed(2)}s`);
              } catch (err) {
                // Ignore trim errors
              }
            }
          }
        }
      }
    } catch (err) {
      this.log('⚠ Error trimming buffers:', err);
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    try {
      if (this.mediaSource && this.mediaSource.readyState === 'open') {
        if (this.sourceBuffers.video) {
          this.mediaSource.removeSourceBuffer(this.sourceBuffers.video);
        }
        if (this.sourceBuffers.audio) {
          this.mediaSource.removeSourceBuffer(this.sourceBuffers.audio);
        }
        this.mediaSource.endOfStream();
      }
      
      if (this.ws) {
        this.ws.close();
      }
      
      if (this.videoElement && this.videoElement.src) {
        URL.revokeObjectURL(this.videoElement.src);
      }
      
      this.log('Player cleaned up');
    } catch (err) {
      this.log('Error during cleanup:', err);
    }
  }

  /**
   * Get current playback status
   */
  getStatus() {
    const bufferedRanges = [];
    if (this.sourceBuffers.video && this.sourceBuffers.video.buffered) {
      for (let i = 0; i < this.sourceBuffers.video.buffered.length; i++) {
        bufferedRanges.push({
          start: this.sourceBuffers.video.buffered.start(i),
          end: this.sourceBuffers.video.buffered.end(i)
        });
      }
    }
    
    return {
      isConnected: this.isConnected,
      isInitialized: this.isInitialized,
      duration: this.totalDuration,
      currentTime: this.videoElement?.currentTime || 0,
      buffered: bufferedRanges,
      videoCodec: this.codecStrings?.video || 'unknown',
      audioCodec: this.codecStrings?.audio || 'unknown'
    };
  }
}

// Export for use in Node/module environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MP4StreamPlayer;
}
