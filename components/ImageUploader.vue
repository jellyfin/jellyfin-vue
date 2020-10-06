<template>
  <v-list>
    <v-list-item>
      <v-list-item-content>
        <image-editor-item></image-editor-item>
      </v-list-item-content>
    </v-list-item>
  </v-list>
</template>

<script lang="ts">
import Vue from 'vue';
import { BaseItemPerson } from '~/api';

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
        'Actor',
        'Composer',
        'Director',
        { text: 'Guest star', value: 'GuestStar' },
        'Producer',
        'Writer'
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
