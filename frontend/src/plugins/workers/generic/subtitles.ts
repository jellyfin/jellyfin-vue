/// <reference lib="WebWorker" />

/**
 * Helper for subtitle manipulation and subtitle-related utility functions
 */

import axios from 'axios';

export interface Dialogue {
  start: number;
  end: number;
  text: string;
}

export interface ParsedSubtitleTrack {
  dialogue: Dialogue[];
  isBasic?: boolean;
}

type TagMap = Record<string, string>;

/**
 * Parse time string used in subtitle files to seconds
 */
function parseTime(timeString: `${string}:${string}:${string}`) {
  const [hours, minutes, seconds] = timeString.split(':').map((element) => {
    return Number.parseFloat(element);
  });

  return hours! * 3600 + minutes! * 60 + seconds!;
}

/**
 * Formats the provided text by replacing specified tags with HTML elements.
 */
function replaceTags(input: string, tagMap: TagMap) {
  let formattedText = input;

  // Iterate through tag mappings
  for (const htmlTag in tagMap) {
    const escapedHtmlTag = htmlTag.replaceAll('\\', '\\\\');
    const regex = new RegExp(escapedHtmlTag, 'gi');

    formattedText = formattedText.replace(regex, (_, p1: string) => {
      return tagMap[htmlTag].replace('$1', p1.trim());
    });
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

    const dialogue: Dialogue[] = [];
    const vttLines = vttText.split('\n');

    let i = 0;

    while (i < vttLines.length) {
      if (vttLines[i].includes('-->')) {
        const [start, end] = vttLines[i].split(' --> ');
        let text = '';

        i++;

        while (i < vttLines.length && !vttLines[i].includes('-->')) {
          text += vttLines[i] + '\n';
          i++;
        }

        const formattedText = replaceTags(text, {
          '<br>': '\n' // Line break
        });

        dialogue.push({
          start: parseTime(start),
          end: parseTime(end),
          text: formattedText.trim()
        });
      } else {
        i++;
      }
    }

    const subtitles: ParsedSubtitleTrack = {
      dialogue: dialogue,
      isBasic: true
    };

    return subtitles;
  } catch (error) {
    console.error('Error parsing VTT subtitles', error);
  }
}
