import * as React from 'react';
import { View } from 'react-native';
import HomeList from '../../list/HomeList';

export default function HomeScreen() {
    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <HomeList />
        </View>
    );
}