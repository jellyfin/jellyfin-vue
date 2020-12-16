import { render } from '@testing-library/vue';
import Vue from 'vue';
import Vuei18n from 'vue-i18n';
import Vuetify from 'vuetify';
import HomeHeaderGenericTitle from '~/components/Layout/HomeHeader/HomeHeaderGenericTitle.vue';
import { mockMovie, mockMovieWithoutArt } from '~/tests/itemsMocks';
import * as enLocale from '~/locales/en-US.json';

Vue.use(Vuetify);

const messages = {
  en: enLocale
};

describe('HomeHeaderAlbumTitle', () => {
  test('shows the logo if available', () => {
    const { container } = render(
      HomeHeaderGenericTitle,
      {
        props: {
          item: mockMovie,
          logo: ''
        }
      },
      (vue) => {
        vue.use(Vuei18n);
        const i18n = new Vuei18n({
          locale: 'en',
          fallbackLocale: 'en',
          messages
        });
        return { i18n };
      }
    );

    expect(container.querySelector('.v-image')).toBeTruthy();
  });

  test('shows the name if not available', () => {
    const { getByText } = render(
      HomeHeaderGenericTitle,
      {
        props: {
          item: mockMovieWithoutArt,
          logo: ''
        }
      },
      (vue) => {
        vue.use(Vuei18n);
        const i18n = new Vuei18n({
          locale: 'en',
          fallbackLocale: 'en',
          messages
        });
        return { i18n };
      }
    );

    getByText(mockMovie.Name);
  });
});
