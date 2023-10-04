import { reactive, watch } from 'vue';
import { getUserViewsApi } from '@jellyfin/sdk/lib/utils/api/user-views-api';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import {
  BaseItemDto,
  ItemFields
} from '@jellyfin/sdk/lib/generated-client';
import { usei18n, useRemote, useSnackbar } from '@/composables';

/**
 * == INTERFACES AND TYPES ==
 */
interface UserLibraryItems {
  [key: string]: BaseItemDto[];
}

interface UserItemsState {
  views: BaseItemDto[];
  viewItems: UserLibraryItems;
  isReady: boolean;
}

/**
 * == CLASS CONSTRUCTOR ==
 */
class UserItemsStore {
  /**
   * == STATE SECTION ==
   */
  private _defaultState: UserItemsState = {
    views: [],
    viewItems: {},
    isReady: false
  };

  private _state = reactive<UserItemsState>(
    structuredClone(this._defaultState)
  );
  /**
   * == GETTERS AND SETTERS==
   */
  public get libraries(): typeof this._state.views {
    return this._state.views;
  }
  public get isReady(): typeof this._state.isReady {
    return this._state.isReady;
  }
  public getLibraryItems(libraryId: string): BaseItemDto[] {
    return this._state.viewItems[libraryId] ?? [];
  }

  /**
   * == ACTIONS ==
   */
  private _onError = (error: unknown): void => {
    const { t } = usei18n();

    console.error(error);
    useSnackbar(t('errors.anErrorHappened'), 'error');
  };

  private _updateUserViews = async (): Promise<void> => {
    const remote = useRemote();

    try {
      const userViewsResponse = await remote.sdk
        .newUserApi(getUserViewsApi)
        .getUserViews({
          userId: remote.auth.currentUserId ?? ''
        });

      this._state.views = userViewsResponse.data.Items ?? [];
    } catch (error) {
      this._onError(error);
    }
  };

  private _updateLibraryItems = async (libraryId: string): Promise<void> => {
    const remote = useRemote();

    try {
      const libraryItems =
        (
          await remote.sdk.newUserApi(getItemsApi).getItems({
            userId: remote.auth.currentUserId ?? '',
            parentId: libraryId,
            fields: Object.values(ItemFields)
          })
        ).data;

      this._state.viewItems[libraryId] = libraryItems.Items ?? [];
    } catch (error) {
      console.log(error);
      this._onError(error);
    }
  };


  public refresh = async (): Promise<void> => {
    // Fetch views so the library data can be fetches
    await this._updateUserViews();

    const promises: Promise<void>[] = [];

    for (const library of this.libraries) {
      console.log(library);

      if (library.Id) {
        promises.push(this._updateLibraryItems(library.Id));
      }
    }

    await Promise.all(promises);

    this._state.isReady = true;
  };

  private _clear = (): void => {
    Object.assign(this._state, this._defaultState);
  };

  public constructor() {
    const remote = useRemote();

    watch(
      () => remote.auth.currentUser,
      () => {
        if (!remote.auth.currentUser) {
          this._clear();
        }
      }
    );
  }
}

const userItems = new UserItemsStore();

export default userItems;
