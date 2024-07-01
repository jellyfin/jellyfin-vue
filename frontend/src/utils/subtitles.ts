/**
 * Helper for subtitle manipulation and subtitle-related utility functions
 */

import axios from 'axios';

interface Dialouge {
  start: number;
  end: number;
  text: string;
}

export interface ParsedSubtitleTrack {
  dialogue: Dialouge[];
  isBasic?: boolean;
}

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
function replaceTags(input: string, tagMap: TagMap) {
  let formattedText = input;

  // Iterate through tag mappings
  for (const [htmlTag, markdownTag] of Object.entries(tagMap)) {
    const escapedHtmlTag = htmlTag.replaceAll('\\', '\\\\');
    const regex = new RegExp(escapedHtmlTag, 'gi');

    formattedText = formattedText.replace(regex, (_, p1: string) => {
      return markdownTag.replace('$1', p1.trim());
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

    const dialogue: Dialouge[] = [];
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

const parseFormatFields = (line: string) => {
  return line.split('Format:')[1].split(',').map(field => field.trim());
};

const parseFormattedLine = (line: string, formatFields: string[]) => {
  const lineParts = line.slice(line.indexOf(':') + 1, -1).split(',').map(field => field.trim());
  const lineData: Record<string, string> = {};

  for (const [fieldIndex, field] of formatFields.entries()) {
    lineData[field] = field === 'Text'
      ? lineParts.slice(fieldIndex).join(', ').trim() // Add dialogue together
      : lineParts[fieldIndex].trim();
  }

  return lineData;
};

const parseSsaStyles = (lines: string[]) => {
  let formatFields: string[] = [];
  const styles = [];

  for (const line of lines) {
    if (line.startsWith('Format:')) {
      formatFields = parseFormatFields(line);
    } else if (line.startsWith('Style:')) {
      const style = parseFormattedLine(line, formatFields);

      styles.push(style);
    }
  }

  return styles;
};

/**
 * Parses dialogue line from SSA file.
 */
const parseSsaDialogue = (line: string, formatFields: string[]) => {
  const dialogueData = parseFormattedLine(line, formatFields);

  const timeStart = dialogueData.Start;
  const timeEnd = dialogueData.End;
  const text = dialogueData.Text;

  const formattedText = replaceTags(text, {
    '{\\i1}(.*?){\\i0}': '<i>$1</i>', // Italics
    '{\\b1}(.*?){\\b0}': '<b>$1</b>' // Bold
  });

  return { start: parseTime(timeStart), end: parseTime(timeEnd), text: formattedText.trim() };
};

const parseSsaDialogueLines = (lines: string[]) => {
  let index = 0;
  let dialogueFormat: string[] = [];
  const dialogue: Dialouge[] = [];
  while (index < lines.length) {
    const line = lines[index].trim();
    /**
     * Parse format fields and save to a variable
     * to index data from dialogue lines
     */
    if (line.startsWith('Format:')) {
      dialogueFormat = parseFormatFields(line);
    }

    /**
     * Parse lines with dialouge
     * add consecutive lines at the same time together
     */
    if (line.startsWith('Dialogue:')) {
      // Format fields should be defined before dialogue lines begin
      if (dialogueFormat.length === 0) {
        break;
      }

      const currentDialogue = parseSsaDialogue(line, dialogueFormat);
      // Handle consecutive dialogue lines with the same timestamp
      while (index + 1 < lines.length) {
        const nextLine = lines[index + 1].trim();
        if (nextLine.startsWith('Dialogue:')) {
          const nextDialogue = parseSsaDialogue(nextLine, dialogueFormat);
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
      dialogue.push(currentDialogue);
    }
    index++;
  }

  return dialogue;
};

/**
 * Parses an ASS/SSA (SubStation Alpha) file from a given URL.
 * Extracts dialogue lines with start and end times, and text content.
 *
 * Converts specific tags to styled <span> tags
 */
export async function parseSsaFile(src: string): Promise<ParsedSubtitleTrack | undefined> {
  try {
    const file = await axios.get<string>(src);
    const ssaText: string = file.data;

    if (!ssaText) {
      return;
    }

    const sections = ssaText.split(/\r?\n\r?\n/); // Split into sections by empty lines

    let styles: Record<string, string>[] | undefined = [];
    let dialogue: Dialouge[] = [];
    for (const section of sections) {
      if (section.startsWith('[V4 Styles]') || section.startsWith('[V4+ Styles]')) {
        const lines = section.split('\n').slice(1); // Remove the [V4 Styles] line
        styles = parseSsaStyles(lines);
      } else if (section.startsWith('[Events]')) {
        const lines = section.split('\n').slice(1); // Remove the [Events] line
        dialogue = parseSsaDialogueLines(lines);
      }
    }

    const subtitles: ParsedSubtitleTrack = {
      dialogue: dialogue,
      /**
       * Usually an advanced substation alpha file with many effects (karaoke, anime)
       * will have more than one style defined, if there's only one
       * we can assume it's basic
       */
      isBasic: styles.length == 1
    };

    return subtitles;
  } catch (error) {
    console.error('Error parsing SSA/ASS subtitles', error);
  }
}
