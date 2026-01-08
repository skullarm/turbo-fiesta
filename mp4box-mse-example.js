/**
 * Example: Using mp4box.js to Fragment MP4 Data and Playback with MSE
 * 
 * This demonstrates how to:
 * 1. Use mp4box.js to parse and fragment incoming MP4 chunks
 * 2. Add the fragmented data to Media Source Extensions (MSE) for playback
 */

class MP4FragmentationPlayer {
  constructor(videoElement) {
    this.video = videoElement;
    this.mediaSource = null;
    this.sourceBuffer = null;
    this.mp4box = null;
    this.isInitialized = false;
    this.queue = [];
    this.isProcessing = false;
  }

  /**
   * Initialize the player with MediaSource and mp4box
   */
  async init() {
    // Create MediaSource
    this.mediaSource = new MediaSource();
    this.video.src = URL.createObjectURL(this.mediaSource);

    return new Promise((resolve) => {
      this.mediaSource.addEventListener('sourceopen', () => {
        // Create SourceBuffer for video/mp4 codec
        this.sourceBuffer = this.mediaSource.addSourceBuffer('video/mp4; codecs="avc1.42E01E"');
        
        // Handle when data has been appended and is ready for more
        this.sourceBuffer.addEventListener('updateend', () => {
          this.isProcessing = false;
          this._processQueue();
        });

        // Initialize mp4box
        this._initializeMp4Box();
        this.isInitialized = true;
        resolve();
      });
    });
  }

  /**
   * Initialize mp4box instance
   */
  _initializeMp4Box() {
    // Create mp4box instance with file-like object
    this.mp4box = MP4Box.createFile();
    
    // Called when mp4box has parsed initialization segment (moov)
    this.mp4box.onReady = (info) => {
      console.log('MP4 file ready:', info);
      console.log('Video tracks:', info.videoTracks);
      
      // Get the video track
      if (info.videoTracks.length > 0) {
        const videoTrack = info.videoTracks[0];
        
        // Set the track ID to extract samples from
        this.mp4box.setExtractionOptions(videoTrack.id, 'video', {
          nbSamples: 100 // Extract in batches of 100 samples
        });
        
        // Start extracting samples
        this.mp4box.start();
      }
    };

    // Called when fragmented mp4 data is ready to be appended to MSE
    this.mp4box.onSegment = (trackId, user, segment) => {
      console.log('Segment ready for track', trackId);
      
      // Queue the segment data for appending to SourceBuffer
      this.queue.push({
        trackId: trackId,
        data: segment.data
      });
      
      // Process the queue
      this._processQueue();
    };

    // Handle errors
    this.mp4box.onError = (error) => {
      console.error('MP4Box error:', error);
    };
  }

  /**
   * Process queued segments and append to SourceBuffer
   */
  _processQueue() {
    // If already processing or no items in queue, skip
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    const segment = this.queue.shift();
    this.isProcessing = true;

    // Append the fragmented data to the SourceBuffer
    // The data is already in fragmented mp4 format, ready for MSE
    this.sourceBuffer.appendBuffer(segment.data);
  }

  /**
   * Feed incoming MP4 chunks to mp4box for fragmentation
   * Call this as you receive chunks from a network stream or file
   * 
   * @param {ArrayBuffer|Uint8Array} chunk - MP4 data chunk
   * @param {number} offset - Byte offset of this chunk in the complete file
   * @param {boolean} isLastChunk - Whether this is the final chunk
   */
  feedData(chunk, offset, isLastChunk = false) {
    if (!this.isInitialized) {
      console.error('Player not initialized. Call init() first.');
      return;
    }

    // Convert to Uint8Array if needed
    if (chunk instanceof ArrayBuffer) {
      chunk = new Uint8Array(chunk);
    }

    // Append the chunk to mp4box
    // offset tells mp4box where in the file this chunk belongs
    this.mp4box.appendBuffer(chunk, {
      fileStart: offset
    });

    // Signal end of file if this is the last chunk
    if (isLastChunk) {
      this.mp4box.flush();
    }
  }

  /**
   * Play the video
   */
  play() {
    if (this.video) {
      this.video.play();
    }
  }

  /**
   * Pause the video
   */
  pause() {
    if (this.video) {
      this.video.pause();
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.mediaSource && this.mediaSource.readyState === 'open') {
      this.mediaSource.endStream();
    }
    if (this.video.src) {
      URL.revokeObjectURL(this.video.src);
    }
  }
}

/**
 * Usage Example
 */
async function main() {
  // Get video element from DOM
  const videoElement = document.getElementById('video');
  
  // Create player instance
  const player = new MP4FragmentationPlayer(videoElement);
  
  // Initialize
  await player.init();

  // Simulate receiving MP4 chunks from a stream
  // In real application, this would come from fetch(), WebSocket, etc.
  
  try {
    // Fetch an MP4 file as chunks
    const response = await fetch('/path/to/video.mp4');
    const reader = response.body.getReader();
    
    let offset = 0;
    let chunkSize = 1024 * 64; // 64KB chunks
    let done = false;

    while (!done) {
      const { value, done: streamDone } = await reader.read();
      
      if (value) {
        // Feed chunk to mp4box for fragmentation
        player.feedData(value, offset, streamDone);
        offset += value.length;
      }
      
      done = streamDone;
    }

    // Start playback
    player.play();

  } catch (error) {
    console.error('Error:', error);
    player.destroy();
  }
}

// Alternative: Using WebSocket for streaming chunks
async function streamViaWebSocket(wsUrl) {
  const videoElement = document.getElementById('video');
  const player = new MP4FragmentationPlayer(videoElement);
  await player.init();

  const ws = new WebSocket(wsUrl);
  let offset = 0;

  ws.onmessage = (event) => {
    // Assuming server sends MP4 chunks as binary
    const chunk = event.data;
    player.feedData(chunk, offset, false);
    offset += chunk.size || chunk.length;
  };

  ws.onclose = () => {
    // Signal end of stream
    player.feedData(new Uint8Array(0), offset, true);
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    player.destroy();
  };

  player.play();
}

// Export for use as module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MP4FragmentationPlayer };
}
