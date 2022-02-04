import {
  CodecProfile,
  CodecType,
  ProfileConditionType,
  ProfileCondition,
  ProfileConditionValue
} from '@jellyfin/client-axios';
import { Context } from '@nuxt/types';

/**
 * Gets the max video bitrate
 *
 * @param {Context} context - Nuxt context
 * @returns {number | null} Returns the MaxVideoBitrate
 */
function getGlobalMaxVideoBitrate(context: Context): number | null {
  let isTizenFhd = false;

  if (context.$browser.isTizen() && window.webapis) {
    isTizenFhd = !window.webapis.productinfo.isUdPanelSupported();
  }

  // TODO: These valus are taken directly from Jellyfin-web.
  // The source of them needs to be investigated.
  if (context.$browser.isPs4()) {
    return 8000000;
  }

  if (context.$browser.isXbox()) {
    return 12000000;
  }

  if (context.$browser.isTizen() && isTizenFhd) {
    return 20000000;
  }

  return null;
}

/**
 * Creates a profile condition object for use in device playback profiles.
 *
 * @param {ProfileConditionValue} Property - Value for the property
 * @param {ProfileConditionType} Condition - Condition that the property must comply with
 * @param {string} Value - Value to check in the condition
 * @param {boolean} IsRequired - Whether this property is required
 * @returns {ProfileCondition} - Constructed ProfileCondition object
 */
function createProfileCondition(
  Property: ProfileConditionValue,
  Condition: ProfileConditionType,
  Value: string,
  IsRequired = false
): ProfileCondition {
  return {
    Condition,
    Property,
    Value,
    IsRequired
  };
}

/**
 * @param {Context} context - Nuxt context
 * @param {HTMLVideoElement} videoTestElement - A HTML video element for testing codecs
 * @returns {ProfileCondition[]} - Array of ACC Profile conditions
 */
export function getAacCodecProfileConditions(
  context: Context,
  videoTestElement: HTMLVideoElement
): ProfileCondition[] {
  const supportsSecondaryAudio = context.$browser.isTizen();

  const conditions: ProfileCondition[] = [];

  // Handle he-aac not supported
  if (
    !videoTestElement
      .canPlayType('video/mp4; codecs="avc1.640029, mp4a.40.5"')
      .replace(/no/, '')
  ) {
    // TODO: This needs to become part of the stream url in order to prevent stream copy
    conditions.push(
      createProfileCondition(
        ProfileConditionValue.AudioProfile,
        ProfileConditionType.NotEquals,
        'HE-AAC'
      )
    );
  }

  if (!supportsSecondaryAudio) {
    conditions.push(
      createProfileCondition(
        ProfileConditionValue.IsSecondaryAudio,
        ProfileConditionType.Equals,
        'false'
      )
    );
  }

  return conditions;
}

/**
 * @param {Context} context - Nuxt context
 * @param {HTMLVideoElement} videoTestElement - A HTML video element for testing codecs
 * @returns {CodecProfile[]} - Array containing the different profiles for the client
 */
export function getCodecProfiles(
  context: Context,
  videoTestElement: HTMLVideoElement
): CodecProfile[] {
  const CodecProfiles: CodecProfile[] = [];

  const aacProfileConditions = getAacCodecProfileConditions(
    context,
    videoTestElement
  );

  const supportsSecondaryAudio = context.$browser.isTizen();

  if (aacProfileConditions.length) {
    CodecProfiles.push({
      Type: CodecType.VideoAudio,
      Codec: 'aac',
      Conditions: aacProfileConditions
    });
  }

  if (!supportsSecondaryAudio) {
    CodecProfiles.push({
      Type: CodecType.VideoAudio,
      Conditions: [
        createProfileCondition(
          ProfileConditionValue.IsSecondaryAudio,
          ProfileConditionType.Equals,
          'false'
        )
      ]
    });
  }

  let maxH264Level = 42;
  let h264Profiles = 'high|main|baseline|constrained baseline';

  if (
    context.$browser.isTv() ||
    videoTestElement
      .canPlayType('video/mp4; codecs="avc1.640833"')
      .replace(/no/, '')
  ) {
    maxH264Level = 51;
  }

  if (
    videoTestElement
      .canPlayType('video/mp4; codecs="avc1.640834"')
      .replace(/no/, '')
  ) {
    maxH264Level = 52;
  }

  if (
    context.$browser.isTizen() ||
    videoTestElement
      .canPlayType('video/mp4; codecs="avc1.6e0033"')
      .replace(/no/, '')
  ) {
    // TODO: These tests are passing in Safari, but playback is failing
    if (
      !context.$browser.isApple() ||
      !context.$browser.isWebOS() ||
      !(context.$browser.isEdge() && !context.$browser.isChromiumBased())
    ) {
      h264Profiles += '|high 10';
    }
  }

  let maxHevcLevel = 120;
  let hevcProfiles = 'main';

  // HEVC Main profile, Level 4.1
  if (
    videoTestElement
      .canPlayType('video/mp4; codecs="hvc1.1.4.L123"')
      .replace(/no/, '') ||
    videoTestElement
      .canPlayType('video/mp4; codecs="hev1.1.4.L123"')
      .replace(/no/, '')
  ) {
    maxHevcLevel = 123;
  }

  // HEVC Main10 profile, Level 4.1
  if (
    videoTestElement
      .canPlayType('video/mp4; codecs="hvc1.2.4.L123"')
      .replace(/no/, '') ||
    videoTestElement
      .canPlayType('video/mp4; codecs="hev1.2.4.L123"')
      .replace(/no/, '')
  ) {
    maxHevcLevel = 123;
    hevcProfiles = 'main|main 10';
  }

  // HEVC Main10 profile, Level 5.1
  if (
    videoTestElement
      .canPlayType('video/mp4; codecs="hvc1.2.4.L153"')
      .replace(/no/, '') ||
    videoTestElement
      .canPlayType('video/mp4; codecs="hev1.2.4.L153"')
      .replace(/no/, '')
  ) {
    maxHevcLevel = 153;
    hevcProfiles = 'main|main 10';
  }

  // HEVC Main10 profile, Level 6.1
  if (
    videoTestElement
      .canPlayType('video/mp4; codecs="hvc1.2.4.L183"')
      .replace(/no/, '') ||
    videoTestElement
      .canPlayType('video/mp4; codecs="hev1.2.4.L183"')
      .replace(/no/, '')
  ) {
    maxHevcLevel = 183;
    hevcProfiles = 'main|main 10';
  }

  const hevcCodecProfileConditions: ProfileCondition[] = [
    createProfileCondition(
      ProfileConditionValue.IsAnamorphic,
      ProfileConditionType.NotEquals,
      'true'
    ),
    createProfileCondition(
      ProfileConditionValue.VideoProfile,
      ProfileConditionType.EqualsAny,
      hevcProfiles
    ),
    createProfileCondition(
      ProfileConditionValue.VideoLevel,
      ProfileConditionType.LessThanEqual,
      maxHevcLevel.toString()
    )
  ];

  const h264CodecProfileConditions: ProfileCondition[] = [
    createProfileCondition(
      ProfileConditionValue.IsAnamorphic,
      ProfileConditionType.NotEquals,
      'true'
    ),
    createProfileCondition(
      ProfileConditionValue.VideoProfile,
      ProfileConditionType.EqualsAny,
      h264Profiles
    ),
    createProfileCondition(
      ProfileConditionValue.VideoLevel,
      ProfileConditionType.LessThanEqual,
      maxH264Level.toString()
    )
  ];

  if (!context.$browser.isTv()) {
    h264CodecProfileConditions.push(
      createProfileCondition(
        ProfileConditionValue.IsInterlaced,
        ProfileConditionType.NotEquals,
        'true'
      )
    );
    hevcCodecProfileConditions.push(
      createProfileCondition(
        ProfileConditionValue.IsInterlaced,
        ProfileConditionType.NotEquals,
        'true'
      )
    );
  }

  const globalMaxVideoBitrate = (
    getGlobalMaxVideoBitrate(context) || ''
  ).toString();

  if (globalMaxVideoBitrate) {
    h264CodecProfileConditions.push(
      createProfileCondition(
        ProfileConditionValue.VideoBitrate,
        ProfileConditionType.LessThanEqual,
        globalMaxVideoBitrate,
        true
      )
    );
  }

  if (globalMaxVideoBitrate) {
    hevcCodecProfileConditions.push(
      createProfileCondition(
        ProfileConditionValue.VideoBitrate,
        ProfileConditionType.LessThanEqual,
        globalMaxVideoBitrate,
        true
      )
    );
  }

  // On iOS 12.x, for TS container max h264 level is 4.2
  if (
    context.$browser.isApple() &&
    context.$browser.isMobile() &&
    (context.$browser.safariVersion() as number) < 13
  ) {
    const codecProfile = {
      Type: CodecType.Video,
      Codec: 'h264',
      Container: 'ts',
      Conditions: h264CodecProfileConditions.filter((condition) => {
        return condition.Property !== 'VideoLevel';
      })
    };

    codecProfile.Conditions.push(
      createProfileCondition(
        ProfileConditionValue.VideoLevel,
        ProfileConditionType.LessThanEqual,
        '42'
      )
    );

    CodecProfiles.push(codecProfile);
  }

  CodecProfiles.push({
    Type: CodecType.Video,
    Codec: 'h264',
    Conditions: h264CodecProfileConditions
  });

  CodecProfiles.push({
    Type: CodecType.Video,
    Codec: 'hevc',
    Conditions: hevcCodecProfileConditions
  });

  return CodecProfiles;
}
