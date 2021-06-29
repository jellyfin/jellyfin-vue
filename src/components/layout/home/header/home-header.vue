<template>
  <swiper
    class="swiper"
    :initial-slide="0"
    :pagination="{
      el: '.progress-bar-container',
      clickable: true
    }"
    :loop="true"
    :parallax="true"
    :autoplay="{
      delay: duration,
      stopOnLastSlide: false,
      disableOnInteraction: false,
      pauseOnMouseEnter: false
    }"
    :effect="'fade'"
    :fade-effect="{ crossFade: true }"
    :keyboard="true"
    @slide-change="onSlideChange"
    @swiper="onSwiper"
  >
    <swiper-slide v-for="(item, index) in items" :key="index">
      <div class="slide-backdrop">
        <div class="default-icon" />
        <blurhash-image
          :key="`${item.Id}-image`"
          :item="item"
          :type="'Backdrop'"
          :icon-size="display.mdAndUp ? '256' : '128'"
        />
      </div>
      <div class="slide-content">
        <v-container
          class="
            d-flex
            slide-content-container
            mx-md-10
            mt-md-5
            py-md-4
            align-end align-sm-center align-md-start
          "
        >
          <v-row>
            <v-col
              cols="12"
              sm="8"
              md="6"
              xl="5"
              class="d-flex flex-column align-start py-0 py-md-4"
            >
              <p class="text-overline text-truncate mb-2 my-2">
                {{ t('homeHeader.items.recentlyAdded') }}
              </p>
              <home-header-album-title
                v-if="item.Type === 'MusicAlbum'"
                class="mb-sm-n1"
                :item="item"
              />
              <home-header-episode-title
                v-else-if="item.Type === 'Episode'"
                :item="item"
              />
              <home-header-generic-title v-else :item="item" />
              <media-info
                :item="item"
                year
                tracks
                runtime
                rating
                class="mb-3"
              />
              <div class="d-flex">
                <play-button :item="item" />
                <v-btn min-width="12em" outlined rounded nuxt>
                  {{ t('viewDetails') }}
                </v-btn>
              </div>
            </v-col>
          </v-row>
        </v-container>
      </div>
    </swiper-slide>
    <div class="progress-bar-container px-2 px-sm-4"></div>
  </swiper>
</template>

<script lang="ts">
import { LocationType, VideoType } from '@jellyfin/client-axios';
import SwiperClass from 'swiper/types/swiper-class';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { computed, defineComponent, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDisplay } from 'vuetify/lib/composables/display';
import { useMain } from 'vuetify/lib/composables/layout';

export default defineComponent({
  components: { Swiper, SwiperSlide },
  props: {
    slideDuration: {
      type: Number,
      default: 7500
    }
  },
  setup() {
    const swiperReference = ref<SwiperClass>();
    const currentIndex = ref(0);
    const duration = ref(7000);
    const durationSeconds = computed(() => `${duration.value}s`);

    const { t } = useI18n();
    const display = useDisplay();
    const { getLayoutItem } = useMain();

    const topMargin = getLayoutItem('app-bar').size;

    const onSwiper = (swiper: SwiperClass) => {
      swiperReference.value = swiper;
    };

    const onSlideChange = (swiper: SwiperClass) => {
      currentIndex.value = swiper.realIndex;

      let bullets = swiperReference.value?.pagination.el.querySelectorAll(
        '.swiper-pagination-bullet'
      );

      if (currentIndex.value !== undefined && bullets) {
        const bulletsArray = Array.prototype.slice.call(bullets);
        const previousBars = bulletsArray.slice(0, currentIndex.value);
        const nextBars = bulletsArray.slice(currentIndex.value + 1);

        for (const previousBar of previousBars) {
          previousBar.classList.add('swiper-pagination-bullet-passed');
        }

        for (const nextBar of nextBars) {
          nextBar.classList.remove('swiper-pagination-bullet-passed');
        }
      }
    };

    /* eslint-disable */
    const items = ref([
      {
        Name: 'Pioneer One',
        ServerId: '713dc3fe952b438fa70ed35e4ef0525a',
        Id: '05991932707d2c668148d8ed19cdb544',
        PremiereDate: '2010-06-16T00:00:00.0000000Z',
        OfficialRating: 'NR',
        Overview:
          'An object in the sky spreads radiation over North America. Fearing terrorism, U.S. Homeland Security agents are dispatched to investigate and contain the damage. What they discover will have implications for the entire world.',
        CommunityRating: 6.9,
        RunTimeTicks: 17_999_998_976,
        ProductionYear: 2010,
        IsFolder: true,
        Type: 'Series',
        UserData: {
          UnplayedItemCount: 1,
          PlaybackPositionTicks: 0,
          PlayCount: 0,
          IsFavorite: false,
          Played: false,
          Key: '170551'
        },
        ChildCount: 2,
        Status: 'Ended',
        AirDays: [],
        PrimaryImageAspectRatio: 0.666_666_666_666_666_6,
        ImageTags: {},
        BackdropImageTags: ['41ad288fa59a0e768201e76b713bd18b'],
        ImageBlurHashes: {
          Backdrop: {
            '41ad288fa59a0e768201e76b713bd18b':
              'WiI4hd}q,--=x]t6~WrqZ~xvtRoeIpD*IUjFniaen%aeafjFaLV['
          }
        },
        LocationType: LocationType.FileSystem,
        EndDate: '2011-12-13T00:00:00.0000000Z'
      },
      {
        Name: 'Caminandes: Llama Drama',
        ServerId: '713dc3fe952b438fa70ed35e4ef0525a',
        Id: 'c541e7545e58b28cd4d0da7aac89d7e8',
        Container: 'mov,mp4,m4a,3gp,3g2,mj2',
        PremiereDate: '2013-02-10T00:00:00.0000000Z',
        Overview: 'Koro wants to get to the other side of the road.',
        CommunityRating: 6.9,
        RunTimeTicks: 900000000,
        ProductionYear: 2013,
        IsFolder: false,
        Type: 'Movie',
        UserData: {
          PlaybackPositionTicks: 0,
          PlayCount: 71,
          IsFavorite: false,
          LastPlayedDate: '2021-06-26T06:46:48.7787436Z',
          Played: true,
          Key: '253777'
        },
        ChildCount: 0,
        PrimaryImageAspectRatio: 0.6666666666666666,
        VideoType: VideoType.VideoFile,
        ImageTags: {},
        BackdropImageTags: ['292401c2c1fe9d128ea391a8156aa871'],
        ImageBlurHashes: {
          Backdrop: {
            '292401c2c1fe9d128ea391a8156aa871':
              'WzJacdt6V@xaazs:_NofRkofayof%fbbj?ayjZkBxZs.oeayazoe'
          }
        },
        LocationType: LocationType.FileSystem,
        MediaType: 'Video'
      },
      {
        Name: 'Caminandes:  Llamigos',
        ServerId: '713dc3fe952b438fa70ed35e4ef0525a',
        Id: 'c7eb95d14156c803611cf4a78ac469f6',
        Container: 'mov,mp4,m4a,3gp,3g2,mj2',
        PremiereDate: '2016-01-30T00:00:00.0000000Z',
        Overview:
          "In this episode of the Caminandes cartoon series we learn to know our hero Koro even better! It's winter in Patagonia, food is getting scarce. Koro the Llama engages with Oti the pesky penguin in an epic fight over that last tasty berry.  This short animation film was made with Blender and funded by the subscribers of the Blender Cloud platform. Already since 2007, Blender Institute successfully combines film and media production with improving a free and open source 3D creation pipeline.",
        CommunityRating: 7.6,
        RunTimeTicks: 1501479936,
        ProductionYear: 2016,
        IsFolder: false,
        Type: 'Movie',
        UserData: {
          PlaybackPositionTicks: 0,
          PlayCount: 66,
          IsFavorite: false,
          LastPlayedDate: '2021-06-26T06:25:55.7074653Z',
          Played: true,
          Key: '406956'
        },
        ChildCount: 0,
        PrimaryImageAspectRatio: 0.6666666666666666,
        VideoType: VideoType.VideoFile,
        ImageTags: {},
        BackdropImageTags: ['2c490973cfdb55d974f0c0d5c8c20215'],
        ImageBlurHashes: {
          Backdrop: {
            '2c490973cfdb55d974f0c0d5c8c20215':
              'WTGb#Q^+%#R-NNtm0$kWMxR:tlae%NbctRt6s9iv%NRjn%nhoeW;'
          }
        },
        LocationType: LocationType.FileSystem,
        MediaType: 'Video'
      },
      {
        Name: 'Caminandes: Gran Dillama',
        ServerId: '713dc3fe952b438fa70ed35e4ef0525a',
        Id: '1056b7d34f0fa0b8ce635428e8b27f37',
        Container: 'mov,mp4,m4a,3gp,3g2,mj2',
        PremiereDate: '2013-11-22T00:00:00.0000000Z',
        Overview:
          'A young llama named Koro discovers that the grass is always greener on the other side (of the fence).',
        CommunityRating: 7.1,
        RunTimeTicks: 1460480000,
        ProductionYear: 2013,
        IsFolder: false,
        Type: 'Movie',
        UserData: {
          PlaybackPositionTicks: 0,
          PlayCount: 55,
          IsFavorite: false,
          LastPlayedDate: '2020-02-15T12:30:36.2222941Z',
          Played: true,
          Key: '253774'
        },
        ChildCount: 0,
        PrimaryImageAspectRatio: 0.6666666666666666,
        VideoType: VideoType.VideoFile,
        ImageTags: {},
        BackdropImageTags: ['f1d122263a3d3055e4c756dd3240b532'],
        ImageBlurHashes: {
          Backdrop: {
            f1d122263a3d3055e4c756dd3240b532:
              'WuKU1oxaW=xuocxtpykCWCs:oJj]yEkDn$e:WEbb?Ha}oeofS4bI'
          }
        },
        LocationType: LocationType.FileSystem,
        MediaType: 'Video'
      },
      {
        Name: 'Promo',
        ServerId: '713dc3fe952b438fa70ed35e4ef0525a',
        Id: '920673748d7c8a4aa03144614f1f947f',
        Overview: '',
        RunTimeTicks: 3133387776,
        ProductionYear: 2004,
        IsFolder: true,
        Type: 'MusicAlbum',
        ParentBackdropItemId: '9ebcc113abb3ee375dbf1d68c9576ed5',
        ParentBackdropImageTags: ['36f192239dc2d9ee7f6ebb394b20e0ce'],
        UserData: {
          PlaybackPositionTicks: 0,
          PlayCount: 0,
          IsFavorite: false,
          Played: false,
          Key: 'MusicAlbum-MusicBrainzReleaseGroup-3eb06b2c-98ac-3a1b-bbb7-6f8a2f075e10'
        },
        ChildCount: 2,
        PrimaryImageAspectRatio: 1,
        Artists: ['Binaerpilot'],
        ArtistItems: [
          {
            Name: 'Binaerpilot',
            Id: '9ebcc113abb3ee375dbf1d68c9576ed5'
          }
        ],
        AlbumArtist: 'Binaerpilot',
        AlbumArtists: [
          {
            Name: 'Binaerpilot',
            Id: '9ebcc113abb3ee375dbf1d68c9576ed5'
          }
        ],
        ImageTags: {},
        BackdropImageTags: [],
        ImageBlurHashes: {
          Backdrop: {
            '36f192239dc2d9ee7f6ebb394b20e0ce':
              'WYECwdRjRjt7%Mt7~qWBRjofxuofRjfQWBayfQWBM{j[j[ayWBay'
          }
        },
        LocationType: LocationType.FileSystem
      },
      {
        Name: "You Can't Stop Da Funk",
        ServerId: '713dc3fe952b438fa70ed35e4ef0525a',
        Id: 'f21ea9ece4e6e26ec26ebfb81b82ad78',
        Overview: '',
        RunTimeTicks: 2675461120,
        ProductionYear: 2006,
        IsFolder: true,
        Type: 'MusicAlbum',
        ParentBackdropItemId: '9ebcc113abb3ee375dbf1d68c9576ed5',
        ParentBackdropImageTags: ['36f192239dc2d9ee7f6ebb394b20e0ce'],
        UserData: {
          PlaybackPositionTicks: 0,
          PlayCount: 0,
          IsFavorite: true,
          Played: false,
          Key: 'MusicAlbum-MusicBrainzReleaseGroup-c7242baf-bd79-363c-a780-f713547faf9e'
        },
        ChildCount: 1,
        PrimaryImageAspectRatio: 1,
        Artists: ['Binaerpilot'],
        ArtistItems: [
          {
            Name: 'Binaerpilot',
            Id: '9ebcc113abb3ee375dbf1d68c9576ed5'
          }
        ],
        AlbumArtist: 'Binaerpilot',
        AlbumArtists: [
          {
            Name: 'Binaerpilot',
            Id: '9ebcc113abb3ee375dbf1d68c9576ed5'
          }
        ],
        ImageTags: {},
        BackdropImageTags: [],
        ImageBlurHashes: {
          Backdrop: {
            '36f192239dc2d9ee7f6ebb394b20e0ce':
              'WYECwdRjRjt7%Mt7~qWBRjofxuofRjfQWBayfQWBM{j[j[ayWBay'
          }
        },
        LocationType: LocationType.FileSystem
      },
      {
        Name: 'Battle of the Stars',
        ServerId: '713dc3fe952b438fa70ed35e4ef0525a',
        Id: '4215a181aa5ccad417de3c3bb7f92d21',
        Container: 'mov,mp4,m4a,3gp,3g2,mj2',
        PremiereDate: '1978-02-17T00:00:00.0000000Z',
        OfficialRating: 'PG-13',
        Overview:
          'An alien vessel manages to break the earth defense systems. Captain Layton is sent to investigate and find the invaders. Together with friends from the planet Ganymed he discovers the enemies in a hidden underground city on earth.',
        CommunityRating: 2.7,
        RunTimeTicks: 53432049664,
        ProductionYear: 1978,
        IsFolder: false,
        Type: 'Movie',
        UserData: {
          PlaybackPositionTicks: 0,
          PlayCount: 55,
          IsFavorite: true,
          LastPlayedDate: '2021-06-26T06:47:10.5971827Z',
          Played: false,
          Key: '292133'
        },
        ChildCount: 0,
        PrimaryImageAspectRatio: 0.6666666666666666,
        VideoType: VideoType.VideoFile,
        ImageTags: {},
        BackdropImageTags: [],
        ImageBlurHashes: {},
        LocationType: LocationType.FileSystem,
        MediaType: 'Video'
      },
      {
        Name: 'The Boy in the Plastic Bubble',
        ServerId: '713dc3fe952b438fa70ed35e4ef0525a',
        Id: 'edb39341c5039551a5157e51fe4a3364',
        Container: 'mov,mp4,m4a,3gp,3g2,mj2',
        PremiereDate: '1976-11-12T00:00:00.0000000Z',
        OfficialRating: 'PG',
        Overview:
          'Tod Lubitch is born with a deficient immune system. As such, he must spend the rest of his life in a completely sterile environment. His room is completely hermetically sealed against bacteria and virus, his food is specially prepared, and his only human contact comes in the form of gloved hands. The movie follows his life into a teenager.',
        CommunityRating: 5.7,
        RunTimeTicks: 55842000896,
        ProductionYear: 1976,
        IsFolder: false,
        Type: 'Movie',
        UserData: {
          PlayedPercentage: 10.718784970022002,
          PlaybackPositionTicks: 5985583999,
          PlayCount: 35,
          IsFavorite: false,
          LastPlayedDate: '2021-05-07T02:12:23.1448688Z',
          Played: false,
          Key: '9878'
        },
        ChildCount: 0,
        PrimaryImageAspectRatio: 0.6666666666666666,
        VideoType: VideoType.VideoFile,
        ImageTags: {},
        BackdropImageTags: ['07808dd73180d102a47f8083c7375101'],
        ImageBlurHashes: {
          Backdrop: {
            '07808dd73180d102a47f8083c7375101':
              'WfHoRJ=fn4jExY$%yZxuk8NuNwNHYQSOWAt6WBW;%~WCaKxas.oK'
          }
        },
        LocationType: LocationType.FileSystem,
        MediaType: 'Video'
      },
      {
        Name: 'Jungle Book',
        ServerId: '713dc3fe952b438fa70ed35e4ef0525a',
        Id: 'e16725e2c1c4367ec596cf93c38bbe4f',
        Container: 'mov,mp4,m4a,3gp,3g2,mj2',
        PremiereDate: '1942-04-03T00:00:00.0000000Z',
        CriticRating: 57,
        OfficialRating: 'Approved',
        Overview:
          "Rudyard Kipling's Jungle Book is given the full treatment in this lavish retelling filled with huge sets, exotic animals, a large cast and the incomparable Sabu, starring as Mowgli, the young orphan boy raised by wolves. Curious to reconnect with his human village, Mowgli returns only to find disappointment in the greed and treachery of man. Over time, Mowgli and the village members do grow to trust one another, but not before the village finds itself under siege. It's up to Mowgli and his jungle friends to save the day.",
        CommunityRating: 6.7,
        RunTimeTicks: 62946979840,
        ProductionYear: 1942,
        IsFolder: false,
        Type: 'Movie',
        UserData: {
          PlayedPercentage: 16.198505608875294,
          PlaybackPositionTicks: 10196470060,
          PlayCount: 51,
          IsFavorite: true,
          LastPlayedDate: '2020-02-15T19:21:47.7745605Z',
          Played: true,
          Key: '23033'
        },
        ChildCount: 0,
        PrimaryImageAspectRatio: 0.6666666666666666,
        VideoType: VideoType.VideoFile,
        ImageTags: {},
        BackdropImageTags: ['a118064600b12716bf5b1fd3ad1d13e3'],
        ImageBlurHashes: {
          Backdrop: {
            a118064600b12716bf5b1fd3ad1d13e3:
              'WHEoGU^NM_$$0eKQ14IUNGWBRjJo9Zs8bwI;RjIA~VNFtR?Gwb-U'
          }
        },
        LocationType: LocationType.FileSystem,
        MediaType: 'Video'
      },
      {
        Name: 'Lady Frankenstein',
        ServerId: '713dc3fe952b438fa70ed35e4ef0525a',
        Id: 'd8ca1a7d9ae2a9516c638cefa8968684',
        Container: 'mov,mp4,m4a,3gp,3g2,mj2',
        PremiereDate: '1971-10-22T00:00:00.0000000Z',
        OfficialRating: 'R',
        Overview:
          "Dr. Frankensteins' daughter, who is in love with the aging lab assistant Marshall, continues with her fathers experiments and attempts to transplant Marshall's brain into a new body to prolong his life.",
        CommunityRating: 5,
        RunTimeTicks: 50206961664,
        ProductionYear: 1971,
        IsFolder: false,
        Type: 'Movie',
        UserData: {
          PlayedPercentage: 72.82700133240232,
          PlaybackPositionTicks: 36564224640,
          PlayCount: 12,
          IsFavorite: true,
          LastPlayedDate: '2020-02-15T18:14:07.5724549Z',
          Played: true,
          Key: '3122'
        },
        ChildCount: 0,
        PrimaryImageAspectRatio: 0.6666666666666666,
        VideoType: VideoType.VideoFile,
        ImageTags: {},
        BackdropImageTags: ['40c7576ce1e785ff9d33bd5a96000b8c'],
        ImageBlurHashes: {
          Backdrop: {
            '40c7576ce1e785ff9d33bd5a96000b8c':
              'W467itsm4:}s%L0}0}S5%2EMM|^PRjs:ofNHaxbI=|xDRit7xuEe'
          }
        },
        LocationType: LocationType.FileSystem,
        MediaType: 'Video'
      }
    ]);
    /* eslint-enable */

    return {
      currentIndex,
      duration,
      durationSeconds,
      items,
      t,
      display,
      onSlideChange,
      onSwiper,
      topMargin
    };
  }
});
</script>

<style lang="scss" scoped>
@import 'vuetify/lib/styles/styles.sass';

// TODO(migration): Revisit this class when migration is complete
.slide-content-container {
  height: 100% !important;
}

.swiper {
  min-width: 100%;
  min-height: 100%;
  position: relative;
  user-select: none;
}

.default-icon {
  display: flex;
  align-content: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.slide-backdrop {
  position: relative;
  width: 100%;
  margin-left: 0;
  margin-right: 0;
  top: 0;
  padding-bottom: (9 / 16) * 100%;
  background-position: center top;
  background-size: contain;
  background-repeat: no-repeat;
  box-sizing: border-box;
  mask-image: linear-gradient(
    180deg,
    rgba(37, 18, 18, 0.75) 0%,
    rgba(0, 0, 0, 0) 100%
  );
  z-index: 1;
}

.slide-content {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  box-sizing: border-box;
  z-index: 2;
}

@media #{map-get($display-breakpoints, 'sm-and-up')} {
  .swiper {
    margin-top: calc(v-bind(topMargin) * -1px);
  }

  .slide-backdrop {
    width: 80%;
    margin-left: auto;
    margin-right: 0;
    padding-bottom: (9 / 16) * 80%;
    background-position: right center;
    mask-image: linear-gradient(
        to right,
        hsla(0, 0%, 0%, 0) 0%,
        hsla(0, 0%, 0%, 0.182) 5.6%,
        hsla(0, 0%, 0%, 0.34) 9.9%,
        hsla(0, 0%, 0%, 0.476) 13.1%,
        hsla(0, 0%, 0%, 0.593) 15.7%,
        hsla(0, 0%, 0%, 0.69) 17.9%,
        hsla(0, 0%, 0%, 0.771) 20.2%,
        hsla(0, 0%, 0%, 0.836) 22.9%,
        hsla(0, 0%, 0%, 0.888) 26.3%,
        hsla(0, 0%, 0%, 0.927) 30.8%,
        hsla(0, 0%, 0%, 0.956) 36.7%,
        hsla(0, 0%, 0%, 0.976) 44.4%,
        hsla(0, 0%, 0%, 0.989) 54.3%,
        hsla(0, 0%, 0%, 0.996) 66.6%,
        hsla(0, 0%, 0%, 0.999) 81.7%,
        hsl(0, 0%, 0%) 100%
      ),
      linear-gradient(
        to top,
        hsla(0, 0%, 0%, 0) 0%,
        hsla(0, 0%, 0%, 0.182) 5.6%,
        hsla(0, 0%, 0%, 0.34) 9.9%,
        hsla(0, 0%, 0%, 0.476) 13.1%,
        hsla(0, 0%, 0%, 0.593) 15.7%,
        hsla(0, 0%, 0%, 0.69) 17.9%,
        hsla(0, 0%, 0%, 0.771) 20.2%,
        hsla(0, 0%, 0%, 0.836) 22.9%,
        hsla(0, 0%, 0%, 0.888) 26.3%,
        hsla(0, 0%, 0%, 0.927) 30.8%,
        hsla(0, 0%, 0%, 0.956) 36.7%,
        hsla(0, 0%, 0%, 0.976) 44.4%,
        hsla(0, 0%, 0%, 0.989) 54.3%,
        hsla(0, 0%, 0%, 0.996) 66.6%,
        hsla(0, 0%, 0%, 0.999) 81.7%,
        hsl(0, 0%, 0%) 100%
      );
    mask-composite: intersect;
  }

  .slide-content {
    margin-top: calc(v-bind(topMargin) * 1px);
  }
}

@media #{map-get($display-breakpoints, 'md-and-up')} {
  .swiper {
    margin-bottom: -128px !important;
  }
}
</style>

<style lang="scss">
@import 'vuetify/lib/styles/styles.sass';

.progress-bar-container {
  position: absolute;
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  width: 100%;
  z-index: 5;
  top: 0;
}

@media #{map-get($display-breakpoints, 'sm-and-up')} {
  .progress-bar-container {
    position: relative;
    top: initial;
  }
}

@media #{map-get($display-breakpoints, 'md-and-up')} {
  .progress-bar-container {
    margin-top: -120px;
  }
}

@media #{map-get($display-breakpoints, 'lg-and-up')} {
  .progress-bar-container {
    margin-top: -200px;
  }
}

@media #{map-get($display-breakpoints, 'xl')} {
  .progress-bar-container {
    margin-top: -225px;
  }
}

.progress-bar-container .swiper-pagination-bullet {
  cursor: pointer !important;
  height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-grow: 1;
  z-index: 5;

  &::after {
    content: '';
    height: 3px;
    width: 95%;
    display: block;
    top: calc(50% - 3px);
    background-image: linear-gradient(
      to right,
      rgba(255, 255, 255, 1) 0%,
      rgba(255, 255, 255, 1) 49.8%,
      rgba(240, 240, 240, 0.45) 50%,
      rgba(240, 240, 240, 0.45) 100%
    );
    background-repeat: no-repeat;
    background-size: 200%;
    background-position: 100% 50%;
    animation-timing-function: linear;
    animation-delay: 0s;
    animation-fill-mode: forwards;
    animation-duration: 7.5s;
    backdrop-filter: saturate(180%) blur(20px);
  }

  &:hover::after {
    height: 10px !important;
    transition: height 0.25s;
    border-radius: 2px;
  }
}

.progress-bar-container .swiper-pagination-bullet-active::after {
  animation-name: slide-progress;
}

.progress-bar-container .swiper-pagination-bullet-passed::after {
  background-position: 0 0;
}

@keyframes slide-progress {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: 0 0;
  }
}
</style>
