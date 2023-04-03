<template>
  <settings-page page-title="settings.account.account">
    <template #actions>
      <v-btn
        v-if="auth.currentUser"
        color="primary"
        class="ml-a"
        @click="onUploadClick"
      >
        {{ $t('settings.account.updateImage') }}
      </v-btn>
      <input
        ref="uploader"
        type="file"
        name="file"
        accept="image/*"
        style="display: none"
        @change="select($event.target.files)"
      />
      <v-btn
        v-if="auth.currentUser"
        color="error"
        class="ml-a"
        @click="deleteUserImage"
      >
        {{ $t('settings.account.removeImage') }}
      </v-btn>
    </template>
    <template #content>
      <v-col class="text-center" cols="10" md="10" lg="3">
        <user-image
          v-if="auth.currentUser"
          :user="auth.currentUser"
          :size="200"
          :key="componentKey"
          :initialLoading="initialLoading"
          rounded
          class="text-center"
        />
        <h1 class="mt-3 text-center" v-if="auth.currentUser">
          {{ auth.currentUser.Name }}
        </h1>
      </v-col>
      <v-col cols="10" md="10" lg="7">
        <v-card class="pa-0 flex-grow-1">
          <validation-observer v-slot="{ invalid }">
            <v-card-title>{{
              $t('settings.account.updatePassword')
            }}</v-card-title>
            <v-card-text class="pb-0">
              <v-text-field
                class="px-5 pt-5"
                v-model="currentPassword"
                :label="$t('settings.account.currentPassword')"
                :append-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                :type="showPassword ? 'text' : 'password'"
                @click:append="() => (showPassword = !showPassword)"
                outlined
              ></v-text-field>
              <validation-provider
                v-slot="{ errors }"
                rules="bothPasswordsSame:@confirm"
              >
                <v-text-field
                  class="px-5"
                  v-model="newPassword"
                  :error-messages="errors"
                  :append-icon="showPassword2 ? 'mdi-eye-off' : 'mdi-eye'"
                  :type="showPassword2 ? 'text' : 'password'"
                  @click:append="() => (showPassword2 = !showPassword2)"
                  :label="$t('settings.account.newPassword')"
                  outlined
                ></v-text-field>
              </validation-provider>
              <validation-provider v-slot="{ errors }" name="confirm" rules="">
                <v-text-field
                  class="px-5"
                  v-model="confirmPassword"
                  :append-icon="showPassword2 ? 'mdi-eye-off' : 'mdi-eye'"
                  :type="showPassword2 ? 'text' : 'password'"
                  @click:append="() => (showPassword2 = !showPassword2)"
                  :error-messages="errors"
                  :label="$t('wizard.confirmPassword')"
                  outlined
                ></v-text-field>
              </validation-provider>
            </v-card-text>
            <v-card-actions
              class="d-flex align-center pt-0"
              :class="{
                'justify-end pr-9': !$vuetify.breakpoint.mobile,
                'justify-center': $vuetify.breakpoint.mobile
              }"
            >
              <v-btn
                depressed
                width="12em"
                color="primary"
                :disabled="invalid"
                @click="updatePassword"
              >
                {{ $t('settings.account.updatePassword') }}
              </v-btn>
            </v-card-actions>
          </validation-observer>
        </v-card>
      </v-col>
    </template>
  </settings-page>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapStores } from 'pinia';
import { ImageType } from '@jellyfin/client-axios';
import { authStore, snackbarStore } from '~/store';

export default Vue.extend({
  data() {
    return {
      componentKey: 0,
      imageLoading: true,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      showPassword: false,
      showPassword2: false
    };
  },
  computed: {
    ...mapStores(authStore, snackbarStore),
  methods: {
    clearFields(): void {
      this.currentPassword = '';
      this.newPassword = '';
      this.confirmPassword = '';
    },
    async updatePassword(): Promise<void> {
      try {
        await this.$api.user.updateUserPassword({
          userId: this.auth.currentUserId,
          updateUserPassword: {
            CurrentPw: this.currentPassword,
            NewPw: this.newPassword
          }
        });
        this.snackbar.push(
          this.$t('settings.account.passwordChangedSuccessfully'),
          'success'
        );
        this.clearFields();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
        this.snackbar.push(
          this.$t('settings.account.passwordChangeError'),
          'error'
        );
      }
    },
    async deleteUserImage(): Promise<void> {
      try {
        await this.$api.image.deleteUserImage({
          userId: this.auth.currentUserId || '',
          imageType: ImageType.Primary
        });

        this.snackbar.push(
          this.$t('settings.account.deleteImageSuccess'),
          'success'
        );
        this.reload();
      } catch (error) {
        this.snackbar.push(
          this.$t('settings.account.deleteImageError'),
          'error'
        );
        // eslint-disable-next-line no-console
        console.error(error);
      }
    },
    async postUserImage(file: string): Promise<void> {
      try {
        await this.$api.image.postUserImage({
          userId: this.auth.currentUserId || '',
          imageType: ImageType.Primary,
          body: file
        });

        this.snackbar.push(
          this.$t('settings.account.updateImageSuccess'),
          'success'
        );
        this.reload();
      } catch (error) {
        this.snackbar.push(
          this.$t('settings.account.updateImageError'),
          'error'
        );
        // eslint-disable-next-line no-console
        console.error(error);
      }
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
        this.postUserImage(data);
      };
      reader.readAsDataURL(files[0]);
    },
    reload() {
      //This updates the component key which is passed through to the user-image component
      this.componentKey += 1;
    }
  }
});
</script>
