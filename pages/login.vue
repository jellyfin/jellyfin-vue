<template>
  <v-container fill-height>
    <v-row align="center" justify="center">
      <v-col
        v-if="isEmpty(currentUser) && !loginAsOther && publicUsers.length > 0"
        xl="8"
      >
        <h1 class="text-h4 mb-6 text-center">{{ $t('selectUser') }}</h1>
        <v-row align="center" justify="center">
          <v-col
            v-for="publicUser in publicUsers"
            :key="publicUser.Id"
            xl="2"
            lg="2"
            md="3"
            sm="4"
            xs="4"
            cols="6"
          >
            <user-card :user="publicUser" @connect="setCurrentUser" />
          </v-col>
        </v-row>
        <v-row align="center" justify="center" no-gutters>
          <v-col md="4" class="d-flex flex-row mt-7">
            <v-btn class="flex-grow-1 mr-2" large @click="loginAsOther = true">
              {{ $t('manualLogin') }}
            </v-btn>
            <v-btn class="flex-grow-1 mr-2" to="/selectServer" nuxt large>
              {{ $t('changeServer') }}
            </v-btn>
            <locale-switcher />
          </v-col>
        </v-row>
      </v-col>
      <v-col
        v-else-if="!isEmpty(currentUser) || loginAsOther || !publicUsers.length"
        md="4"
      >
        <h1 v-if="!isEmpty(currentUser)" class="text-h4 mb-6 text-center">
          {{ $t('loginAs', { name: currentUser.Name }) }}
        </h1>
        <h1 v-else class="text-h4 mb-6 text-center">{{ $t('login') }}</h1>
        <login-form :user="currentUser" @change="resetCurrentUser" />
        <p class="text-p mt-6 text-center">{{ disclaimer }}</p>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { isEmpty } from 'lodash';
import Vue from 'vue';
import { mapActions } from 'vuex';
import { UserDto } from '@jellyfin/client-axios';

export default Vue.extend({
  layout: 'fullpage',
  middleware: 'serverMiddleware',
  data() {
    return {
      loginAsOther: false,
      currentUser: {} as UserDto,
      publicUsers: [] as Array<UserDto>,
      disclaimer: ''
    };
  },
  head() {
    return {
      title: this.$store.state.page.title
    };
  },
  created() {
    this.setPageTitle({ title: this.$t('login') });
  },
  async beforeMount() {
    try {
      this.publicUsers = (await this.$api.user.getPublicUsers({})).data;
      const brandingData = (await this.$api.branding.getBrandingOptions()).data;
      this.disclaimer = brandingData.LoginDisclaimer || '';
    } catch (error) {
      console.error('Unable to get public users:', error);
    }
  },
  methods: {
    ...mapActions('page', ['setPageTitle']),
    ...mapActions('deviceProfile', ['setDeviceProfile']),
    isEmpty(value: Record<never, never>) {
      return isEmpty(value);
    },
    setCurrentUser(user: UserDto) {
      if (!user.HasPassword) {
        // If the user doesn't have a password, avoid showing the password form
        this.setDeviceProfile();
        this.$auth.loginWith('jellyfin', {
          username: user.Name,
          password: ''
        });
        return; // Avoid changing the form
      }
      this.currentUser = user;
    },
    resetCurrentUser() {
      this.currentUser = {};
      this.loginAsOther = false;
    }
  }
});
</script>
