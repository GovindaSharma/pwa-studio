import React, { useCallback, useEffect, useMemo } from 'react';
import { arrayOf, bool, number, shape, string } from 'prop-types';
import { useCarousel } from '@magento/peregrine';
import { resourceUrl } from '@magento/venia-drivers';
import {
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon
} from 'react-feather';
import { mergeClasses } from '../../classify';
import Thumbnail from './thumbnail';
import defaultClasses from './carousel.css';
import { transparentPlaceholder } from '@magento/peregrine/lib/util/images';
import Icon from '../Icon';
import Image from '../Image';

const DEFAULT_IMAGE_WIDTH = 640;
const DEFAULT_IMAGE_HEIGHT = 800;

/**
 * Carousel component for product images
 * Carousel - Component that holds number of images
 * where typically one image visible, and other
 * images can be navigated through previous and next buttons
 *
 * @typedef ProductImageCarousel
 * @kind functional component
 *
 * @param {props} props
 *
 * @returns {React.Element} React carousel component that displays a product image
 */
const Carousel = props => {
    const classes = mergeClasses(defaultClasses, props.classes);

    const [carouselState, carouselApi] = useCarousel(props.images);
    const { activeItemIndex, sortedImages } = carouselState;
    const { handlePrevious, handleNext, setActiveItemIndex } = carouselApi;

    const handleThumbnailClick = useCallback(
        index => {
            setActiveItemIndex(index);
        },
        [setActiveItemIndex]
    );

    // Whenever the incoming images changes reset the active item to the first.
    useEffect(() => {
        setActiveItemIndex(0);
    }, [props.images, setActiveItemIndex]);

    const currentImage = sortedImages[activeItemIndex] || {};

    // if file value is present, form magento image file url
    const src = currentImage.file
        ? resourceUrl(currentImage.file, {
              type: 'image-product',
              width: DEFAULT_IMAGE_WIDTH,
              height: DEFAULT_IMAGE_HEIGHT
          })
        : transparentPlaceholder;

    const alt = currentImage.label || 'image-product';

    // create thumbnail image component for every images in sorted order
    const thumbnails = useMemo(
        () =>
            sortedImages.map((item, index) => (
                <Thumbnail
                    key={`${item.file}--${item.label}`}
                    item={item}
                    itemIndex={index}
                    isActive={activeItemIndex === index}
                    onClickHandler={handleThumbnailClick}
                />
            )),
        [activeItemIndex, handleThumbnailClick, sortedImages]
    );

    return (
        <div className={classes.root}>
            <div className={classes.imageContainer}>
                <button
                    className={classes.previousButton}
                    onClick={handlePrevious}
                >
                    <Icon src={ChevronLeftIcon} size={40} />
                </button>
                <Image
                    classes={{ root: classes.currentImage }}
                    src={src}
                    alt={alt}
                    placeholder={transparentPlaceholder}
                    fileSrc={currentImage.file}
                    sizes={`${DEFAULT_IMAGE_WIDTH}px`}
                />
                <button className={classes.nextButton} onClick={handleNext}>
                    <Icon src={ChevronRightIcon} size={40} />
                </button>
            </div>
            <div className={classes.thumbnailList}>{thumbnails}</div>
        </div>
    );
};

/**
 * Props for {@link ProductImageCarousel}
 *
 * @typedef props
 *
 * @property {Object} classes An object containing the class names for the
 * ProductImageCarousel component
 * @property {string} classes.currentImage classes for visible image
 * @property {string} classes.imageContainer classes for image container
 * @property {string} classes.nextButton classes for next button
 * @property {string} classes.previousButton classes for previous button
 * @property {string} classes.root classes for root container
 * @property {Object[]} images Product images input for Carousel
 * @property {string} images.label label for image
 * @property {string} image.position Position of image in Carousel
 * @property {bool} image.disabled Is image disabled
 * @property {string} image.file filePath of image
 */
Carousel.propTypes = {
    classes: shape({
        currentImage: string,
        imageContainer: string,
        nextButton: string,
        previousButton: string,
        root: string
    }),
    images: arrayOf(
        shape({
            label: string,
            position: number,
            disabled: bool,
            file: string.isRequired
        })
    ).isRequired
};

export default Carousel;
