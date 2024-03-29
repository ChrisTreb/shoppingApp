import * as React from 'react';
import { useEffect, useState } from 'react';
import { SafeAreaView, Image, View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Pressable, Button, Modal } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import database from '../../database/functions/DatabaseConnect';
import getProductsFromList from '../../lists/functions/GetProductsFromList';
import setImage from '../../lists/functions/GetProductImage';

const db = database;

export default function OverviewScreen({ navigation }) {

  var [lists, setLists] = useState([]);
  var [products, setProducts] = useState([]);
  var [listName, setListName] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    // Reload list each time we load the page
    const unsubscribe = navigation.addListener('focus', () => {
      getLists();
    });
    return unsubscribe;
  }, [navigation]);

  // Get lists in table productsLists
  const getLists = () => {

    db.transaction(
      tx => {
        tx.executeSql(`SELECT * FROM productsLists ORDER BY id`, [], (trans, result) => {
          var len = result.rows.length;
          if (len > 0) {
            lists = result.rows._array;
            console.log('Lists in DB = ' + JSON.stringify(result.rows._array));
            setLists(lists);
          } else {
            console.log('No list in DB ! ');
            dropTableLists(); // Drop the table => To be sure no list is in cache somewhere...
            setLists([]);
          }
        });
      }
    );
  }

  // Drop table products
  const dropTableProducts = () => {
    // DEV - Drop table
    db.transaction(
      tx => {
        tx.executeSql(`DROP TABLE IF EXISTS products`, [], (trans, result) => {
          console.log("table products dropped successfully => " + JSON.stringify(result));
        },
          error => {
            console.log("error on dropping table products : " + error.message);
          });
      }
    );
  }

  // Drop table lists
  const dropTableLists = () => {
    // Update all products inCurrentList before creating new list
    resetCurrentlistProducts();

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

    setLists([]);
  }

  // Reset products in currentList
  const resetCurrentlistProducts = () => {
    db.transaction(
      tx => {
        tx.executeSql(`UPDATE products SET inCurrentList = 0 WHERE inCurrentList = 1`,
          [], (trans, result) => {
            console.log("Products updated in DB set inCurrentList = 0 !");
          },
          error => {
            console.log("error updating products : " + error.message);
          });
      }
    );
  }

  // Switch list
  const switchList = (list) => {
    console.log("Switching to list id : " + list.id);

    // Reset all products in DB
    resetCurrentlistProducts();
    console.log("No product in list !");

    db.transaction(
      tx => {
        tx.executeSql(`UPDATE productsLists SET currentList = 0 WHERE currentList = 1`,
          [], (trans, result) => {
            console.log("Update OK currentList = 0 where was 1 !");
          },
          error => {
            console.log("error updating productsLists : " + error.message);
          });
      }
    );

    db.transaction(
      tx => {
        tx.executeSql(`UPDATE productsLists SET currentList = 1 WHERE id = ` + list.id,
          [], (trans, result) => {
            console.log("Switched to list id " + list.id + "!");
          },
          error => {
            console.log("error updating productsLists : " + error.message);
          });
      }
    );

    if (list.products !== null) {
      let arrProducts = getProductsFromList(list.products);
      console.log(arrProducts);

      // For each products in new list set product inCurrentList = 1
      for (let i = 0; i < arrProducts.length; i++) {
        // Update each product inCurrentList = 1
        db.transaction(
          tx => {
            tx.executeSql(`UPDATE products SET inCurrentList = 1 WHERE id = ` + arrProducts[i].id,
              [], (trans, result) => {
                console.log("Updated product  inCurrentList = 1" + arrProducts[i].id + " - " + arrProducts[i].name + "!");
              },
              error => {
                console.log("error updating products : " + error.message);
              });
          }
        );
      }
    }
  }

  // Set Product when calling modal
  const setListProducts = (list) => {
    listName = list.listName;
    setListName(listName);
    products = getProductsFromList(list.products);
    console.log("Products in list : " + JSON.stringify(products));
    setProducts(products);
  }

  // Alert Drop products table
  const alertDropProductsTable = () => {
    Alert.alert(
      "CAUTION !",
      "You're going to delete all your products in database",
      [
        {
          text: "Cancel",
          onPress: () => console.log("Keep products touched "),
          style: "cancel"
        },
        {
          text: "Yes, delete all",
          onPress: () => dropTableProducts(),
        }
      ],
      {
        cancelable: false,
      }
    );
  }

  // Alert Drop products table
  const alertDropListsTable = () => {
    Alert.alert(
      "CAUTION !",
      "You're going to delete all your lists in database",
      [
        {
          text: "Cancel",
          onPress: () => console.log("Keep lists touched "),
          style: "cancel"
        },
        {
          text: "Yes, delete all",
          onPress: () => dropTableLists(),
        }
      ],
      {
        cancelable: false,
      }
    );
  }

  // Alert set this list as current list
  const alertSetCurrentList = (item) => {
    Alert.alert(
      "Set \"" + item.listName + "\" as current list ?",
      "Do you agree ?",
      [
        {
          text: "Cancel",
          onPress: () => console.log("Keep this list touched "),
          style: "cancel"
        },
        {
          text: "Yes, use this",
          onPress: () => switchList(item),
        }
      ],
      {
        cancelable: false,
      }
    );
  }

  // Alert when list is empty
  const alertEmptyList = (item) => {
    Alert.alert(
      "This list \"" + item.listName + "\" is empty",
      "Nothing here...",
      [
        {
          text: "Close",
          onPress: () => console.log("Empty list alert closed"),
          style: "cancel"
        }
      ],
      {
        cancelable: true,
      }
    );
  }

  // List Items
  const Item = ({ item }) => {
    if (item) {
      return (
        <TouchableOpacity style={styles.item} >
          <Text onPress={() => alertSetCurrentList(item)} style={styles.title} activeOpacity={0.8}>{item.listName} - {item.createdAt}</Text>
          {
            item.products ?
              <TouchableOpacity
                style={styles.btnBrowseList}
                onPress={() => { setModalVisible(!modalVisible), setListProducts(item) }}
              >
                <Ionicons style={styles.icon} name='open-outline' />
              </TouchableOpacity>
              :
              <TouchableOpacity
                style={styles.btnBrowseList}
                onPress={() => alertEmptyList(item)}
              >
                <Ionicons style={styles.icon} name='eye-off-outline' />
              </TouchableOpacity>
          }

        </TouchableOpacity >
      )
    }
  };

  const renderItem = ({ item }) => {
    if (item) {
      return (
        <Item style={styles.title} item={item} />
      )
    }
  };

  // Products in list render list
  const ListItem = ({ item }) => {
    if (item) {
      return (
        <TouchableOpacity style={styles.item}>
          <Image style={styles.productImg} source={setImage(item.type)} />
          <Text style={styles.title} activeOpacity={0.8}>{item.name}</Text>
        </TouchableOpacity >
      )
    }
  };

  const renderListItem = ({ item }) => {
    if (item) {
      return (
        <ListItem style={styles.title} item={item} />
      )
    }
  };


  // CSS
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      width: '90%',
      flex: 1,
      marginHorizontal: 16,
    },
    listContainer: {
      marginBottom: 15,
      maxHeight: 500
    },
    listContainerText: {
      minHeight: 20,
      fontSize: 20,
      marginVertical: 10
    },
    item: {
      maxWidth: '100%',
      flex: 1,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      Height: 50,
      fontSize: 16,
      backgroundColor: "#fff",
      paddingVertical: 15,
      paddingHorizontal: 10,
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
      width: "80%",
      color: "#696969",
      fontSize: 14
    },
    productImg: {
      maxWidth: 40,
      maxHeight: 40,
      marginLeft: 10,
      marginRight: 15,
      borderRadius: 20
    },
    buttonContainer: {
      width: '100%',
      maxHeight: 60,
      paddingHorizontal: 10,
      flex: 1,
      flexDirection: 'row',
      alignItems: "center",
      justifyContent: "center"
    },
    button: {
      height: 40,
      backgroundColor: "#ff6961",
      width: "50%",
      padding: 10,
      margin: 10,
      borderRadius: 5
    },
    buttonText: {
      textAlign: "center",
      fontSize: 14,
      color: '#fff'
    },
    btnBrowseList: {
      borderRadius: 25,
      padding: 10,
      backgroundColor: '#1E90FF'
    },
    modalList: {
      height: '100%',
      flex: 1,
      alignItems: "center"
    },
    modalListView: {
      height: "100%",
      padding: 10,
      alignItems: "center"
    },
    modalListText: {
      marginVertical: 30,
      fontSize: 24,
      fontWeight: 'bold',
      textAlign: "center"
    },
    btnCloseEdit: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#1E90FF',
      width: 70,
      height: 70,
      position: 'absolute',
      bottom: 20,
      right: 20,
      marginBottom: 20,
      borderRadius: 35
    },
    closeBtnEditText: {
      marginLeft: 3,
      color: '#fff',
      fontSize: 48
    },
    modalProductsList: {
      fontSize: 20,
      marginTop: 30,
    },
    icon: {
      fontSize: 20,
      color: '#fff'
    },
    ionicon: {
      fontSize: 20
    },
    iconWarning: {
      fontSize: 20,
      color: "#ff6961"
    },
    warningText: {
      color: "#ff6961"
    }
  });

  // View
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.listContainer}>
        <Text style={styles.listContainerText}><Ionicons style={styles.ionicon} name="server-outline" /> Lists storage</Text>
        {
          lists ?
            <FlatList
              data={lists}
              renderItem={renderItem}
              keyExtractor={(item) => item ? item.id : 0}
            />
            : <Text>No records found in database</Text>
        }
      </View>

      <Text style={styles.warningText}><Ionicons style={styles.iconWarning} name="warning-outline" /> Caution, these actions are irreversible !</Text>
      <View style={styles.buttonContainer}>
        <Pressable style={styles.button} onPress={() => alertDropProductsTable()} >
          <Text style={styles.buttonText}>Drop products</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={() => alertDropListsTable()} >
          <Text style={styles.buttonText}>Drop lists</Text>
        </Pressable>
      </View>

      {/* MODAL BROWSE LIST */}
      <Modal style={styles.modalList}
        animationType="fade"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.scrollView}>
          <View style={styles.modalListView}>
            <Text style={styles.modalListText}>{listName}</Text>
            <FlatList
              data={products}
              renderItem={renderListItem}
              keyExtractor={(item) => item ? item.id : 0}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.btnCloseEdit}
          activeOpacity={0.8}
          onPress={() => setModalVisible(!modalVisible)}
        >
          <Ionicons style={styles.closeBtnEditText} name="close-circle" />
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
}