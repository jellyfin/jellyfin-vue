import { render } from '@testing-library/vue';
import Vue from 'vue';
import Vuei18n from 'vue-i18n';
import Vuetify from 'vuetify';
import HomeHeaderAlbumTitle from '~/components/Layout/HomeHeader/HomeHeaderAlbumTitle.vue';
import {
  mockSingleAlbum,
  mockSingleAlbumWithoutArtistArt
} from '~/tests/itemsMocks';
import * as enLocale from '~/locales/en-US.json';

Vue.use(Vuetify);

const messages = {
  en: enLocale
};

describe('HomeHeaderAlbumTitle', () => {
  test("shows the artist's logo if available", () => {
    const { container } = render(
      HomeHeaderAlbumTitle,
      {
        props: {
          item: mockSingleAlbum,
          logo:
            'http://127.0.0.1:8096/Items/0385ff64e388199446306999569bc7f3/Images/Logo?quality=90'
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

  test("shows the artist's name if the logo is not available", () => {
    const { getByText } = render(
      HomeHeaderAlbumTitle,
      {
        props: {
          item: mockSingleAlbumWithoutArtistArt,
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

    getByText('NakamuraEmi');
  });

  test("shows the album's name", () => {
    const { getByText } = render(
      HomeHeaderAlbumTitle,
      {
        props: {
          item: mockSingleAlbum,
          logo:
            'http://127.0.0.1:8096/Items/0385ff64e388199446306999569bc7f3/Images/Logo?quality=90'
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

    getByText('Sounds of Silence');
  });
});
