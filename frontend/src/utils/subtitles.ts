/**
 * Helper for subtitle manipulation and subtitle-related utility functions
 */

interface Subtitle {
  start: number;
  end: number;
  text: string;
}

export type ParsedSubtitleTrack = Subtitle[]

export const SUBTITLE_FONT_FAMILIES = [
  'Figtree Variable',
  'Trebuchet MS',
  'Verdana',
  'Sans Serif MS',
  'Arial',
  'Courier New',
  'Times New Roman',
  'Old English Text MT',
  'Century Gothic',
  'Helvetica',
  'Garamond'
] as const;

export const FALLBACK_SUBTITLE_FONT = 'sans-serif, system-ui';

/**
 * Parse time string used in subtitle files to seconds
 */
function parseTime(timeString: string) {
  const [hours, minutes, seconds] = timeString.split(':').map(Number.parseFloat);
  return hours * 3600 + minutes * 60 + seconds;
}

/**
* Parses a VTT (WebVTT) file from a given URL
* Extracts dialogue lines with start and end times, and text content.
* 
* Converts specific tags to styled <span> tags, 
* and sanitizes the content by removing harmful tags.
*/
export async function parseVttFile(src: string) {
    return fetch(src)
      .then(response => response.text())
      .then((vttText) => {
        try {
          const subtitles: ParsedSubtitleTrack = [];
          const vttLines = vttText.split('\n');

          let i = 0;
          while (i < vttLines.length) {
            // Skip empty lines
            if (vttLines[i].trim() === '') {
              i++;
              continue;
            }

            if (vttLines[i].includes('-->')) {
              const [start, end] = vttLines[i].split(' --> ');
              let text = '';
              i++;
              while (i < vttLines.length && !vttLines[i].includes('-->')) {
                text += vttLines[i] + '\n';
                i++;
              }

              // Replace tags with html elements & remove harmful tags to sanitize
              const sanitizedText = text
                .replace(/<i>/g, '<span style="font-style: italic;">')
                .replace(/<\/i>/g, '</span>')
                .replace(/<b>/g, '<span style="font-weight: bold;">')
                .replace(/<\/b>/g, '</span>')
                .replace(/<u>/g, '<span style="text-decoration: underline;">')
                .replace(/<\/u>/g, '</span>')
                .replace(/<em>/g, '<span style="font-style: italic;">')
                .replace(/<\/em>/g, '</span>')
                .replace(/<strong>/g, '<span style="font-weight: bold;">')
                .replace(/<\/strong>/g, '</span>')
                .replace(/<mark>/g, '<span style="background-color: yellow;">')
                .replace(/<\/mark>/g, '</span>')
                .replace(/<script.*?>.*?<\/script>/g, '')
                .replace(/<iframe.*?>.*?<\/iframe>/g, '')
                .replace(/<object.*?>.*?<\/object>/g, '')
                .replace(/<embed.*?>.*?<\/embed>/g, '')
                .replace(/<style.*?>.*?<\/style>/g, '');

              subtitles.push({
                start: parseTime(start),
                end: parseTime(end),
                text: sanitizedText.trim()
              });
            } else {
              i++;
            }
          }

          return subtitles;
        } catch (err) {
          console.error("error parsing VTT subtitles", err);
        }
      });
  }

/**
* Parses an ASS/SSA (SubStation Alpha) file from a given URL.
* Extracts dialogue lines with start and end times, and text content.
* 
* Converts specific tags to styled <span> tags, 
* and sanitizes the content by removing harmful tags.
*/
export async function parseSsaFile(src: string) {
  return await fetch(src)
    .then(res => res.text())
    .then(ssaText => {
      try {
        const subtitles: ParsedSubtitleTrack = [];
        const ssaLines = ssaText.split('\n');
    
        let i = 0;
        while (i < ssaLines.length) {
          const line = ssaLines[i].trim();
    
          if (line.startsWith('Dialogue:')) {
            const dialogueParts = line.split(',');
            const timeStart = dialogueParts[1].trim();
            const timeEnd = dialogueParts[2].trim();
            const text = dialogueParts.slice(9).join(',').trim();
    
            // Replace tags with HTML elements & remove harmful tags to sanitize
            const sanitizedText = text
              .replace(/{\\i1}/g, '<span style="font-style: italic;">')
              .replace(/{\\i0}/g, '</span>')
              .replace(/{\\b1}/g, '<span style="font-weight: bold;">')
              .replace(/{\\b0}/g, '</span>')
              .replace(/{\\u1}/g, '<span style="text-decoration: underline;">')
              .replace(/{\\u0}/g, '</span>')
              .replace(/{.*?}/g, '')
              .replace(/<script.*?>.*?<\/script>/gi, '')
              .replace(/<iframe.*?>.*?<\/iframe>/gi, '')
              .replace(/<object.*?>.*?<\/object>/gi, '')
              .replace(/<embed.*?>.*?<\/embed>/gi, '')
              .replace(/<style.*?>.*?<\/style>/gi, '');
    
            subtitles.push({
              start: parseTime(timeStart),
              end: parseTime(timeEnd),
              text: sanitizedText.trim(),
            });
          }
    
          i++;
        }

        return subtitles;
      } catch (err) {
        console.error('Error parsing ASS subtitles', err);
        return [];
      }
    });
}