import React from "react";
import { StyleSheet, Text, Image, TouchableOpacity, Alert, SafeAreaView, SectionList, StatusBar} from "react-native";

const DATA = [
  {
    title: "Fruits & Légumes",
    data: ["Bananes", "Tomates", "Pommes de terre"]
  },
  {
    title: "Viandes",
    data: ["Steack haché", "Jambon", "Poulet"]
  },
  {
    title: "Boissons",
    data: ["Perrier", "Bières", "Café", "Thé"]
  },
  {
    title: "Produits Frais",
    data: ["Beurre", "Mozarella", "Fromage rapé", "Yaourts"]
  },
  {
    title: "Epicerie",
    data: ["Chocolat", "Nouilles chinoises"]
  }
];


const cartAlert = () =>
Alert.alert(
    "What to do ?",
    "Add this item to cart or delete it",
    [
        {
            text: "Add to cart",
            onPress: () => console.log("Successfully added to cart")
        },
        { 
            text: "Delete this", 
            onPress: () => console.log("Item deleted"), 
            style: "cancel" 
        }
    ],
    {
        cancelable: true,
    }
);

const Item = ({ title }) => (
  <TouchableOpacity onPress={cartAlert} style={styles.item}>
    <Image style={styles.productImg} source={require('../img/products/banane.jpg')} />
    <Text style={styles.title} activeOpacity={0.8}>{title}</Text>
  </TouchableOpacity >
);

const HomeList = () => (
  <SafeAreaView style={styles.container}>
    <SectionList
      sections={DATA}
      keyExtractor={(item, index) => item + index}
      renderItem={({ item }) => <Item title={item} />}
      renderSectionHeader={({ section: { title } }) => (
        <Text style={styles.header}>{title}</Text>
      )}
    />
  </SafeAreaView>
);

const styles = StyleSheet.create({
  container: {
    width: '90%',
    flex: 1,
    paddingTop: StatusBar.currentHeight,
    marginHorizontal: 16
  },
  containerButton: {
    maxWidth: 100,
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between"
  },
  item: {
    flex: 1,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    Height: 50,
    fontSize: 16,
    backgroundColor: "#fff",
    padding: 10,
    marginVertical: 5,
    borderRadius: 5
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1E90FF"
  },
  title: {
    width: "100%",
    color: "#696969",
    fontSize: 20
  },
  productImg: {
    maxWidth: 40,
    maxHeight: 40,
    marginLeft: 10,
    marginRight: 15,
    borderRadius: 20
  }
});

export default HomeList;