import { mapPhotosToGalleryImages } from '@/lib/photoMapper';
import { Photo } from '@/types/photos';

describe('mapPhotosToGalleryImages', () => {
  it('should return undefined arrays when photos input is null', () => {
    const result = mapPhotosToGalleryImages(null);
    expect(result).toEqual({ galleryPhotos: undefined, lightboxPhotos: undefined });
  });

  it('should return empty arrays when photos input is empty array', () => {
    const result = mapPhotosToGalleryImages([]);
    expect(result).toEqual({ galleryPhotos: [], lightboxPhotos: [] });
  });

  it('should correctly map a single photo', () => {
    const mockPhoto: Photo = {
      id: 1,
      title: 'Test Photo',
      description: 'Test Description',
      width: 1000,
      height: 800,
      srcSet: [{ src: 'test.jpg', width: 1000, height: 800, title: 'Test Photo', description: 'Test Description' }],
      dateTaken: new Date(),
      dateUpload: new Date(),
      views: 0,
      tags: '',
    };

    const result = mapPhotosToGalleryImages([mockPhoto]);

    expect(result.galleryPhotos).toHaveLength(1);
    expect(result.lightboxPhotos).toHaveLength(1);

    expect(result.galleryPhotos![0]).toEqual({
      src: 'test.jpg',
      srcSet: mockPhoto.srcSet,
      alt: 'Test Photo',
      width: 1000,
      height: 800,
    });

    expect(result.lightboxPhotos![0]).toEqual({
      src: 'test.jpg',
      srcSet: mockPhoto.srcSet,
      alt: 'Test Photo',
      width: 1000,
      height: 800,
      title: 'Test Photo',
      description: 'Test Description',
    });
  });

  it('should handle missing width/height by using defaults', () => {
    const mockPhoto: Photo = {
      id: 2,
      title: 'Test Photo 2',
      description: '',
      width: 0, // treating 0 as falsy/missing effectively for the test logic based on implementation
      height: 0,
      srcSet: [{ src: 'test2.jpg', width: 0, height: 0, title: '', description: '' }],
      dateTaken: new Date(),
      dateUpload: new Date(),
      views: 0,
      tags: '',
    };

    const result = mapPhotosToGalleryImages([mockPhoto]);

    // Defaults from implementation: DEFAULT_WIDTH = 1200, DEFAULT_HEIGHT = 800
    expect(result.galleryPhotos![0].width).toBe(1200);
    expect(result.galleryPhotos![0].height).toBe(800);
  });

  it('should handle multiple photos', () => {
    const photos: Photo[] = Array.from({ length: 5 }, (_, i) => ({
      id: i,
      title: `Photo ${i}`,
      description: `Description ${i}`,
      width: 100 + i,
      height: 100 + i,
      srcSet: [{ src: `img${i}.jpg`, width: 100 + i, height: 100 + i, title: `Photo ${i}`, description: `Description ${i}` }],
      dateTaken: new Date(),
      dateUpload: new Date(),
      views: 0,
      tags: '',
    }));

    const result = mapPhotosToGalleryImages(photos);

    expect(result.galleryPhotos).toHaveLength(5);
    expect(result.lightboxPhotos).toHaveLength(5);
    expect(result.galleryPhotos![4].src).toBe('img4.jpg');
    expect(result.lightboxPhotos![4].description).toBe('Description 4');
  });
});
