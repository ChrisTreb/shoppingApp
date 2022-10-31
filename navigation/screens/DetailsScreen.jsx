import * as React from 'react';
import { View } from 'react-native';
import ProductSearch from '../../input/ProductSearch';
import HomeList from '../../list/HomeList';

export default function DetailsScreen({navigation}) {
    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ProductSearch />
            <HomeList />
        </View>
    );
}