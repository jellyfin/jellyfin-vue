import {
  CodecProfile,
  CodecType,
  ProfileConditionType,
  ProfileCondition,
  ProfileConditionValue
} from '@jellyfin/client-axios';
import { browserDetector } from '~/plugins/browserDetection';

/**
 * Gets the max video bitrate
 *
 * @returns {number | null} Returns the MaxVideoBitrate
 */
function getGlobalMaxVideoBitrate(): number | null {
  let isTizenFhd = false;
  if (browserDetector.isTizen()) {
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      // eslint-disable-next-line no-undef
      const isTizenUhd = webapis?.productinfo?.isUdPanelSupported();
      isTizenFhd = !isTizenUhd;

      // eslint-disable-next-line no-console
      console.debug('isTizenFhd = ' + isTizenFhd);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('isUdPanelSupported() error code = ' + error.code);
    }
  }

  return browserDetector.isPs4()
    ? 8000000
    : browserDetector.isXbox()
    ? 12000000
    : browserDetector.isTizen && isTizenFhd
    ? 20000000
    : null;
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
 * @param {HTMLVideoElement} videoTestElement sd
 * @returns {ProfileCondition[]} sd
 */
export function getaacCodecProfileConditions(
  videoTestElement: HTMLVideoElement
): ProfileCondition[] {
  const supportsSecondaryAudio = browserDetector.isTizen();

  const conditions = [] as ProfileCondition[];

  // Handle he-aac not supported
  if (
    !videoTestElement
      .canPlayType('video/mp4; codecs="avc1.640029, mp4a.40.5"')
      .replace(/no/, '')
  ) {
    // TODO: This needs to become part of the stream url in order to prevent stream copy
    conditions.push({
      Condition: ProfileConditionType.NotEquals,
      Property: ProfileConditionValue.AudioProfile,
      Value: 'HE-AAC'
    });
  }

  if (!supportsSecondaryAudio) {
    conditions.push({
      Condition: ProfileConditionType.Equals,
      Property: ProfileConditionValue.IsSecondaryAudio,
      Value: 'false',
      IsRequired: false
    });
  }

  return conditions;
}

/**
 *
 *
 * @param {HTMLVideoElement} videoTestElement A HTML video element for testing codecs
 * @returns {Array<CodecProfile>} - Array containing the different profiles for the client
 */
export function getCodecProfiles(
  videoTestElement: HTMLVideoElement
): Array<CodecProfile> {
  const CodecProfiles = [] as CodecProfile[];

  const aacProfileConditions = getaacCodecProfileConditions(videoTestElement);

  const supportsSecondaryAudio = browserDetector.isTizen();

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
    browserDetector.isTv() ||
    videoTestElement
      .canPlayType('video/mp4; codecs="avc1.640833"')
      .replace(/no/, '')
  ) {
    maxH264Level = 51;
  }

  // Support H264 Level 52 (Tizen 5.0) - app only
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (browserDetector.isTizen5() && window.NativeShell) {
    maxH264Level = 52;
  }

  if (
    browserDetector.isTizen() ||
    videoTestElement
      .canPlayType('video/mp4; codecs="avc1.6e0033"')
      .replace(/no/, '')
  ) {
    // These tests are passing in safari, but playback is failing
    if (
      !browserDetector.isApple() ||
      !browserDetector.isWebOS() ||
      !browserDetector.isEdge()
    ) {
      h264Profiles += '|high 10';
    }
  }

  let maxHevcLevel = 120;
  let hevcProfiles = 'main';

  // hevc main level 4.1
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

  // hevc main10 level 4.1
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

  // hevc main10 level 5.1
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

  // hevc main10 level 6.1
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

  const hevcCodecProfileConditions = [
    {
      Condition: 'NotEquals',
      Property: 'IsAnamorphic',
      Value: 'true',
      IsRequired: false
    },
    {
      Condition: 'EqualsAny',
      Property: 'VideoProfile',
      Value: hevcProfiles,
      IsRequired: false
    },
    {
      Condition: 'LessThanEqual',
      Property: 'VideoLevel',
      Value: maxHevcLevel.toString(),
      IsRequired: false
    }
  ] as ProfileCondition[];

  const h264CodecProfileConditions = [
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

  if (!browserDetector.isTv()) {
    h264CodecProfileConditions.push(
      createProfileCondition(
        ProfileConditionValue.IsInterlaced,
        ProfileConditionType.NotEquals,
        'true'
      )
    );
    hevcCodecProfileConditions.push({
      Condition: ProfileConditionType.NotEquals,
      Property: ProfileConditionValue.IsInterlaced,
      Value: 'true',
      IsRequired: false
    });
  }

  const globalMaxVideoBitrate = (getGlobalMaxVideoBitrate() || '').toString();

  const h264MaxVideoBitrate = globalMaxVideoBitrate;

  const hevcMaxVideoBitrate = globalMaxVideoBitrate;

  if (h264MaxVideoBitrate) {
    h264CodecProfileConditions.push({
      Condition: ProfileConditionType.LessThanEqual,
      Property: ProfileConditionValue.VideoBitrate,
      Value: h264MaxVideoBitrate,
      IsRequired: true
    });
  }

  if (hevcMaxVideoBitrate) {
    hevcCodecProfileConditions.push({
      Condition: ProfileConditionType.LessThanEqual,
      Property: ProfileConditionValue.VideoBitrate,
      Value: hevcMaxVideoBitrate,
      IsRequired: true
    });
  }

  // On iOS 12.x, for TS container max h264 level is 4.2
  if (
    browserDetector.isApple() &&
    browserDetector.isMobile() &&
    (browserDetector.safariVersion() as number) < 13
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
