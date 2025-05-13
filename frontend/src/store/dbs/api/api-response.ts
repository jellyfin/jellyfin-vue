import { isArray } from '@jellyfin-vue/shared/validation';
import type { LiteralUnion } from 'type-fest';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { BaseDbEntity } from '../base-entity';
import type { TApiDatabase } from '.';

interface ConstructorParams<T> {
  function: string;
  params: string;
  payload: T extends true ? BaseItemDto | BaseItemDto[] : unknown;
}

export class ApiResponse extends BaseDbEntity<TApiDatabase> {
  public static override readonly tableName = 'responses';
  /**
   * The name of the invoked API function
   */
  public function!: string;
  /**
   * The stringified parameters used to invoke the request
   */
  public params!: string;
  /**
   * If the returned response was an array
   */
  public wasArray = false;
  public ids: BaseItemDto['Id'][] = [];
  /**
   * The raw result obtained from the API
   */
  public rawResult: LiteralUnion<unknown, undefined>;
  /**
   * Wether the request was based on a BaseItem or not
   */
  public ofBaseItem!: boolean;

  protected get __dbKey() {
    return [this.function, this.params];
  }

  /**
   * Creates a new Item instance manually (constructor usage is reserved for Dexie.js)
   * @param db - If provided, saves the created entity to the database
   */
  public static create(
    ofBaseItem: boolean,
    ops: ConstructorParams<typeof ofBaseItem>,
    db?: undefined): ApiResponse;
  public static create(
    ofBaseItem: boolean,
    ops: ConstructorParams<typeof ofBaseItem>,
    db?: TApiDatabase): Promise<ApiResponse>;
  public static create(
    ofBaseItem: boolean,
    ops: ConstructorParams<typeof ofBaseItem>,
    db?: TApiDatabase
  ): ApiResponse | Promise<ApiResponse> {
    const instance = new ApiResponse(db);

    instance.ofBaseItem = ofBaseItem;
    instance.function = ops.function;
    instance.params = ops.params;

    if (instance.ofBaseItem) {
      instance.wasArray = isArray(ops.payload);
      instance.ids = instance.wasArray
        ? (ops.payload as BaseItemDto[]).map(i => i.Id)
        : [(ops.payload as BaseItemDto).Id];
    } else {
      instance.rawResult = ops.payload;
    }

    if (db) {
      return instance.save();
    }

    return instance;
  }

  /**
   * Only for Dexie.js, use the `create` method instead
   * @internal
   */
  public constructor(db?: TApiDatabase) {
    super(db);
  };
}
