/**
 * Helper for subtitle manipulation and subtitle-related utility functions
 */

import axios from 'axios';

interface Subtitle {
  start: number;
  end: number;
  text: string;
}

export type ParsedSubtitleTrack = Subtitle[];
type TagMap = Record<string, string>;

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
  const [hours, minutes, seconds] = timeString.split(':').map((element) => {
    return Number.parseFloat(element);
  });

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Formats the provided text by replacing specified tags with HTML elements.
 */
function formatText(text: string, tagMap: TagMap): string {
  let formattedText = text;
  for (const [tag, replacement] of Object.entries(tagMap)) {
    const regex = new RegExp(tag, 'g');
    formattedText = formattedText.replace(regex, replacement);
  }
  return formattedText;
}

/**
 * Parses a VTT (WebVTT) file from a given URL
 * Extracts dialogue lines with start and end times, and text content.
 *
 * Converts specific tags to styled <span> tags
 */
export async function parseVttFile(src: string) {
  try {
    const file = await axios.get<string>(src);
    const vttText: string = file.data;

    if (!vttText) {
      return;
    }

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

        const formattedText = formatText(text, {
          '<i>': '<span style="font-style: italic;">',
          '</i>': '</span>',
          '<b>': '<span style="font-weight: bold;">',
          '</b>': '</span>',
          '<u>': '<span style="text-decoration: underline;">',
          '</u>': '</span>',
          '<em>': '<span style="font-style: italic;">',
          '</em>': '</span>',
          '<strong>': '<span style="font-weight: bold;">',
          '</strong>': '</span>',
          '<mark>': '<span style="background-color: yellow;">',
          '</mark>': '</span>'
        });

        subtitles.push({
          start: parseTime(start),
          end: parseTime(end),
          text: formattedText.trim()
        });
      } else {
        i++;
      }
    }

    return subtitles;
  } catch (error) {
    console.error('Error parsing VTT subtitles', error);
  }
}

/**
 * Parses dialogue line from SSA file.
 */
const parseSsaDialogue = (line: string, formatFields: string[]) => {
  const dialogueParts = line.split('Dialogue:')[1].split(',').map(field => field.trim());
  const dialogueData: Record<string, string> = {};

  for (const [fieldIndex, field] of formatFields.entries()) {
    dialogueData[field] = field === 'Text' ? dialogueParts.slice(fieldIndex).join(', ').trim() : dialogueParts[fieldIndex]?.trim();
  }

  const timeStart = dialogueData.Start;
  const timeEnd = dialogueData.End;
  const text = dialogueData.Text;

  const formattedText = formatText(text, {
    '{\\i1}': '<span style="font-style: italic;">',
    '{\\i0}': '</span>',
    '{\\b1}': '<span style="font-weight: bold;">',
    '{\\b0}': '</span>',
    '{\\u1}': '<span style="text-decoration: underline;">',
    '{\\u0}': '</span>',
    '{.*?}': '' // Remove other SSA tags
  });

  return { start: parseTime(timeStart), end: parseTime(timeEnd), text: formattedText.trim() };
};

/**
 * Parses an ASS/SSA (SubStation Alpha) file from a given URL.
 * Extracts dialogue lines with start and end times, and text content.
 *
 * Converts specific tags to styled <span> tags
 */
export async function parseSsaFile(src: string) {
  try {
    const file = await axios.get<string>(src);
    const ssaText: string = file.data;

    if (!ssaText) {
      return;
    }

    // Dialogue lines
    const ssaLines = ssaText.split('[Events]')[1].split('\n');

    const subtitles: ParsedSubtitleTrack = [];
    let formatFields: string[] = [];
    let index = 0;
    while (index < ssaLines.length) {
      const line = ssaLines[index].trim();

      /**
       * Parse format fields and save to a variable
       * to index data from dialogue lines
       */
      if (line.startsWith('Format:')) {
        formatFields = line.split('Format:')[1].split(',').map(field => field.trim());
      }

      /**
       * Parse lines with dialouge
       * add consecutive lines at the same time together
       */
      if (line.startsWith('Dialogue:')) {
        // Format fields should be defined before dialogue begins
        if (formatFields.length === 0) {
          break;
        }

        const currentDialogue = parseSsaDialogue(line, formatFields);

        // Handle consecutive dialogue lines with the same timestamp
        while (index + 1 < ssaLines.length) {
          const nextLine = ssaLines[index + 1].trim();
          if (nextLine.startsWith('Dialogue:')) {
            const nextDialogue = parseSsaDialogue(nextLine, formatFields);
            if (nextDialogue.start === currentDialogue.start && nextDialogue.end === currentDialogue.end) {
              // Add a newline between consecutive dialogue lines with the same timestamp
              currentDialogue.text += '\n' + nextDialogue.text;
              index++;
            } else {
              break;
            }
          } else {
            break;
          }
        }

        subtitles.push(currentDialogue);
      }

      index++;
    }

    return subtitles;
  } catch (error) {
    console.error('Error parsing SSA/ASS subtitles', error);
  }
}
