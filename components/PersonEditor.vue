<template>
  <v-dialog v-model="dialog" max-width="60%">
    <v-card>
      <v-card-title class="headline">{{ $t('edit') }}</v-card-title>
      <v-card-text>
        <v-form ref="form" @submit.prevent="handleSubmit">
          <v-text-field
            v-model="editState.Name"
            outlined
            :label="$t('name')"
          ></v-text-field>
          <v-select
            v-model="editState.Type"
            :items="options"
            :label="$t('type')"
            outlined
          ></v-select>
          <v-text-field
            v-if="editState.Type === 'Actor'"
            v-model="editState.Role"
            outlined
            :label="$t('role')"
          ></v-text-field>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn depressed @click="handleCancle">Cancel</v-btn>
            <v-btn depressed color="primary" type="submit">Save</v-btn>
          </v-card-actions>
        </v-form>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Vue from 'vue';
import { BaseItemPerson } from '@jellyfin/client-axios';

export default Vue.extend({
  props: {
    person: {
      type: Object,
      default: () => ({
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
    person(value: BaseItemPerson) {
      if (!value) return;
      this.editState = value;
    }
  },
  methods: {
    handleSubmit() {
      this.$emit('update:person', this.editState);
      this.$emit('update:dialog', false);
      this.reset();
    },
    handleCancle() {
      this.$emit('update:dialog', false);
      this.reset();
    },
    reset() {
      this.editState = { Name: '', Type: '', Role: '' };
    }
  }
});
</script>
