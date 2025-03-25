import {render, screen} from '@testing-library/react';
import '@testing-library/jest-dom';
import renderNextImage from '@/components/NextImage';
import {RenderImageContext, RenderImageProps} from 'react-photo-album';

// Mock the next/image component
jest.mock('next/image', () => ({
    __esModule: true,
    default: (props: any) => {
        // eslint-disable-next-line @next/next/no-img-element
        return <img {...props} alt={props.alt || ''}/>;
    },
}));

describe('renderNextImage', () => {
    // Test case: Component renders correctly with valid props
    it('renders correctly with valid props', () => {
        // Arrange
        const props: RenderImageProps = {
            alt: 'Test image',
            title: 'Test title',
            sizes: '(max-width: 768px) 100vw, 50vw',
            src: 'test-image.jpg',
        };

        const context: RenderImageContext = {
            photo: {
                src: 'test-image.jpg',
                srcSet: [{
                    src: 'test-image-small.jpg',
                    width: 100,
                    height: 100
                }],
                width: 800,
                height: 600,
            },
            index: 0,
            width: 800,
            height: 600,
        };

        // Act
        render(renderNextImage(props, context));

        // Assert
        const image = screen.getByAltText('Test image');
        expect(image).toBeInTheDocument();
        expect(image).toHaveAttribute('title', props.title);
        expect(image).toHaveAttribute('sizes', props.sizes);
        expect(image).toHaveAttribute('src', props.src);
    });

    // Test case: Component doesn't render Image when photo.srcSet is missing
    it('does not render Image when photo.srcSet is missing', () => {
        // Arrange
        const props: RenderImageProps = {
            alt: 'Test image',
            title: 'Test title',
            sizes: '(max-width: 768px) 100vw, 50vw',
            src: 'test-image.jpg',
        };

        const context: RenderImageContext = {
            photo: {
                src: 'test-image.jpg',
                width: 800,
                height: 600,
            },
            index: 0,
            width: 800,
            height: 600,
        };

        // Act
        const {container} = render(renderNextImage(props, context));

        // Assert
        expect(container.querySelector('img')).not.toBeInTheDocument();
        // The div should still be rendered
        expect(container.firstChild).toBeInTheDocument();
        expect(container.firstChild).toHaveStyle({
            width: '100%',
            position: 'relative',
        });
    });

    // Test case: Component renders with default alt text when not provided
    it('renders with default alt text when not provided', () => {
        // Arrange
        const props: RenderImageProps = {
            title: 'Test title',
            sizes: '(max-width: 768px) 100vw, 50vw',
            src: 'test-image.jpg',
        };

        const context: RenderImageContext = {
            photo: {
                src: 'test-image.jpg',
                srcSet: [{
                    src: 'test-image-small.jpg',
                    width: 100,
                    height: 100
                }],
                width: 800,
                height: 600,
            },
            index: 0,
            width: 800,
            height: 600,
        };

        // Act
        render(renderNextImage(props, context));

        // Assert
        const image = screen.getByAltText('');
        expect(image).toBeInTheDocument();
    });

    // Test case: Component uses correct blur data URL
    it('uses correct blur data URL', () => {
        // Arrange
        const props: RenderImageProps = {
            alt: 'Test image',
            title: 'Test title',
            sizes: '(max-width: 768px) 100vw, 50vw',
            src: 'test-image.jpg',
        };

        const context: RenderImageContext = {
            photo: {
                src: 'test-image.jpg',
                srcSet: [{
                    src: 'test-image-small.jpg',
                    width: 100,
                    height: 100
                }],
                width: 800,
                height: 600,
            },
            index: 0,
            width: 800,
            height: 600,
        };

        // Act
        render(renderNextImage(props, context));

        // Assert
        const image = screen.getByAltText('Test image');
        expect(image).toHaveAttribute('placeholder', 'blur');
        expect(image).toHaveAttribute('src', props.src);
        expect(image).toHaveAttribute('blurDataURL', 'test-image-small.jpg');
    });
});