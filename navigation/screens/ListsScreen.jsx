import * as React from 'react';
import { SafeAreaView, View, Text, Modal, FlatList, TouchableOpacity, Image, StyleSheet, StatusBar, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import SearchBar from "react-native-dynamic-search-bar";
import Ionicons from 'react-native-vector-icons/Ionicons';
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
        currentList INTEGER(1))`,
      [], (trans, result) => {
        console.log("table created successfully => " + JSON.stringify(result));
      },
      error => {
        console.log("error on creating table productsLists : " + error.message);
      });
  }
);

export default function ListsScreen({ navigation }) {

  const types = ['Fruits et légumes', 'Produits frais', 'Epicerie', 'Liquides', 'Surgelés', 'Hygiène', 'Textile', 'Droguerie', 'Autres'];
  const [filteredData, setFilteredData] = useState([]);
  const [search, setsearch] = useState('');
  var [products, setProducts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

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

  // Clear search text
  const clearFilter = () => {
    searchFilter("");
  }

  // Alert on product click => Delete item
  const addToListAlert = (name) =>
    Alert.alert(
      "ADD TO LIST",
      "Add this ? " + name,
      [
        {
          text: "No",
          onPress: () => console.log("No, I don't want " + name),
          style: "cancel"
        },
        {
          text: "Yes",
          onPress: () => console.log(name + " successfully added to your list !")
        }
      ],
      {
        cancelable: true,
      }
    );

  const setImage = (type) => {
    var imgPath = "";

    if (type == types[0]) { imgPath = require('../../img/products/fruits.png'); }
    else if (type == types[1]) { imgPath = require('../../img/products/fresh.png'); }
    else if (type == types[2]) { imgPath = require('../../img/products/spices.png'); }
    else if (type == types[3]) { imgPath = require('../../img/products/liquid.png'); }
    else if (type == types[4]) { imgPath = require('../../img/products/frozen.png'); }
    else if (type == types[5]) { imgPath = require('../../img/products/hygiene.png'); }
    else if (type == types[6]) { imgPath = require('../../img/products/textile.png'); }
    else if (type == types[7]) { imgPath = require('../../img/products/hardware.png'); }
    else { imgPath = require('../../img/products/other.png'); }

    return imgPath;
  }

  const Item = ({ name, type }) => (
    <TouchableOpacity onPress={() => addToListAlert(name)} style={styles.item}>
      <Image style={styles.productImg} source={setImage(type)} />
      <Text style={styles.title} activeOpacity={0.8}>{name}</Text>
      <Ionicons style={styles.checkIcon} name="checkmark-circle-outline" size={40} />
    </TouchableOpacity >
  );

  const renderItem = ({ item }) => (
    <Item style={styles.title} name={item.name} type={item.type} itemId={item.id} />
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
    checkIcon: {
      position: "absolute",
      right: 10,
      color: "#696969"
    },
    searchbar: {
      width: '100%',
      height: 50,
      marginBottom: 20,
      paddingVertical: 10
    },
    buttonContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#1E90FF',
      width: 70,
      height: 70,
      position: 'absolute',
      bottom: 0,
      right: 0,
      marginBottom: 20,
      borderRadius: 35
    },
    button: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      height: 70
    },
    ionicon: {
      color: '#fff',
      fontSize: 40
    },
    modalView: {
      marginHorizontal: 20,
      marginVertical: 50,
      backgroundColor: "white",
      borderRadius: 10,
      padding: 35,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5
    },
    modalText: {
      fontSize: 25,
      fontWeight: 'bold',
      marginBottom: 15,
      textAlign: "center"
    },
    modalButtonContainer: {
      marginVertical: 40,
      width: '100%',
      flex: 1,
      flexDirection: 'row',
      alignItems: "center",
      justifyContent: 'space-around'
    },
    closeModalButton: {
      alignItems: 'center',
      width: 100,
      height: 50,
      borderRadius: 5,
      padding: 15,
      backgroundColor: '#1E90FF'
    },
    textStyle: {
      color: '#fff',
      fontSize: 16
    },
    input: {
      width: '100%',
      height: 50,
      fontSize: 14,
      margin: 12,
      borderWidth: 1,
      padding: 10
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
        onClearPress={() => clearFilter()}
      ></SearchBar>
      <FlatList
        data={products}
        renderItem={renderItem}
        keyExtractor={item => item.id}
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} activeOpacity={0.8} >
          <Ionicons style={styles.ionicon} name='add-outline' onPress={() => setModalVisible(true)} />
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>

            <Text style={styles.modalText}>Current list</Text>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={() => setModalVisible(!modalVisible)}
              >
                <Text style={styles.textStyle}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}