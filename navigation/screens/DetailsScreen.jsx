import * as React from 'react';
import { SafeAreaView, Text, FlatList, TouchableOpacity, Image, StyleSheet, StatusBar, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import SearchBar from "react-native-dynamic-search-bar";
import database from '../../database/functions/DatabaseConnect';

const db = database;

// DEV - Drop table
db.transaction(
  tx => {
    tx.executeSql(`DROP TABLE IF EXISTS productsLists`, [], (trans, result) => {
      console.log("table dropped successfully => " + JSON.stringify(result));
    },
      error => {
        console.log("error on dropping table productsList : " + error.message);
      });
  }
);

// DEV - Create table for lists storage
db.transaction(
  tx => {
    tx.executeSql(`CREATE TABLE IF NOT EXISTS productsLists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        createdAt TIMESTAMP,
        products VARCHAR(255),
        currentList INTEGER)`,
      [], (trans, result) => {
        console.log("table created successfully => " + JSON.stringify(result));
      },
      error => {
        console.log("error on creating table productsLists : " + error.message);
      });
  }
);

export default function DetailsScreen({navigation}) {

  const [filteredData, setFilteredData] = useState([]);
  const [search, setsearch] = useState('');
  var [products, setProducts] = useState([]);

  useEffect(() => {
    // Reload list each time we load the page
    const unsubscribe = navigation.addListener('focus', () => {
      getData();
    });
    return unsubscribe;
  }, [navigation]);

  // SELECT from products table
  const getData = () => {
    db.transaction(
      tx => {
        tx.executeSql(`SELECT * FROM 'products' ORDER BY type DESC`, [], (trans, result) => {
          var len = result.rows.length;
          products = result.rows._array;

          if (len > 0) {
            console.log('Data = ' + JSON.stringify(result.rows._array));
            setProducts(products);
            setFilteredData(products);
          } else {
            console.log('Database empty...');
            setProducts(products);
            setFilteredData(products);
          }
        });
      }
    );
  }

  // Search text
  const searchFilter = (text) => {
    if (text != "" || text != undefined) {
      const newData = filteredData.filter((item) => {
        const itemData = item.name.toUpperCase() ? item.name.toUpperCase() : ''.toUpperCase();
        const textData = text.toUpperCase();
        return itemData.indexOf(textData) > -1;
      });
      setProducts(newData);
      setsearch(text);
    } else {
      setProducts(products);
      setsearch(text);
    }
  }

  // Alert on product click => Delete item
  const addToListAlert = (name) =>
    Alert.alert(
      "ADD TO LIST",
      "Add this ? " + name,
      [
        {
          text: "No",
          onPress: () => console.log("No, I don't want " + name)
        },
        {
          text: "Yes",
          onPress: () => console.log(name + " successfully added to your list !"),
          style: "cancel"
        }
      ],
      {
        cancelable: true,
      }
    );

  const Item = ({ name }) => (
    <TouchableOpacity onPress={() => addToListAlert(name)} style={styles.item}>
      <Image style={styles.productImg} source={require('../../img/products/food.png')} />
      <Text style={styles.title} activeOpacity={0.8}>{name}</Text>
    </TouchableOpacity >
  );

  const renderItem = ({ item }) => (
    <Item style={styles.title} name={item.name} itemId={item.id} />
  );

  const styles = StyleSheet.create({
    container: {
      width: '90%',
      flex: 1,
      paddingTop: StatusBar.currentHeight,
      marginHorizontal: 16
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
    },
    searchbar: {
      width: '100%',
      height: 50,
      marginBottom: 20,
      paddingVertical: 10
    }
  });

  return (
    <SafeAreaView style={styles.container}>
      <SearchBar 
        style={styles.searchbar}
        placeholder="Search product"
        fontSize={18}
        value={search}
        onChangeText={(text) => searchFilter(text)}
      ></SearchBar>
      <FlatList
        data={products}
        renderItem={renderItem}
        keyExtractor={item => item.id}
      />
    </SafeAreaView>
  );
}