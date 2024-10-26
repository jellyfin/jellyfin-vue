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

const parseFormatFields = (line: string) => line.split('Format:')[1].split(',').map(field => field.trim());

/**
 * Extracts text from the SSA
 */
function parseFormattedLine(line: string, formatFields: string[]) {
  const lineParts = line.slice(line.indexOf(':') + 1, -1).split(',').map(field => field.trim());
  const lineData: Record<string, string> = {};

  for (const [fieldIndex, field] of formatFields.entries()) {
    lineData[field] = field === 'Text'
      ? lineParts.slice(fieldIndex).join(', ').trim() // Add dialogue together
      : lineParts[fieldIndex].trim();
  }

  return lineData;
};

/**
 * Extracts styles from the SSA file
 */
function parseSsaStyles(lines: string[]) {
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
function parseSsaDialogue(line: string, formatFields: string[]): Dialogue {
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

/**
 * Parses dialogue lines from SSA file.
 */
function parseSsaDialogueLines(lines: string[]): Dialogue[] {
  let index = 0;
  let dialogueFormat: string[] = [];
  const dialogue: Dialogue[] = [];

  const parseLine = (line: string, index: number): [Dialogue | undefined, number] => {
    line = line.trim();

    // Format fields should be defined before dialogue lines begin
    if (line.startsWith('Dialogue:') && dialogueFormat.length !== 0) {
      let currentDialogue = parseSsaDialogue(line, dialogueFormat);

      // Handle consecutive dialogue lines with the same timestamp
      [currentDialogue, index] = parseConsecutiveLines(currentDialogue, index);

      return [currentDialogue, index];
    } else {
      return [undefined, index];
    }
  };

  const parseConsecutiveLines = (currentDialogue: Dialogue, index: number): [Dialogue, number] => {
    while (index + 1 < lines.length) {
      const nextLine = lines[index + 1].trim();

      if (nextLine.startsWith('Dialogue:')) {
        const nextDialogue = parseSsaDialogue(nextLine, dialogueFormat);

        if (nextDialogue.start === currentDialogue.start && nextDialogue.end === currentDialogue.end) {
          currentDialogue.text += '\n' + nextDialogue.text;
          index++;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    currentDialogue.text = currentDialogue.text.replace(String.raw`\N`, '\n');

    return [currentDialogue, index];
  };

  while (index < lines.length) {
    const line = lines[index];

    /**
     * Parse format fields and save to a variable
     * to index data from dialogue lines
     */
    if (line.startsWith('Format:')) {
      dialogueFormat = parseFormatFields(line);
    }

    /**
     * Parse lines with Dialogue
     * add consecutive lines at the same time together
     */
    const [parsedDialogue, newIndex] = parseLine(line, index);

    if (parsedDialogue) {
      dialogue.push(parsedDialogue);
    }

    index = newIndex + 1;
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
    let dialogue: Dialogue[] = [];

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
      isBasic: styles.length === 1
    };

    return subtitles;
  } catch (error) {
    console.error('Error parsing SSA/ASS subtitles', error);
  }
}
