import * as React from 'react';
import { SafeAreaView, View, Text, TextInput, Modal, FlatList, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import SearchBar from "react-native-dynamic-search-bar";
import Ionicons from 'react-native-vector-icons/Ionicons';
import database from '../../database/functions/DatabaseConnect';

const db = database;

export default function ListsScreen({ navigation }) {

  const types = ['Fruits et légumes', 'Produits frais', 'Epicerie', 'Liquides', 'Surgelés', 'Hygiène', 'Textile', 'Droguerie', 'Autres'];
  const [filteredData, setFilteredData] = useState([]);
  const [search, setsearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [nameForm, onChangeName] = React.useState("");
  var [products, setProducts] = useState([]);
  var [listProducts, setListProducts] = useState("");
  var [lists, setLists] = useState([]);

  useEffect(() => {
    // Reload list each time we load the page
    const unsubscribe = navigation.addListener('focus', () => {
      [getData(), getListsData()]
    });
    return unsubscribe;
  }, [navigation]);

  // SELECT from products table
  const getData = () => {

    // Create table products if not exists
    db.transaction(
      tx => {
        tx.executeSql(`CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(50) NOT NULL,
      type VARCHAR(50) NOT NULL,
      inCurrentList INTEGER(1) DEFAULT 0,
      lastOrder TIMESTAMP,
      numOrdered INTEGER DEFAULT 0)`,
          [], (trans, result) => {
            console.log("table created products successfully !");
          },
          error => {
            console.log("error on creating table products : " + error.message);
          });
      }
    );

    db.transaction(
      tx => {
        tx.executeSql(`SELECT * FROM products ORDER BY type ASC`, [], (trans, result) => {
          var len = result.rows.length;
          products = result.rows._array;

          if (len > 0) {
            console.log('Data = ' + JSON.stringify(result.rows._array));
            setProducts(products);
            setFilteredData(products);
          } else {
            console.log('Database empty...');
            setProducts([]);
            setFilteredData([]);
          }
        });
      }
    );
  }

  // SELECT from productsLists table
  const getListsData = () => {

    // Create table productsLists for lists storage if not exists
    db.transaction(
      tx => {
        tx.executeSql(`CREATE TABLE IF NOT EXISTS productsLists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        listName VARCHAR(50),
        createdAt TIMESTAMP,
        products VARCHAR(255),
        currentList INTEGER(1) DEFAULT 0)`,
          [], (trans, result) => {
            console.log("table created successfully => " + JSON.stringify(result));
          },
          error => {
            console.log("error on creating table productsLists : " + error.message);
          });
      }
    );

    db.transaction(
      tx => {
        tx.executeSql(`SELECT * FROM productsLists ORDER BY id ASC`, [], (trans, result) => {
          var len = result.rows.length;
          lists = result.rows._array;

          if (len > 0) {
            console.log('DataLists = ' + JSON.stringify(result.rows._array));
            setLists(lists);
          } else {
            console.log('Database empty...');
            setLists([]);
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
  const addToListAlert = (item) =>
    Alert.alert(
      "ADD TO LIST",
      "Add this ? " + item.name,
      [
        {
          text: "No",
          onPress: () => console.log("No, I don't want " + item.name),
          style: "cancel"
        },
        {
          text: "Yes",
          onPress: () => insertIntoList(item)
        }
      ],
      {
        cancelable: true,
      }
    );

  // Insert list in table productsLists
  const insertList = (name) => {
    setModalVisible(false);
    setListProducts(""); // Set empty list on create new

    if (name != undefined && name != "" && name.length <= 24) {
      console.log("Inserting new list in db ! " + name);

      // Update currentList column before creating new list
      db.transaction(
        tx => {
          tx.executeSql(`UPDATE productsLists SET currentList = 0 WHERE EXISTS (SELECT currentList FROM productsLists WHERE currentList = 1)`,
            [], (trans, result) => {
              console.log("Lists updated in DB !");
              getListsData();
            },
            error => {
              console.log("error updating productsList for currentList : " + error.message);
            });
        }
      );

      // Update all products inCurrentList before creating new list
      db.transaction(
        tx => {
          tx.executeSql(`UPDATE products SET inCurrentList = 0 WHERE inCurrentList = 1`,
            [], (trans, result) => {
              console.log("Products updated in DB set inCurrentList = 0 !");
              getListsData();
            },
            error => {
              console.log("error updating products : " + error.message);
            });
        }
      );

      // Insert new list and set currentList
      db.transaction(
        tx => {
          tx.executeSql(`INSERT INTO productsLists (listName, createdAt, currentList) VALUES (?, ?, ?)`,
            [name.trim(), new Date().toISOString().slice(0, 10), 1], (trans, result) => {
              console.log("List inserted in DB !");
              getListsData();
            },
            error => {
              console.log("error inserting productsList into table productsLists : " + error.message);
            });
        }
      );

      // Reset form after submit
      onChangeName("");
    } else {
      // If required inputs are not filled => Display alert
      Alert.alert(
        "MISSING INFO",
        "List name is required ! Be sure to fill this data.\nName length is limited to 24 characters",
        [
          {
            text: "OK, sorry...",
            onPress: () => console.log("Sorry pressed...")
          }
        ],
        {
          cancelable: false,
        }
      );
    }
  }

  // Insert product into list
  const insertIntoList = (item) => {

    if (lists.length > 0) {
      // Select products from currentList
      db.transaction(
        tx => {
          tx.executeSql(`SELECT products FROM productsLists WHERE currentList = 1`,
            [], (trans, result) => {
              if (!result.rows._array[0].products) {
                listProducts = JSON.stringify(item);
                setListProducts(listProducts);
              } else {
                listProducts = result.rows._array[0].products + "," + JSON.stringify(item);
                setListProducts(listProducts);
              }
            },
            error => {
              console.log("error updating products in currentList : " + error.message);
            });
        }
      );

      // Update products in current list
      if (!listProducts.includes(JSON.stringify(item))) {

        // Update inCurrentList = 1 in products table
        db.transaction(
          tx => {
            tx.executeSql("UPDATE products SET inCurrentList = 1 WHERE id = '" + item.id + "'",
              [], (trans, result) => {
                console.log("Product inCurrentList updated in product !");
                getListsData();
              },
              error => {
                console.log("error updating product in products : " + error.message);
              });
          }
        );

        // Update list => Add new item
        db.transaction(
          tx => {
            tx.executeSql(`UPDATE productsLists SET products = ? WHERE currentList = 1`,
              [listProducts], (trans, result) => {
                console.log("Products updated in currentList !");
                getListsData();
              },
              error => {
                console.log("error updating products in currentList : " + error.message);
              });
          }
        );
      } else {
        // If product is already in the list
        Alert.alert(
          "ITEM IS IN THE LIST",
          "The selected item is already in the list",
          [
            {
              text: "OK",
              onPress: () => console.log("The selected item is already in the list")
            }
          ],
          {
            cancelable: false,
          }
        );
      }
    } else {
      // If no list created
      Alert.alert(
        "CREATE A LIST",
        "Create a list before inserting items !",
        [
          {
            text: "OK",
            onPress: () => console.log("Create a list before inserting items !")
          }
        ],
        {
          cancelable: false,
        }
      );
    }
  }

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

  const Item = ({ item }) => (
    <TouchableOpacity onPress={() => addToListAlert(item)} style={styles.item}>
      <Image style={styles.productImg} source={setImage(item.type)} />
      <Text style={styles.title} activeOpacity={0.8}>{item.name}</Text>
      {
        item.inCurrentList === 1 ?
          <Ionicons style={styles.ioniconList} name="checkmark-done-circle-outline" />
          : null
      }

    </TouchableOpacity >
  );

  const renderItem = ({ item }) => (
    <Item style={styles.title} item={item} />
  );

  const styles = StyleSheet.create({
    container: {
      width: '90%',
      flex: 1,
      paddingTop: 10,
      marginHorizontal: 16
    },
    item: {
      flex: 1,
      alignItems: "center",
      flexDirection: "row",
      Height: 50,
      fontSize: 16,
      backgroundColor: "#fff",
      padding: 10,
      marginVertical: 5,
      borderRadius: 5,
      borderWidth: 1,
      borderColor: "#D3D3D3",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.22,
      shadowRadius: 2.22,
      elevation: 3
    },
    title: {
      maxWidth: "70%",
      color: "#696969",
      fontSize: 16
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
    },
    buttonContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#4d2efc',
      width: 70,
      height: 70,
      position: 'absolute',
      bottom: 0,
      right: 0,
      marginBottom: 20,
      borderRadius: 35
    },
    button: {
      marginLeft: 3,
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      height: 70
    },
    ionicon: {
      color: '#fff',
      fontSize: 40
    },
    ioniconList: {
      position: 'absolute',
      right: 5,
      color: '#fff',
      fontSize: 36
    },
    modalView: {
      width: '90%',
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
    modalText2: {
      fontSize: 25,
      fontWeight: 'bold',
      marginVertical: 15,
      textAlign: "center"
    },
    modalButtonContainer: {
      marginTop: 50,
      paddingBottom: 35,
      width: '100%',
      maxHeight: 60,
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
    },
    inputHelper: {
      color: '#ff6961',
      width: '100%',
      fontSize: 12,
      textAlign: 'left'
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
        keyExtractor={(item) => item ? item.id : 0}
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} activeOpacity={0.8} >
          <Ionicons style={styles.ionicon} name='add-circle' onPress={() => setModalVisible(true)} />
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>

            <Text style={styles.modalText}>Create a new list</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter list name - ex : My list"
              onChangeText={onChangeName}
              value={nameForm}
            ></TextInput>
            <Text style={styles.inputHelper}>List name max length 24 characters</Text>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={() => insertList(nameForm)}
              >
                <Text style={styles.textStyle}>Submit</Text>
              </TouchableOpacity>
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