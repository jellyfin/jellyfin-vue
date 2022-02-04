<template>
  <v-container fill-height>
    <v-row align="center" justify="center">
      <v-col
        v-if="isEmpty(currentUser) && !loginAsOther && publicUsers.length > 0"
        sm="10"
        md="7"
        lg="5"
      >
        <h1 class="text-h4 mb-6 text-center">{{ $t('login.selectUser') }}</h1>
        <v-row align="center" justify="center">
          <v-col
            v-for="publicUser in publicUsers"
            :key="publicUser.Id"
            cols="auto"
          >
            <user-card :user="publicUser" @connect="setCurrentUser" />
          </v-col>
        </v-row>
        <v-row align="center" justify="center" dense class="mt-6">
          <v-col cols="11" sm="6" class="d-flex justify-center">
            <v-btn block large @click="loginAsOther = true">
              {{ $t('login.manualLogin') }}
            </v-btn>
          </v-col>
          <v-col cols="11" sm="6" class="d-flex justify-center">
            <v-btn block to="/server/select" nuxt large>
              {{ $t('login.changeServer') }}
            </v-btn>
          </v-col>
        </v-row>
      </v-col>
      <v-col
        v-else-if="!isEmpty(currentUser) || loginAsOther || !publicUsers.length"
        sm="6"
        md="6"
        lg="5"
      >
        <h1 v-if="!isEmpty(currentUser)" class="text-h4 mb-6 text-center">
          {{ $t('login.loginAs', { name: currentUser.Name }) }}
        </h1>
        <h1 v-else class="text-h4 mb-6 text-center">{{ $t('login.login') }}</h1>
        <login-form :user="currentUser" @change="resetCurrentUser" />
        <p class="text-p mt-6 text-center">{{ disclaimer }}</p>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import isEmpty from 'lodash/isEmpty';
import Vue from 'vue';
import { mapActions, mapState } from 'vuex';
import { UserDto } from '@jellyfin/client-axios';

export default Vue.extend({
  layout: 'fullpage',
  middleware: 'serverMiddleware',
  auth: false,
  async asyncData({ store, redirect, $api }) {
    try {
      await store.dispatch(
        'servers/connectServer',
        store.state.servers.serverUsed.address
      );

      const brandingData = (await $api.branding.getBrandingOptions()).data;

      const publicUsers = (await $api.user.getPublicUsers({})).data;
      const disclaimer = brandingData.LoginDisclaimer;

      return { publicUsers, disclaimer };
    } catch {
      redirect('/server/select');
    }
  },
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
      title: this.title
    };
  },
  computed: {
    ...mapState('page', ['title'])
  },
  mounted() {
    this.setPageTitle({ title: this.$t('login.login') });
  },
  methods: {
    ...mapActions('page', ['setPageTitle']),
    ...mapActions('deviceProfile', ['setDeviceProfile']),
    ...mapActions('snackbar', ['pushSnackbarMessage']),
    ...mapActions('servers', ['connectServer']),
    isEmpty(value: Record<never, never>): boolean {
      return isEmpty(value);
    },
    async setCurrentUser(user: UserDto): Promise<void> {
      if (!user.HasPassword) {
        // If the user doesn't have a password, avoid showing the password form
        await this.setDeviceProfile();
        await this.$auth.loginWith('jellyfin', {
          username: user.Name,
          password: '',
          rememberMe: true
        });

        this.$router.replace('/');
      } else {
        this.currentUser = user;
      }
    },
    resetCurrentUser(): void {
      this.currentUser = {};
      this.loginAsOther = false;
    }
  }
});
</script>
