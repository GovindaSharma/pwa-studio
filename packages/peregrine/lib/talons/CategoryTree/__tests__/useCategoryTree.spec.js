import React from 'react';
import { act } from 'react-test-renderer';
import { queryApi, queryState, useQuery } from '../../../hooks/useQuery';
import createTestInstance from '../../../util/createTestInstance';

import { useCategoryTree } from '../useCategoryTree';

jest.mock('../../../hooks/useQuery', () => {
    const queryState = {
        data: null,
        error: null,
        loading: false
    };
    const queryApi = {
        resetState: jest.fn(),
        runQuery: jest.fn(),
        setLoading: jest.fn()
    };
    const useQuery = jest.fn(() => [queryState, queryApi]);

    return { queryState, queryApi, useQuery };
});

const props = {
    categories: {},
    categoryId: 1,
    query: {},
    updateCategories: jest.fn()
};

const categories = {
    1: {
        children: [2, 4],
        children_count: 2,
        id: 1,
        name: 'One',
        path: '1'
    },
    2: {
        id: 2,
        include_in_menu: 1,
        name: 'Two',
        parentId: 1,
        path: '1/2',
        productImagePreview: {
            items: [{ small_image: 'media/img-2.jpg' }]
        }
    },
    3: {
        id: 3,
        include_in_menu: 1,
        name: 'Three',
        parentId: 2,
        path: '1/2/3',
        productImagePreview: {
            items: [{ small_image: 'media/img-3.jpg' }]
        }
    },
    4: {
        id: 4,
        include_in_menu: 1,
        name: 'Four',
        parentId: 1,
        path: '1/4',
        productImagePreview: {
            items: [{ small_image: 'media/img-4.jpg' }]
        }
    }
};

const log = jest.fn();

const Component = props => {
    const talonProps = useCategoryTree(props);
    log(talonProps);

    return <i />;
};

test('calls runQuery on mount', () => {
    const { runQuery } = queryApi;
    createTestInstance(<Component {...props} />);

    act(() => {});

    expect(runQuery).toHaveBeenCalledTimes(1);
    expect(runQuery).toHaveBeenNthCalledWith(1, {
        variables: {
            id: props.categoryId
        }
    });
});

test('calls runQuery when categoryId changes', () => {
    const { runQuery } = queryApi;
    const instance = createTestInstance(<Component {...props} />);

    act(() => {
        instance.update(<Component {...props} categoryId={2} />);
    });

    expect(runQuery).toHaveBeenCalledTimes(2);
    expect(runQuery).toHaveBeenNthCalledWith(2, {
        variables: {
            id: 2
        }
    });
});

test('avoids calling runQuery without a category id', () => {
    const { runQuery } = queryApi;
    createTestInstance(<Component {...props} categoryId={null} />);

    act(() => {});

    expect(runQuery).not.toHaveBeenCalled();
});

test('avoids calling updateCategories without data', () => {
    const { updateCategories } = props;
    createTestInstance(<Component {...props} />);

    act(() => {});

    expect(updateCategories).not.toHaveBeenCalled();
});

test('calls updateCategories when data changes', () => {
    const { updateCategories } = props;
    const category = categories[1];
    const data = {
        category: {
            ...category,
            children: Array.from(category.children, id => categories[id])
        }
    };

    const nextQueryState = { ...queryState, data };

    useQuery.mockImplementationOnce(() => [nextQueryState, queryApi]);

    createTestInstance(<Component {...props} />);

    act(() => {});

    expect(updateCategories).toHaveBeenCalledTimes(1);
    expect(updateCategories).toHaveBeenNthCalledWith(1, data.category);
});

test('returns a map of child categories', () => {
    createTestInstance(<Component {...props} categories={categories} />);

    expect(log).toHaveBeenNthCalledWith(1, {
        childCategories: expect.any(Map)
    });
});
