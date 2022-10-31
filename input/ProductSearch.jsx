import React from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import { SearchBar } from "@rneui/themed";

const ProductTextInput = () => {

    const [search, setSearch] = React.useState("");

    const updateSearch = (search) => {
        setSearch(search);
    };
      
    return (
        <SafeAreaView style={styles.container}>
            <SearchBar
            placeholder="Search procduct - ex : Banane"
            onChangeText={updateSearch}
            value={search}
            lightTheme={true}>
            </SearchBar>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        width: "100%"
    }
});

export default ProductTextInput;