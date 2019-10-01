import { useCallback, useState } from 'react';
import { useCartContext } from '@magento/peregrine/lib/context/cart';

// TODO: Move these over after #1807 is merged
import appendOptionsToPayload from '@magento/venia-ui/lib/util/appendOptionsToPayload';
import findMatchingVariant from '@magento/venia-ui/lib/util/findMatchingProductVariant';
import isProductConfigurable from '@magento/venia-ui/lib/util/isProductConfigurable';

const INITIAL_OPTION_CODES = new Map();
const INITIAL_OPTION_SELECTIONS = new Map();
const INITIAL_QUANTITY = 1;

const deriveOptionCodesFromProduct = product => {
    // If this is a simple product it has no option codes.
    if (!isProductConfigurable(product)) {
        return INITIAL_OPTION_CODES;
    }

    // Initialize optionCodes based on the options of the product.
    const initialOptionCodes = new Map();
    for (const {
        attribute_id,
        attribute_code
    } of product.configurable_options) {
        initialOptionCodes.set(attribute_id, attribute_code);
    }

    return initialOptionCodes;
};

const getIsMissingOptions = (product, optionSelections) => {
    // Non-configurable products can't be missing options.
    if (!isProductConfigurable(product)) {
        return false;
    }

    // Configurable products are missing options if we have fewer
    // option selections than the product has options.
    const { configurable_options } = product;
    const numProductOptions = configurable_options.length;
    const numProductSelections = optionSelections.size;

    return numProductSelections < numProductOptions;
};

const getMediaGalleryEntries = (product, optionCodes, optionSelections) => {
    let value = [];

    const { media_gallery_entries, variants } = product;
    const isConfigurable = isProductConfigurable(product);
    const optionsSelected = optionSelections.size > 0;

    if (!isConfigurable || !optionsSelected) {
        value = media_gallery_entries;
    } else {
        const item = findMatchingVariant({
            optionCodes,
            optionSelections,
            variants
        });

        value = item
            ? [...item.product.media_gallery_entries, ...media_gallery_entries]
            : media_gallery_entries;
    }

    return value;
};

export const useProductFullDetail = props => {
    const { product } = props;

    const [{ isAddingItem }, { addItemToCart }] = useCartContext();

    const [quantity, setQuantity] = useState(INITIAL_QUANTITY);
    const [optionSelections, setOptionSelections] = useState(
        INITIAL_OPTION_SELECTIONS
    );
    const derivedOptionCodes = deriveOptionCodesFromProduct(product);
    const [optionCodes] = useState(derivedOptionCodes);

    const isMissingOptions = getIsMissingOptions(product, optionSelections);
    const mediaGalleryEntries = getMediaGalleryEntries(
        product,
        optionCodes,
        optionSelections
    );

    const handleAddToCart = useCallback(() => {
        const payload = {
            item: product,
            productType: product.__typename,
            quantity
        };

        if (isProductConfigurable(product)) {
            appendOptionsToPayload(payload, optionSelections, optionCodes);
        }

        addItemToCart(payload);
    }, [addItemToCart, optionCodes, optionSelections, product, quantity]);

    const handleSelectionChange = useCallback(
        (optionId, selection) => {
            // We must create a new Map here so that React knows that the value
            // of optionSelections has changed.
            const newOptionSelections = new Map([...optionSelections]);
            newOptionSelections.set(optionId, Array.from(selection).pop());
            setOptionSelections(newOptionSelections);
        },
        [optionSelections]
    );

    const handleSetQuantity = useCallback(
        value => {
            setQuantity(value);
        },
        [setQuantity]
    );

    // Normalization object for product details we need for rendering.
    const productDetails = {
        description: product.description,
        name: product.name,
        price: product.price.regularPrice.amount,
        sku: product.sku
    };

    return {
        handleAddToCart,
        handleSelectionChange,
        handleSetQuantity,
        isAddToCartDisabled: isAddingItem || isMissingOptions,
        mediaGalleryEntries,
        productDetails,
        quantity
    };
};