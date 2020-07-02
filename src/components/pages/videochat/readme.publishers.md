##  WebrtcPublisher 

 * Get the best player (encoder) for webrtc publishers
 * 
 * Publisher codec used:
 * 
 * video: h264
 * audio: PCMU 8kbit mono
 * 
 * Available codecs players:
 * 
 * - webrtc: (best match)
 *      video: h264, vp8 (limited), vp9 (limited)
 *      audio: opus,vorbis, pcmu, pcma
 *      quality: very high
 *      latency: 10ms - 500ms
 * 
 * - nanocosmos: (best match if no sound is used and webrtc is not a option)
 *      video: h264
 *      audio: aac
 *      quality: high
 *      latency: 700ms - 2000ms
 * 
 * - flash: (best match for IE browser who are still supporting Flash)
 *      video: h264
 *      audio: pcmu, pcma, aac 
 *      quality: very high
 *      latency: 10ms - 500ms    
 * 
 * - jsmpeg: (if all else fails , 'VHS' to the rescue)
 *      video: MPEG-1 (transcoded from h264 by server)
 *      audio: pcmu, pcma, aac
 *      quality: okish
 *      latency: 100ms - 800ms
 * 
 * @param platform parsed platform from browser useragent string;

 ## clubsenseStreamerPublisher

 * Get the best player (encoder) for OBS (clubsense streamer) publishers
 *
 * Publisher codec used:
 *
 * video: h264
 * audio: AAC
 *
 * Available codecs players:
 *
 * 
 * - nanocosmos: (best match)
 *      video: h264
 *      audio: aac
 *      quality: high
 *      latency: 700ms - 2000ms
 * 
 * - webrtc: (best match, if no sound is needed)
 *      video: h264, vp8 (limited), vp9 (limited)
 *      audio: opus, vorbis, pcmu, pcma
 *      quality: very high
 *      latency: 10ms - 500ms
 *
 * - flash: (best match for IE browser who are still supporting Flash)
 *      video: h264
 *      audio: pcmu, pcma, aac
 *      quality: very high
 *      latency: 10ms - 500ms
 *
 * - jsmpeg: (if all else fails , 'VHS' to the rescue)
 *      video: MPEG-1 (transcoded from h264 by server)
 *      audio: pcmu, pcma, aac
 *      quality: okish
 *      latency: 100ms - 800ms
 *
 * @param platform parsed platform from browser useragent string

 ## flashPublisher

  * Get the best player (encoder) for Flash publishers (RTMP)
 *
 * Publisher codec used:
 *
 * video: h264
 * audio: pcmu
 *
 * Available codecs players:
 *
 * - nanocosmos: (best match if the is no sound needed)
 *      video: h264
 *      audio: aac
 *      quality: high
 *      latency: 700ms - 2000ms
 *
 * - flash: (best match for IE browser who are still supporting Flash)
 *      video: h264
 *      audio: pcmu, pcma, aac
 *      quality: very high
 *      latency: 10ms - 500ms
 *
 * - jsmpeg: (if all else fails , 'VHS' to the rescue)
 *      video: MPEG-1 (transcoded from h264 by server)
 *      audio: pcmu, pcma, aac
 *      quality: okish
 *      latency: 100ms - 800ms
 *
 * @param platform parsed platform from browser useragent string