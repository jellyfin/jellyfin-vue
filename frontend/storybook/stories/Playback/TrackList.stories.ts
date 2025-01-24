import type { Meta, StoryObj } from '@storybook/vue3';
import type { BaseItemKind } from '@jellyfin/sdk/lib/generated-client';
import TrackList from '#/components/Playback/TrackList.vue';

// Mock data
const mockAlbum = {
  Id: '123',
  Name: 'Test Album',
  Type: 'MusicAlbum' as BaseItemKind
};

const mockTracks = [
  {
    Id: '1',
    Name: 'Track 1',
    IndexNumber: 1,
    ParentIndexNumber: 1,
    RunTimeTicks: 2_000_000_000,
    Type: 'Audio',
    Artists: ['Artist 1'],
    AlbumArtist: 'Artist 1',
    ArtistItems: [{ Id: 'artist1', Name: 'Artist 1' }]
  },
  {
    Id: '2',
    Name: 'Track 2',
    IndexNumber: 2,
    ParentIndexNumber: 1,
    RunTimeTicks: 3_000_000_000,
    Type: 'Audio',
    Artists: ['Artist 2'],
    AlbumArtist: 'Artist 1',
    ArtistItems: [{ Id: 'artist2', Name: 'Artist 2' }]
  }
];

const meta: Meta<typeof TrackList> = {
  title: 'Components/Playback/TrackList',
  component: TrackList,
  tags: ['autodocs'],
  args: {
    item: mockAlbum,
    tracks: mockTracks
  }
};

export default meta;

type Story = StoryObj<typeof TrackList>;

export const Default: Story = {
  args: {
    item: mockAlbum,
    tracks: mockTracks
  }
};

export const MultipleDiscs: Story = {
  args: {
    item: mockAlbum,
    tracks: [
      ...mockTracks,
      {
        Id: '3',
        Name: 'Track 1 Disc 2',
        IndexNumber: 1,
        ParentIndexNumber: 2,
        RunTimeTicks: 2_000_000_000,
        Type: 'Audio',
        Artists: ['Artist 1'],
        AlbumArtist: 'Artist 1',
        ArtistItems: [{ Id: 'artist1', Name: 'Artist 1' }]
      }
    ]
  }
};
