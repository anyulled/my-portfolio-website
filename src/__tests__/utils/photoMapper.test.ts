import { mapPhotosToGalleryImages } from '@/lib/photoMapper';
import { Photo } from '@/services/flickr/flickr.types';

const mockPhotos: Photo[] = [
  {
    id: 1,
    description: 'desc',
    dateTaken: new Date(),
    dateUpload: new Date(),
    height: '200',
    title: 'Title',
    urlCrop: 'crop.jpg',
    urlLarge: 'large.jpg',
    urlMedium: 'medium.jpg',
    urlNormal: 'normal.jpg',
    urlOriginal: 'original.jpg',
    urlThumbnail: 'thumb.jpg',
    urlSmall: 'small.jpg',
    urlZoom: 'zoom.jpg',
    views: 10,
    width: '300',
    tags: 'tag1',
    srcSet: [
      { src: 'small.jpg', width: 300, height: 200, title: 'Title', description: 'desc' },
    ],
  },
];

describe('mapPhotosToGalleryImages', () => {
  it('maps photos to gallery and lightbox images', () => {
    const { galleryPhotos, lightboxPhotos } = mapPhotosToGalleryImages(mockPhotos);

    expect(galleryPhotos).toHaveLength(1);
    expect(lightboxPhotos).toHaveLength(1);

    expect(galleryPhotos![0].src).toBe('small.jpg');
    expect(lightboxPhotos![0].src).toBe('original.jpg');
  });

  it('handles null input', () => {
    const { galleryPhotos, lightboxPhotos } = mapPhotosToGalleryImages(null);
    expect(galleryPhotos).toBeUndefined();
    expect(lightboxPhotos).toBeUndefined();
  });
});
