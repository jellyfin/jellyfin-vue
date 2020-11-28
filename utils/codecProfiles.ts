import { browserDetector } from '~/plugins/browserDetection';
import {
  CodecProfile,
  CodecType,
  ProfileConditionType,
  ProfileCondition,
  ProfileConditionValue
} from '~/api';

/**
 * Creates a profile condition object for use in device playback profiles.
 *
 * @param {ProfileConditionValue} Property
 * @param {ProfileConditionType} Condition
 * @param {string} Value
 * @param {boolean} IsRequired
 * @returns {ProfileCondition}
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
 *
 *
 * @param {HTMLVideoElement} videoTestElement A HTML video element for testing codecs
 * @returns {Array<CodecProfile>}
 */
export function getCodecProfiles(
  videoTestElement: HTMLVideoElement
): Array<CodecProfile> {
  const CodecProfiles = [];

  const supportsSecondaryAudio = browserDetector.isTizen();

  const aacProfileConditions = [] as ProfileCondition[];

  if (
    !videoTestElement
      .canPlayType('video/mp4; codecs="avc1.640029, mp4a.40.5"')
      .replace(/no/, '')
  ) {
    aacProfileConditions.push(
      createProfileCondition(
        ProfileConditionValue.AudioProfile,
        ProfileConditionType.NotEquals,
        'HE-AAC'
      )
    );
  }

  if (!supportsSecondaryAudio) {
    aacProfileConditions.push(
      createProfileCondition(
        ProfileConditionValue.IsSecondaryAudio,
        ProfileConditionType.Equals,
        'false'
      )
    );
  }

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
  if (browserDetector.isTizen5()) {
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

  return CodecProfiles;
}
