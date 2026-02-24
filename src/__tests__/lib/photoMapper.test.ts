import mapPhotosToGalleryImages from '@/lib/photoMapper';
import { Photo } from '@/types/photos';

describe('mapPhotosToGalleryImages', () => {
  it('should return undefined arrays for null input', () => {
    const result = mapPhotosToGalleryImages(null);
    expect(result.galleryPhotos).toBeUndefined();
    expect(result.lightboxPhotos).toBeUndefined();
  });

  it('should map photos correctly to gallery and lightbox images', () => {
    const mockPhotos: Photo[] = [
      {
        id: 1,
        title: 'Photo 1',
        description: 'Description 1',
        width: 100,
        height: 100,
        srcSet: [
          { src: 'img1.jpg', width: 100, height: 100, title: 'Photo 1', description: 'Description 1' },
          { src: 'img1-small.jpg', width: 50, height: 50, title: 'Photo 1', description: 'Description 1' },
        ],
        tags: 'tag1',
        views: 10,
        dateTaken: new Date('2023-01-01'),
        dateUpload: new Date('2023-01-01'),
      },
      {
        id: 2,
        title: 'Photo 2',
        description: 'Description 2',
        width: 200,
        height: 200,
        srcSet: [
          { src: 'img2.jpg', width: 200, height: 200, title: 'Photo 2', description: 'Description 2' },
        ],
        tags: 'tag2',
        views: 20,
        dateTaken: new Date('2023-01-02'),
        dateUpload: new Date('2023-01-02'),
      },
    ];

    const result = mapPhotosToGalleryImages(mockPhotos);

    expect(result.galleryPhotos).toHaveLength(2);
    expect(result.lightboxPhotos).toHaveLength(2);

    // Verify Gallery Photos (minimal properties)
    expect(result.galleryPhotos![0]).toEqual(expect.objectContaining({
      src: 'img1.jpg',
      width: 100,
      height: 100,
      alt: 'Photo 1',
      // SrcSet check
      srcSet: expect.any(Array),
    }));

    // Verify Lightbox Photos (extended properties)
    expect(result.lightboxPhotos![0]).toEqual(expect.objectContaining({
      src: 'img1.jpg',
      width: 100,
      height: 100,
      alt: 'Photo 1',
      title: 'Photo 1',
      description: 'Description 1',
      srcSet: expect.any(Array),
    }));

     expect(result.lightboxPhotos![1]).toEqual(expect.objectContaining({
      src: 'img2.jpg',
      title: 'Photo 2',
      description: 'Description 2',
    }));
  });

  it('should use default dimensions if width/height are missing', () => {
     const mockPhotos: Photo[] = [
      {
        id: 3,
        title: 'Photo 3',
        description: '',
        // Invalid/missing
        width: 0,
        // Invalid/missing
        height: 0,
        srcSet: [{ src: 'img3.jpg', width: 0, height: 0, title: '', description: '' }],
        tags: '',
        views: 0,
        dateTaken: new Date(),
        dateUpload: new Date(),
      },
    ];

    const result = mapPhotosToGalleryImages(mockPhotos);

    // Default values from photoMapper.ts
    const DEFAULT_WIDTH = 1200;
    const DEFAULT_HEIGHT = 800;

    expect(result.galleryPhotos![0].width).toBe(DEFAULT_WIDTH);
    expect(result.galleryPhotos![0].height).toBe(DEFAULT_HEIGHT);
  });
});
