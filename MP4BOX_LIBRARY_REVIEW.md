# MP4box.js Library Review - Deep Dive

## Overview

The mp4box.js library (v0.5.0+) is a pure JavaScript ISO Base Media File Format (MP4) parser/generator. From the minified code provided, I've analyzed its key components:

### Library Exports

```javascript
// Main API (from the minified code analysis)
createFile(discardMdatData, arrayBuffer)  → ISOFile instance
registerBoxes(classMap)                   → Register custom box parsers
registerDescriptors(descriptorMap)        → Register descriptor types
```

---

## Core Classes Architecture

### 1. DataStream (Binary I/O)

**Purpose**: Abstraction for reading/writing binary data with endianness handling

```javascript
new DataStream(arrayBuffer, byteOffset, endianness)

// Methods for primitives:
.readUint8/16/32/64()
.readInt8/16/32/64()
.readFloat32/64()
.readString(length, encoding)

// Methods for arrays:
.readUint8Array(length) → Uint8Array
.readInt32Array(length) → Int32Array with endianness conversion

// Position tracking:
.seek(position)
.getPosition()
.isEof()
```

**Why it matters**: MP4 boxes nested at various byte positions; DataStream maintains fileStart tracking for fragments.

### 2. MP4BoxBuffer (Smart ArrayBuffer)

**Purpose**: ArrayBuffer that tracks its position in the overall file

```javascript
class MP4BoxBuffer extends ArrayBuffer {
  fileStart = 0;      // Absolute position in overall stream
  usedBytes = 0;      // Bytes already processed
}

// Created when feeding data:
const buf = new MP4BoxBuffer(chunkSize);
buf.fileStart = currentFilePosition;  // ← CRITICAL for fragmentation
```

**Why it matters**: When streaming in chunks, mp4box needs to know absolute file position to correctly calculate sample offsets.

### 3. Box (Atomic Unit)

**Purpose**: Base class for all MP4 box types (ftyp, moov, mdat, etc.)

```javascript
class Box {
  type: string;           // 4-char code: "ftyp", "moov", etc.
  size: uint32;           // Full box size including 8-byte header
  hdr_size: uint32;       // Header size (8 or 16 for extended)
  start: uint64;          // Absolute file position
  
  parse(dataStream)       // Parse box contents
  write(dataStream)       // Serialize box back to bytes
}
```

**Concrete implementations** (from minified code):
- ftypBox: File type
- mdatBox: Media data (sample data)
- moovBox: Movie metadata (** CRITICAL FOR STREAMING **)
- moofBox: Movie fragment (fragmented streaming)
- ... 100+ more box types

### 4. ISOFile (Main Parser)

**Purpose**: Parses complete MP4 files or streaming fragments

```javascript
class ISOFile {
  // Callbacks
  onReady(info)                      // File playable
  onSegment(id, user, buf, num, final)  // Segment ready
  onSamples(trackId, user, samples)  // Samples extracted
  
  // Main API
  appendBuffer(buffer, endOfFile)    // Feed chunk
  start()                            // Start sample extraction
  getInfo()                          → Returns metadata object
  
  // Track access
  getTrackById(trackId)              → Track object
  getTrackSamplesInfo(trackId)       → Sample array
  getTrackSample(trackId, sampleIdx) → Single sample
  
  // Memory management
  releaseUsedSamples(trackId, idx)   // Free memory
  getAllocatedSampleDataSize()       → bytes in use
}
```

---

## Parsing State Machine

### Box Recognition Flow

```
Raw bytes → DataStream
    ↓
parseOneBox() extracts size + type
    ↓
Type matches BoxRegistry?
    ↓
YES: Instantiate specific box class (e.g., moovBox)
NO:  Create generic Box, mark as unparsed
    ↓
Call box.parse(dataStream)
    ↓
Box-specific parsing happens (e.g., moovBox extracts mvhd + traks)
    ↓
Return parsed box to caller
```

### Key Constraint: Box Hierarchy

Boxes are NESTED. Only container boxes can have children:

```
ftyp (leaf)
moov (container)
  ├── mvhd (leaf)
  ├── trak (container)
  │   ├── tkhd (leaf)
  │   ├── edts (container)
  │   │   └── elst (leaf)
  │   └── mdia (container)
  │       ├── mdhd (leaf)
  │       └── minf (container)
  │           ├── vmhd (leaf)
  │           └── stbl (container)
  │               ├── stsd (leaf) [sample entries - CODEC]
  │               ├── stts (leaf) [duration deltas]
  │               ├── stsc (leaf) [samples per chunk]
  │               └── stco (leaf) [chunk offsets]
mdat (leaf - huge!)
moof (container) [fragment]
  └── traf (container)
      ├── tfhd (leaf)
      ├── tfdt (leaf)
      └── trun (leaf) [sample sizes/durations]
mdat (leaf) [fragment samples]
```

**ContainerBox.parse()** recursively parses children until box end is reached.

---

## The Critical "onReady" Callback

### When It Fires

```javascript
// After successful appendBuffer() that includes complete moov box
moov fully parsed 
  ↓ (ISOFile.buildSampleLists() called internally)
  ↓
Codec information extracted from stsd entries
  ↓
onReady(info) callback triggered with complete metadata
```

### What's in the `info` Object

```javascript
{
  // Timeline
  hasMoov: true,
  duration: 9000000,              // In timescale units (see below)
  timescale: 1000,                // Milliseconds (typical)
  isFragmented: true,             // Has moof boxes
  isProgressive: false,           // Not all moov then all mdat
  
  // Container metadata
  created: Date,                  // MP4 creation time
  modified: Date,
  brands: ['isom', 'iso2', 'avc1'],  // Compatible brands
  
  // Tracks
  tracks: [                       // All tracks
    {
      id: 1,
      type: 'video',              // or 'audio', 'subtitles', etc.
      codec: 'avc1.42E01E',       // ← USE THIS FOR MIME TYPE
      duration: 9000000,
      timescale: 1000,
      nb_samples: 360,            // Sample count
      bitrate: 4500000,           // Estimated bps
      size: 5625000,              // Byte total
      video: {
        width: 1920,
        height: 1080
      },
      audio: {
        channel_count: 2,
        sample_rate: 48000
      }
    }
  ],
  
  // Convenience groupings
  videoTracks: [...],
  audioTracks: [...],
  subtitleTracks: [...],
  
  // MIME type recommendation
  mime: 'video/mp4; codecs="avc1.42E01E,mp4a.40.2"'
}
```

**TimescaleCritical concept**: Video timestamp = sample_pts / timescale

```javascript
// Example: First video sample
sample {
  cts: 0,           // Composition time (in timescale units)
  dts: 0,           // Decode time
  duration: 3000    // Sample duration (in timescale units)
  timescale: 24000  // fps
}

// Real time: 0 seconds
// Duration: 3000/24000 = 0.125 seconds = 8ms per frame = 120fps
```

---

## Sample Extraction Flow

### Step 1: Setup Extraction

```javascript
// Tell library to extract samples from trackId
// nbSamples = batch size (10 = extract 10 samples per cycle)
isofile.setExtractionOptions(trackId, userData, {
  nbSamples: 10
});
```

### Step 2: Start Processing

```javascript
// Begin sample extraction
isofile.start();

// Internally:
// 1. Reads sample tables (stts, stsz, stco, etc.)
// 2. Builds sample list with offsets
// 3. Begins reading sample data from mdat
// 4. Calls onSamples() callback when batch ready
```

### Step 3: Callback Receives Samples

```javascript
onSamples(trackId, userData, samples) {
  samples = [
    {
      number: 0,              // Sequential index
      track_id: 1,
      timescale: 24000,
      alreadyRead: 0,         // ← For resuming reads
      size: 4850,             // Data length
      offset: 2048,           // In file
      dts: 0,                 // Decode time
      cts: 0,                 // Composition time (for B-frames)
      duration: 3000,         // In timescale units
      description_index: 0,   // Index into stsd
      description: {          // ← Codec info
        type: 'avc1',
        width: 1920,
        height: 1080,
        getCodec() → 'avc1.42E01E'
      },
      is_sync: true,          // Keyframe
      is_leading: 0,
      depends_on: 0,
      is_depended_on: 0,
      has_redundancy: 0,
      degradation_priority: 0,
      data: Uint8Array(4850)  // ← ACTUAL SAMPLE DATA
    },
    // ... 9 more samples
  ]
}
```

---

## Memory Model

### What mp4box Stores

```
Per Track:
├── Sample array              [360 samples for 2-hour movie]
├── Sample indexes            (for seeking)
└── Sample data buffers       [LARGE - all encoded frames]

Total memory = sum of all sample sizes
For 2-hour 4Mbps movie: 2 * 3600 * 4Mbps / 8 = 3.6 GB (if all stored!)
```

### Why discardMdatData Flag Exists

```javascript
// Option 1: discardMdatData = true
// mdat boxes parsed but data discarded
// Memory: O(number of samples) - small
// Problem: Can't extract samples without re-fetching

// Option 2: discardMdatData = false (what we use!)
// mdat data kept in memory as streams
// Memory: O(file size in buffer) - large but managed by trimming
// Benefit: Can extract samples immediately
```

In our client:

```javascript
this.mp4file = createFile(false);  // false = discardMdatData
                                    // Keep data for extraction
```

---

## Fragmented MP4 Streaming (moof/mdat)

### Structure

```
ftyp
moov               ← Initialization segment
moof (fragment 1)  ── Media segment 1
mdat
moof (fragment 2)  ── Media segment 2
mdat
moof (fragment 3)
mdat
...
```

### What mp4box Does

```python
# For each moof+mdat pair:

# moof contains:
tfhd {
  track_id: 1,
  base_data_offset: 10485760,    # Usually omitted, uses moof position
  default_sample_duration: 3000,
}

trun {
  sample_count: 360,
  sample_duration: [3000, 3000, ...],      # Duration of each sample
  sample_size: [4850, 5100, 4920, ...],    # Size of each sample
  sample_flags: [65536, 25165824, ...],    # Keyframes, B-frames, etc.
}

# For each trun entry:
sample.offset = base_data_offset + data_offset + cumulative_size

# Result: Full sample table reconstructed from tfhd+trun
```

### Client Integration

```javascript
// As moof+mdat arrives:
appendBuffer(fragment)
  ↓
moovUpdated = true  // Triggers rebuildSampleLists()
  ↓
samples added to track.samples[]
  ↓
onSamples called with new samples
  ↓
Client feeds to SourceBuffer immediately
```

**Advantage**: Clients don't need to wait for entire file; playback can start ~2-3 seconds after first moov.

---

## Codec Information Extraction

### Where Codec String Comes From

```javascript
// stsd box contains sample entries:
stsd.entries = [
  avc1SampleEntry {  // AVC = H.264
    type: 'avc1',
    width: 1920,
    height: 1080,
    avcC: {            // AVC Configuration Box
      AVCProfileIndication: 66,     // Baseline
      profile_compatibility: 0,
      AVCLevelIndication: 40,       // Level 4.0
      lengthSizeMinusOne: 3,        // 4-byte NAL size
      SPS: [Uint8Array, ...],       // Sequence Param Set
      PPS: [Uint8Array, ...]        // Picture Param Set
    }
  }
]

// Codec string generation:
function getCodec() {
  return (
    'avc1.' +
    decimalToHex(AVCProfileIndication) +      // '42'
    decimalToHex(profile_compatibility) +     // 'e0'
    decimalToHex(AVCLevelIndication)          // '28'
  );
}
// Result: 'avc1.42e028'
```

### Chrome Codec Requirements

```javascript
// GOOD - Chrome supports all
'video/mp4; codecs="avc1.42e028"'           // H.264 Baseline L4.0
'audio/mp4; codecs="mp4a.40.2"'             // AAC-LC

// RISKY - Check isTypeSupported first
'video/mp4; codecs="hvc1.1.6.L93.b0"'       // HEVC (not all Chrome)
'audio/mp4; codecs="ac-3"'                  // AC-3 (limited support)

// WRONG - Will fail
'video/mp4; codecs="avc1.420029"'           // Typo in codec profile
'audio/mp4; codecs="mp4a.40."'              // Incomplete
```

**Client responsibility**: Call `MediaSource.isTypeSupported(mime)` before creating SourceBuffer!

---

## Error Scenarios in mp4box

### Scenario 1: Data Arrives Out of Order

```javascript
// Server sends: chunk1 (bytes 0-32K), chunk3 (bytes 64K-96K), chunk2 (32K-64K)

appendBuffer(chunk1) → parsed ok
appendBuffer(chunk3) → ERROR: Can't find box header! Offset too high
                       MultiBufferStream.findPosition() returns -1

// Solution: Streaming MUST be sequential (TCP guarantees this)
```

### Scenario 2: Incomplete Box

```javascript
// appendBuffer(bytes 0-1000)
// Box header says size=2000, but only 1000 bytes available

parseOneBox() → reads size=2000
              → checks remaining bytes: 992 < 2000
              → returns ERR_NOT_ENOUGH_DATA
              
// ISOFile queues incomplete box
// Next appendBuffer() resumes parsing
```

### Scenario 3: Non-Fast-Start MP4

```javascript
// File structure: ftyp (mdat - huge!) moov

appendBuffer(ftyp) → parsed
appendBuffer(mdat piece 1) → parsed, stored in stream
...
appendBuffer(mdat piece N) → all stored, mdat growing to 5GB
appendBuffer(final moov) → NOW onReady() fires!

// Problems:
// - Entire mdat kept in memory before playback
// - onReady fires after 90% downloaded
// - Streaming is inefficient

// Solution: -movflags faststart on encoder
```

---

## Performance Characteristics

### Parsing Speed

```javascript
// Per box type:
ftyp: O(1) - trivial
moov: O(sample_count) - linear scan of tables
mdat: O(1) - skipped if discardMdatData=false, stored as stream
```

For 360-sample video: moov parsing ~5ms (negligible)

### Memory During Parsing

```javascript
Per appendBuffer() call:
├── DataStream creation: ~100KB overhead
├── Box class instantiation: ~10KB per box
├── stsd parsing: codec info boxes stored
└── mdat: Optional large buffer (we keep it)

Typical per 32KB chunk: <250KB transient memory
```

### Extraction Speed

```javascript
Per onSamples(10 samples):
├── Seek 10 sample data locations: ~1ms
├── Copy 10 Uint8Arrays to new buffers: ~2ms
├── Call callback: ~0.1ms
Total: ~3ms per batch of 10 samples

For smooth 60fps playback:
- Need ~12 samples/sec (24fps movie)
- setExtractionOptions(..., {nbSamples: 10}) = extraction every 800ms
- Batching minimizes callback overhead
```

---

## Integration Checkpoints

### Checkpoint 1: Library Loaded

```javascript
typeof createFile === 'function' ?
  ✓ Library loaded correctly
  ✗ Check script tag src
```

### Checkpoint 2: File Parseable

```javascript
isofile.onReady called?
  ✓ MP4 syntax valid, codec detected
  ✗ Check: is it really an MP4? Is it fast-started?
```

### Checkpoint 3: Codec Supported

```javascript
MediaSource.isTypeSupported(mime)?
  ✓ Chrome can play it
  ✗ Transcode to H.264 or VP9
```

### Checkpoint 4: Buffer Filling

```javascript
SourceBuffer.buffered.length > 0?
  ✓ Samples successfully appended
  ✗ Check: is data flowing from WebSocket?
           is sample.data non-empty?
```

---

## Advanced Features (Not Used in Basic Client)

### 1. Segmentation

```javascript
isofile.setSegmentOptions(trackId, userId, {
  nbSamples: 1000,
  rapAlignement: true  // Segment at keyframes
});

// Calls onSegment() instead of onSamples()
// Useful for DASH/HLS manifest generation
```

### 2. Sample Groups

```javascript
// sgpd: Sample Group Description Box
// sbgp: Sample To Group Box

// Use case: Mark dependent samples, spatial regions, etc.
// Advanced feature, skip for basic streaming
```

### 3. Encryption (EME)

```javascript
// tenc: Track Encryption Box
// pssh: Protection System Specific Header

// For DRM content (Netflix-style)
// Requires Encrypted Media Extensions
// Out of scope for basic client
```

---

## Summary: Why mp4box.js for Streaming?

| Aspect | mp4box | Alternative |
|--------|--------|-------------|
| **Parsing** | Full MP4 standard | Limited subset |
| **Fragmentation** | Native moof/mdat support | Manual reassembly |
| **Seeking** | Random sample lookup | Re-parse from start |
| **Memory** | Configurable data retention | Fixed full load |
| **Codec Info** | Automatic extraction | Manual parsing |
| **Performance** | Optimized JS implementation | Slower interpretation |

For WebSocket + MSE streaming, mp4box.js is the **right tool** because:

1. ✓ Handles fragmented streaming natively
2. ✓ Extracts samples as they arrive (no waiting)
3. ✓ Detects codecs automatically
4. ✓ Can discard old data to manage memory
5. ✓ 100% JavaScript (works anywhere)

---

## References

**MP4 File Format**:
- ISO/IEC 14496-12:2015 (MP4 specification)
- https://github.com/gpac/mp4box.js/wiki

**mp4box.js API**:
- Source: https://github.com/gpac/mp4box.js
- Releases: v0.5.0+ (stable for MSE)

**Related Standards**:
- W3C MediaSource Extensions: https://www.w3.org/TR/media-source/
- FFmpeg fast-start: `-movflags faststart`
- NAL/NALU units: H.264 encoded sample format

