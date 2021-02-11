<template>
  <settings-page
    page-title="settingsSections.user.account.name"
    :loading="loadingDelete || loadingPassword || loadingReset || loadingUpload"
  >
    <template #content>
      <v-row v-if="$vuetify.breakpoint.smAndDown" justify="center">
        <v-avatar size="10vh" class="flex-wrap justify-center">
          <v-progress-circular
            v-if="loadingDelete || loadingUpload"
            indeterminate
          />
          <user-image v-else-if="hasImage" size="10vh" />
          <v-icon v-else-if="!hasImage" size="10vh">mdi-account</v-icon>
        </v-avatar>
      </v-row>
      <v-list class="mt-2" color="transparent">
        <v-list-item>
          <v-avatar
            v-if="!$vuetify.breakpoint.smAndDown"
            size="10vh"
            class="flex-wrap"
          >
            <v-progress-circular
              v-if="loadingDelete || loadingUpload"
              indeterminate
            />
            <user-image v-else-if="hasImage" size="10vh" />
            <v-icon v-else-if="!hasImage" size="10vh">mdi-account</v-icon>
          </v-avatar>
          <v-list-item-content class="ml-4">
            <h1 class="text-h4 text-truncate">{{ $auth.user.Name }}</h1>
          </v-list-item-content>
          <v-list-item-action v-if="$auth.user.Policy.IsAdministrator">
            <v-list-item-action-text>
              <div class="d-flex justify-center">
                <v-icon>mdi-key-chain</v-icon>
                <h3
                  v-if="$vuetify.breakpoint.mdAndUp"
                  class="text-h4 text-overline"
                >
                  {{ $t('settings.account.admin') }}
                </h3>
              </div>
            </v-list-item-action-text>
          </v-list-item-action>
        </v-list-item>

        <v-list-item
          class="d-flex justify-center align-center align-self-center flex-wrap"
        >
          <v-list-item-action>
            <v-btn
              :loading="loadingUpload"
              color="primary"
              class="ma-2"
              @click="onUploadClick"
            >
              <v-icon dark :left="!$vuetify.breakpoint.smAndDown">
                mdi-cloud-upload
              </v-icon>
              <span v-if="!$vuetify.breakpoint.smAndDown">
                {{ $t('settings.account.uploadImage') }}
              </span>
              <input
                ref="uploader"
                type="file"
                name="file"
                accept="image/*"
                style="display: none"
                @change="select($event.target.files)"
              />
            </v-btn>
          </v-list-item-action>
          <v-list-item-action>
            <v-btn
              :loading="loadingDelete"
              color="red"
              class="ma-2"
              :disabled="!hasImage"
              @click="deleteUserImage"
            >
              <v-icon dark :left="!$vuetify.breakpoint.smAndDown">
                mdi-delete
              </v-icon>
              <span v-if="!$vuetify.breakpoint.smAndDown">
                {{ $t('settings.account.deleteImage') }}
              </span>
            </v-btn>
          </v-list-item-action>
        </v-list-item>
      </v-list>

      <v-divider />

      <v-list color="transparent">
        <v-list-item>
          <h1 class="text-overline">
            {{ $t('settings.account.changePassword') }}
          </h1>
        </v-list-item>
        <validation-observer v-slot="{ invalid }">
          <v-form ref="form">
            <v-text-field
              v-if="hasPassword"
              v-model="currentPassword"
              outlined
              :label="$t('settings.account.currentPassword')"
              :append-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
              :type="showPassword ? 'text' : 'password'"
              @click:append="() => (showPassword = !showPassword)"
            />
            <validation-provider
              v-slot="{ errors }"
              rules="bothPasswordsSame:@confirm"
            >
              <v-text-field
                v-model="newPassword"
                outlined
                :label="$t('settings.account.newPassword')"
                :append-icon="showPassword2 ? 'mdi-eye-off' : 'mdi-eye'"
                :type="showPassword2 ? 'text' : 'password'"
                :error-messages="errors"
                @click:append="() => (showPassword2 = !showPassword2)"
              />
            </validation-provider>

            <validation-provider v-slot="{ errors }" name="confirm" rules="">
              <v-text-field
                v-model="passwordCheck"
                outlined
                :label="$t('validation.confirmPassword')"
                :append-icon="showPassword3 ? 'mdi-eye-off' : 'mdi-eye'"
                :type="showPassword3 ? 'text' : 'password'"
                :error-messages="errors"
                @click:append="() => (showPassword3 = !showPassword3)"
              />
            </validation-provider>

            <v-card-actions>
              <v-spacer />
              <v-btn
                color="red"
                :loading="loadingReset"
                :disabled="!hasPassword"
                @click="resetPassword"
              >
                {{ $t('settings.account.resetPassword') }}
              </v-btn>
              <v-btn
                color="primary"
                :disabled="invalid"
                :loading="loadingPassword"
                @click="changePassword"
              >
                {{ $t('settings.account.changePassword') }}
              </v-btn>
            </v-card-actions>
          </v-form>
        </validation-observer>
      </v-list>
      <v-card-actions>
        <v-spacer />
      </v-card-actions>
    </template>
  </settings-page>
</template>

<script lang="ts">
import { ImageType } from '@jellyfin/client-axios';
import Vue from 'vue';
import { mapActions } from 'vuex';

export default Vue.extend({
  data() {
    return {
      currentPassword: '',
      newPassword: '',
      passwordCheck: '',
      showPassword: false,
      showPassword2: false,
      showPassword3: false,
      loadingReset: false,
      loadingPassword: false,
      loadingDelete: false,
      loadingUpload: false
    };
  },
  head() {
    return {
      title: this.$store.state.page.title
    };
  },
  computed: {
    hasPassword: {
      get(): boolean {
        return this.$auth.user.HasPassword;
      }
    },
    hasImage: {
      get(): boolean {
        return this.$auth.user.PrimaryImageTag;
      }
    }
  },
  created() {
    const title =
      this.$t('settingsSections.user.account.name') +
      ' (' +
      this.$auth.user.Name +
      ')';
    this.setPageTitle({ title });
  },
  methods: {
    ...mapActions('snackbar', ['pushSnackbarMessage']),
    ...mapActions('page', ['setPageTitle']),
    clearFields(): void {
      this.currentPassword = '';
      this.newPassword = '';
      this.passwordCheck = '';
    },
    async changePassword(): Promise<void> {
      this.loadingPassword = true;
      try {
        await this.$api.user.updateUserPassword({
          userId: this.$auth.user.Id,
          updateUserPassword: {
            CurrentPw: this.currentPassword,
            NewPw: this.newPassword
          }
        });
        this.pushSnackbarMessage({
          message: this.$t('settings.account.passwordChangedSuccessfully'),
          color: 'success'
        });
        this.$auth.fetchUser();
        this.clearFields();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
        this.pushSnackbarMessage({
          message: this.$t('settings.account.passwordChangeError'),
          color: 'error'
        });
      }
      this.loadingPassword = false;
    },
    async resetPassword(): Promise<void> {
      this.loadingReset = true;
      try {
        await this.$api.user.updateUserPassword({
          userId: this.$auth.user.Id,
          updateUserPassword: {
            ResetPassword: true
          }
        });
        this.pushSnackbarMessage({
          message: this.$t('settings.account.passwordResetSuccess'),
          color: 'success'
        });
        this.$auth.fetchUser();
        this.clearFields();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
        this.pushSnackbarMessage({
          message: this.$t('settings.account.passwordResetError'),
          color: 'error'
        });
      }
      this.loadingReset = false;
    },
    async deleteUserImage(): Promise<void> {
      this.loadingDelete = true;
      try {
        await this.$api.image.deleteUserImage({
          userId: this.$auth.user.Id,
          imageType: ImageType.Primary
        });
        this.pushSnackbarMessage({
          message: this.$t('settings.account.imageDeleteSuccess'),
          color: 'success'
        });
        this.$auth.fetchUser();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
        this.pushSnackbarMessage({
          message: this.$t('settings.account.imageDeleteError'),
          color: 'error'
        });
      }
      this.loadingDelete = false;
    },
    async updateUserImage(file: string): Promise<void> {
      this.loadingUpload = true;
      try {
        await this.$api.image.postUserImage(
          {
            userId: this.$auth.user.Id,
            imageType: ImageType.Primary
          },
          file
        );
        this.pushSnackbarMessage({
          message: this.$t('settings.account.imageUploadSuccess'),
          color: 'success'
        });
        this.$auth.fetchUser();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
        this.pushSnackbarMessage({
          message: this.$t('settings.account.imageUploadError'),
          color: 'error'
        });
      }
      this.loadingUpload = false;
    },
    onUploadClick(): void {
      (this.$refs.uploader as HTMLInputElement).click();
    },
    select(files: FileList): void {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent): void => {
        // Taken from jellyfin-apiclient-javascript method 'uploadUserImage'
        // Split by a comma to remove the url: prefix
        const data = ((e.target as FileReader).result as string).split(',')[1];
        this.updateUserImage(data);
      };
      reader.readAsDataURL(files[0]);
    }
  }
});
</script>
