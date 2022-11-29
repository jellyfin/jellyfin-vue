<template>
  <v-dialog :model-value="dialog" max-width="30%" @click:outside="handleCancel">
    <v-card>
      <v-card-title>{{ $t('editPerson') }}</v-card-title>
      <v-divider />
      <v-card-text class="pa-3">
        <v-row>
          <v-col cols="4">
            <v-avatar size="160" class="ml-2">
              <v-img
                v-if="person && person.PrimaryImageTag"
                :src="`${$axios.defaults.baseURL}/Items/${person.Id}/Images/Primary`" />
              <Icon v-else class="bg-grey-darken-3">
                <i-mdi-account />
              </Icon>
            </v-avatar>
          </v-col>
          <v-col>
            <v-form @submit.prevent="handleSubmit">
              <v-text-field
                v-model="editState.Name"
                variant="outlined"
                :label="$t('name')" />
              <v-select
                v-model="editState.Type"
                :items="options"
                :label="$t('type')"
                variant="outlined" />
              <v-text-field
                v-if="editState.Type === 'Actor'"
                v-model="editState.Role"
                variant="outlined"
                :label="$t('role')" />
            </v-form>
          </v-col>
        </v-row>
      </v-card-text>
      <v-divider />
      <v-card-actions
        class="d-flex align-center pa-3"
        :class="{
          'justify-end': !$vuetify.display.mobile,
          'justify-center': $vuetify.display.mobile
        }">
        <v-spacer />
        <v-btn variant="flat" width="8em" class="mr-1" @click="handleCancel">
          {{ $t('cancel') }}
        </v-btn>
        <v-btn variant="flat" width="8em" color="primary" type="submit">
          {{ $t('save') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { BaseItemPerson } from '@jellyfin/sdk/lib/generated-client';

export default defineComponent({
  props: {
    person: {
      type: Object,
      default: (): BaseItemPerson => ({
        Name: '',
        Type: '',
        Role: ''
      })
    },
    dialog: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      editState: {} as BaseItemPerson,
      options: [
        { text: this.$t('actor'), value: 'Actor' },
        { text: this.$t('composer'), value: 'Composer' },
        { text: this.$t('director'), value: 'Director' },
        { text: this.$t('guestStar'), value: 'GuestStar' },
        { text: this.$t('producer'), value: 'Producer' },
        { text: this.$t('writer'), value: 'Writer' }
      ]
    };
  },
  watch: {
    person(value: BaseItemPerson): void {
      if (!value) {
        return;
      }

      this.editState = value;
    }
  },
  methods: {
    handleSubmit(): void {
      this.$emit('update:person', this.editState);
      this.$emit('update:dialog', false);
      this.reset();
    },
    handleCancel(): void {
      this.$emit('update:dialog', false);
      this.reset();
    },
    reset(): void {
      this.editState = { Name: '', Type: '', Role: '' };
    }
  }
});
</script>
