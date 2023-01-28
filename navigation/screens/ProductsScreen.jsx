import * as React from 'react';
import { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, FlatList, TouchableOpacity, Image, StyleSheet, Alert, Modal, TextInput } from 'react-native';
import SelectDropdown from 'react-native-select-dropdown';
import SearchBar from "react-native-dynamic-search-bar";
import Ionicons from 'react-native-vector-icons/Ionicons';
import database from '../../database/functions/DatabaseConnect';
import setImage from '../../lists/functions/GetProductImage';
import types from '../../variables/Types';

const db = database;

export default function ProductsScreen({ navigation }) {

  var [products, setProducts] = useState([]);
  var [listProducts, setListProducts] = useState("");
  var [lists, setLists] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [nameForm, onChangeName] = React.useState("");
  const [nameListForm, onChangeListName] = React.useState("");
  const [typeForm, onChangeType] = React.useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [search, setsearch] = useState('');

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
            setProducts(products);
            setFilteredData([]);
          }
        });
      }
    );
  }

  // SELECT from productsLists table
  const getListsData = () => {
    // Get data for list refresh, display check icon 
    getData();
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

  // Insert in table products
  const insertItem = (name, type, image) => {
    setModalVisible(false);

    image = setImage(type);

    if (name != undefined && type != undefined && name != "" && type != "") {
      console.log("Inserting new item in db ! " + name + ", " + type);

      db.transaction(
        tx => {
          tx.executeSql(`INSERT INTO products (name, type, lastOrder) VALUES (? , ? , ?)`,
            [name.trim(), type.trim(), new Date().toISOString().slice(0, 10)], (trans, result) => {
              console.log("Item inserted in DB !");
              getData();
            },
            error => {
              console.log("error inserting product into table products : " + error.message);
            });
        }
      );

      // Reset form after submit
      onChangeName("");
      onChangeType("");
    } else {
      // If required inputs are not filled => Display alert
      Alert.alert(
        "MISSING INFO",
        "Product name or product type are required ! Be sure to fill these data.",
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

  // Delete data from products table
  const deleteItem = (name) => {
    if (name != null || name != undefined) {
      db.transaction(
        tx => {
          tx.executeSql(`DELETE FROM products WHERE name = '` + name + `'`, [], (trans, result) => {
            console.log("Deleting item : " + name);
            getData();
          },
            error => {
              console.log("error deleting product from table products : " + error.message);
            });
        }
      );
    }
  }

  // Alert on product click => Delete item
  const deleteAlert = (name) =>
    Alert.alert(
      "DELETE ITEM",
      "Do you really want to delete this item ?",
      [
        {
          text: "No, keep it",
          onPress: () => console.log("Keep touched " + name)
        },
        {
          text: "Yes, delete this",
          onPress: () => deleteItem(name),
          style: "cancel"
        }
      ],
      {
        cancelable: true,
      }
    );

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

  const Item = ({ item }) => (
    <TouchableOpacity onPress={() => deleteAlert(item.name)} style={styles.item}>
      {
        item.inCurrentList !== 1 ?
          <TouchableOpacity onPress={() => addToListAlert(item)} style={styles.itemBtnAdd}>
            <Ionicons style={styles.addIcon} name="add-circle-outline" />
          </TouchableOpacity >
          : null
      }
      <Image style={styles.itemProductImg} source={setImage(item.type)} />
      <Text style={styles.itemTitle} activeOpacity={0.8}>{item.name}</Text>
      {
        item.inCurrentList === 1 ?
          <Ionicons style={styles.iconListCheck} name="checkmark-done-circle-outline" />
          : null
      }
    </TouchableOpacity >
  );

  const renderItem = ({ item }) => (
    <Item style={styles.itemTitle} item={item} />
  );

  // Style
  const styles = StyleSheet.create({
    /* Main container */
    safeAreaView: {
      width: '90%',
      flex: 1,
      paddingTop: 10,
      marginHorizontal: 16
    },
    /* Searchbar */
    searchbar: {
      width: '100%',
      height: 50,
      marginBottom: 20,
      paddingVertical: 10
    },
    /* Flatlist */
    /* Items */
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
    itemTitle: {
      maxWidth: "70%",
      color: "#696969",
      fontSize: 16
    },
    itemProductImg: {
      maxWidth: 40,
      maxHeight: 40,
      marginLeft: 10,
      marginRight: 15,
      borderRadius: 20
    },
    iconListCheck: {
      position: 'absolute',
      right: 5,
      fontSize: 36
    },
    itemBtnAdd: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#1E90FF',
      maxWidth: 40,
      height: 40,
      borderRadius: 20
    },
    addListIcon: {
      color: '#fff',
      fontSize: 40
    },
    /* Button add new object */
    btnAddObjectView: {
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
    btnAddObject: {
      marginLeft: 3,
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      height: 70
    },
    addIcon: {
      fontSize: 40
    },
    /* Modal */
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
    modalButtonContainer: {
      paddingTop: 15,
      marginTop: 20,
      marginBottom: 60,
      width: '100%',
      maxHeight: 80,
      flex: 1,
      flexDirection: 'row',
      alignItems: "center",
      justifyContent: 'space-around'
    },
    modalButton: {
      alignItems: 'center',
      width: '100%',
      height: 50,
      borderRadius: 5,
      marginTop: 20,
      padding: 15,
      backgroundColor: '#1E90FF',
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.22,
      shadowRadius: 2.22,
      elevation: 3
    },
    modalBtnText: {
      color: '#fff',
      fontSize: 16,
      width: '100%',
      textAlign: 'center'
    },
    iconSave: {
      fontSize: 20,
      marginRight: 5
    },
    modalInput: {
      width: '100%',
      height: 50,
      fontSize: 14,
      margin: 12,
      borderWidth: 1,
      padding: 10
    },
    modalSelect: {
      width: '100%',
      margin: 0
    },
    modalDropdown: {
      height: 'auto'
    },
    modalInputHelper: {
      color: '#ff6961',
      width: '100%',
      fontSize: 12,
      textAlign: 'left'
    },
    /* Button close modal */
    btnCloseModalContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#1E90FF',
      width: 70,
      height: 70,
      position: 'absolute',
      bottom: -50,
      right: 20,
      marginBottom: 20,
      borderRadius: 35
    },
    btnCloseModal: {
      color: '#fff',
      fontSize: 16,
      width: '100%',
      textAlign: 'center'
    },
    iconBtnCloseModal: {
      marginLeft: 2,
      textAlign: 'center',
      fontSize: 40
    }
  });

  // Render view
  return (
    <SafeAreaView style={styles.safeAreaView}>
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

      <View style={styles.btnAddObjectView}>
        <TouchableOpacity style={styles.btnAddObject} activeOpacity={0.8} >
          <Ionicons style={styles.addIcon} name='add-outline' onPress={() => setModalVisible(true)} />
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
        <View style={styles.modalCenteredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>Add new product</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Product name - ex : Cheese"
              onChangeText={onChangeName}
              value={nameForm}
            ></TextInput>
            <SelectDropdown
              data={types}
              buttonStyle={styles.modalSelect}
              dropdownStyle={styles.modalDropdown}
              defaultButtonText="Select product type"
              onSelect={onChangeType}
              value={typeForm}
            />

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => insertItem(nameForm, typeForm)}
              >
                <Text style={styles.modalBtnText}><Ionicons style={styles.iconSave} name='save' /> Save product</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalText}>Create a new list</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter list name - ex : My list"
              onChangeText={onChangeListName}
              value={nameListForm}
            ></TextInput>
            <Text style={styles.modalInputHelper}>List name max length 24 characters</Text>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => insertList(nameListForm)}
              >
                <Text style={styles.modalBtnText}><Ionicons style={styles.iconSave} name='save' /> Save list</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.btnCloseModalContainer}>
            <TouchableOpacity
              style={styles.btnCloseModal}
              onPress={() => setModalVisible(!modalVisible)}
            >
              <Ionicons style={styles.iconBtnCloseModal} name='close-circle' />
            </TouchableOpacity>
          </View>

        </View>
      </Modal>
    </SafeAreaView>
  );
}