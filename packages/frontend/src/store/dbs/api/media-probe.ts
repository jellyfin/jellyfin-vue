import type { BaseItemDto, MediaSourceInfo } from '@jellyfin/sdk/lib/generated-client';
import { BaseDbEntity } from '../base-entity.ts';
import type { TApiDatabase } from './apidb.worker.ts';
import type { ProbeResult } from '#/utils/playback-capabilities/probe.ts';

/**
 * A stored probe result, with the `ETag` of the media source it was computed for
 */
export interface StoredProbe {
  readonly etag: string;
  readonly result: ProbeResult;
}

/**
 * The probe results of the media sources of one item, keyed by media source id.
 *
 * It lives in its own table because items are rewritten wholesale on every refresh. It has no expiry of its own:
 * the row is deleted together with its item (see the `DependentTable` declared by the database).
 */
export class MediaProbe extends BaseDbEntity<TApiDatabase> {
  public static override readonly tableName = 'mediaProbes';
  /**
   * Creates a new MediaProbe instance manually (constructor usage is reserved for Dexie.js)
   */
  public static create(itemId: string, sources: MediaProbe['sources']): MediaProbe {
    const instance = new MediaProbe();

    instance.itemId = itemId;
    instance.sources = sources;

    return instance;
  }

  declare public itemId: NonNullable<BaseItemDto['Id']>;
  public sources: Record<NonNullable<MediaSourceInfo['Id']>, StoredProbe> = {};

  /**
   * Only for Dexie.js, use the `create` method instead
   * @internal
   */
  public constructor(db?: TApiDatabase) {
    super(db);
  };

  protected get __dbKey() {
    return this.itemId;
  }
}
