import * as React from 'react';
import { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, FlatList, TouchableOpacity, Image, StyleSheet, Modal, Alert, StatusBar } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import database from '../../database/functions/DatabaseConnect';
import setImage from '../../lists/functions/GetProductImage';

const db = database;

export default function HomeScreen({ navigation }) {

  const [modalHomeVisible, setModalHomeVisible] = useState(true);
  const [modalListVisible, setModalListVisible] = useState(false);
  var [list, setList] = useState({});
  var [products, setProducts] = useState([]);
  var [displayedProducts, setDisplayedProducts] = useState([]);

  useEffect(() => {
    // Reload list each time we load the page
    const unsubscribe = navigation.addListener('focus', () => {
      [getCurrentListData(), getCurrentListProducts()]
    });
    return unsubscribe;
  }, [navigation]);

  // SELECT from productsLists table
  const getCurrentListProducts = () => {

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
        tx.executeSql(`SELECT * FROM products WHERE inCurrentList = 1 ORDER BY type DESC`, [], (trans, result) => {
          var len = result.rows.length;
          if (len > 0) {
            products = result.rows._array;
            console.log('Products in currentList = ' + JSON.stringify(result.rows._array));
            setProducts(products);
          } else {
            console.log('Database empty... no products in currentList');
            setProducts([]);
            setDisplayedProducts([]);
          }
        });
      }
    );
  }

  const getCurrentListData = () => {

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
        tx.executeSql(`SELECT * FROM productsLists WHERE currentList = 1`, [], (trans, result) => {
          var len = result.rows.length;
          if (len > 0) {
            list = result.rows._array[0];
            console.log('CurrentList ' + list.listName + " = " + JSON.stringify(result.rows._array[0]));
            setList(list);
          } else {
            console.log('CurrentList is empty... ');
            setList({});
            setProducts([]);
            setDisplayedProducts([]);
          }
        });
      }
    );
  }

  // Remove item from current list
  const removeItem = (item) => {
    db.transaction(
      tx => {
        tx.executeSql(`UPDATE products SET inCurrentList = 0 WHERE id = ` + item.id,
          [], (trans, result) => {
            console.log("Removed from list - Updated product inCurrentList = 0 => " + item.name + "!");
          },
          error => {
            console.log("error updating products : " + error.message);
          });
      }
    );
    getCurrentListProducts();
  }

  // Alert on product click => Add to cart, remove from current display screen
  const addToCart = (item) =>
    Alert.alert(
      "ADD TO CART",
      "Remove this from display ? " + item.name,
      [
        {
          text: "No",
          onPress: () => console.log("No, " + item.name),
          style: "cancel"
        },
        {
          text: "Yes",
          onPress: () => checkItem(item)
        }
      ],
      {
        cancelable: false,
      }
    );

  // Alert edit list => remove from currentList
  const AlertRemoveItemFromList = (item) =>
    Alert.alert(
      "Remove this item ?",
      "Do you want to delete from your list ? " + item.name,
      [
        {
          text: "No",
          onPress: () => console.log("No, " + item.name),
          style: "cancel"
        },
        {
          text: "Yes, sure !",
          onPress: () => removeItem(item)
        }
      ],
      {
        cancelable: false,
      }
    );

  // Check item in list
  const checkItem = (item) => {
    if (item != "" || item != undefined) {
      displayedProducts = products.filter((el) => el.id != item.id);
      setDisplayedProducts(displayedProducts);
      setProducts(displayedProducts);
    } else {
      setProducts(products);
    }
  }

  // Items displayed in home list
  const Item = ({ item }) => {
    if (item) {
      return (
        <TouchableOpacity onPress={() => addToCart(item)} style={styles.item}>
          <Image style={styles.productImg} source={setImage(item.type)} />
          <Text style={styles.title} activeOpacity={0.8}>{item.name}</Text>
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

  // Items displayed in modal editing list
  const ModalItem = ({ item }) => {
    if (item) {
      return (
        <TouchableOpacity onPress={() => AlertRemoveItemFromList(item)} style={styles.itemEdit}>
          <Image style={styles.productImg} source={setImage(item.type)} />
          <Text style={styles.title} activeOpacity={0.8}>{item.name}</Text>
        </TouchableOpacity >
      )
    }
  };

  const renderModalItem = ({ item }) => {
    if (item) {
      return (
        <ModalItem style={styles.title} item={item} />
      )
    }
  };

  // CSS Styles
  const styles = StyleSheet.create({
    container: {
      width: '90%',
      flex: 1,
      marginHorizontal: 16
    },
    listHeader: {
      width: "100%",
      position: "absolute",
      flex: 1,
      height: 60,
      maxHeight: 60,
      paddingVertical: 10,
      justifyContent: "space-between",
      alignContent: "center",
      flexDirection: "row"
    },
    btnEdit: {
    },
    listHeaderText: {
      fontSize: 14,
      marginTop: 12,
      marginLeft: 10,
      fontWeight: "bold"
    },
    emptyListContainer: {
      flex: 1,
      width: "100%",
      height: "20%",
      justifyContent: "center",
      alignItems: "center"
    },
    emptyListImage: {
      maxWidth: 150,
      maxHeight: 150,
      marginBottom: 20
    },
    emptyListText: {
      textAlign: "center",
      fontSize: 20,
      fontWeight: "bold",
      paddingHorizontal: 50
    },
    flatlist: {
      marginTop: 60
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
    itemEdit: {
      flex: 1,
      alignItems: "center",
      flexDirection: "row",
      Height: 50,
      fontSize: 16,
      backgroundColor: "#fff",
      padding: 10,
      marginVertical: 5,
      borderRadius: 5,
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
      maxWidth: "80%",
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
    centeredView: {
      height: '100%',
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center'
    },
    modalHomeView: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center'
    },
    modalHomeText: {
      fontSize: 50,
      fontWeight: 'bold',
      textAlign: "center"
    },
    modalHomeSubText: {
      paddingBottom: 50,
      fontSize: 16,
      textAlign: "center"
    },
    modalListView: {
      display: 'flex',
      alignItems: "center",
      justifyContent: 'center',
      height: "100%",
      padding: 15,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5
    },
    modalListText: {
      marginTop: 30,
      fontSize: 24,
      fontWeight: 'bold',
      textAlign: "center"
    },
    startButton: {
      backgroundColor: "#1E90FF",
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      width: 90,
      maxHeight: 90,
      borderRadius: 45
    },
    startIcon: {
      fontSize: 60,
      marginLeft: 3,
      color: '#fff'
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
      fontSize: 48,
      color: '#fff'
    },
    flatlistEdit: {
      maxWidth: "100%",
      marginTop: 15
    },
    ioniconTitle: {
      fontSize: 50
    },
    iconEdit: {
      paddingTop: 3,
      fontSize: 30
    }
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar />
      <View style={styles.listHeader}>
        {list.listName ?
          <Text style={styles.listHeaderText}>{list.listName} - {list.createdAt}</Text>
          :
          <Text style={styles.listHeaderText}>No Active List</Text>
        }
        {list.listName ?
          <TouchableOpacity
            style={styles.btnEdit}
            onPress={() => {
              setModalListVisible(!modalListVisible),
                console.log("Opening edit modal !")
            }}
          >
            <Ionicons style={styles.iconEdit} name='create' />
          </TouchableOpacity>
          :
          null
        }
      </View>

      {/* 
      If there's a list with product display list 
      Else display cat with empty list message
      */}
      {
        (Object.keys(list).length != 0) && (products != 0) ?
          <FlatList style={styles.flatlist}
            data={products}
            renderItem={renderItem}
            keyExtractor={(item) => item ? item.id : 0}
          />
          :
          <View style={styles.emptyListContainer}>
            <Image style={styles.emptyListImage} source={require('../../img/home/cat.png')} />
            <Text style={styles.emptyListText}>Create a list first and add at least one product !</Text>
          </View>
      }

      {/* MODAL HOME START */}
      <Modal style={styles.modalHome}
        animationType="fade"
        transparent={false}
        visible={modalHomeVisible}
        onRequestClose={() => {
          setModalHomeVisible(!modalHomeVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalHomeView}>
            <Text style={styles.modalHomeText}><Ionicons style={styles.ioniconTitle} name="list-outline" />Listahan</Text>
            <Text style={styles.modalHomeSubText}>My shopping mate</Text>
            <TouchableOpacity style={styles.startButton}
              activeOpacity={0.8}
              onPress={() => setModalHomeVisible(!modalHomeVisible)}
            >
              <Ionicons style={styles.startIcon} name='play-circle' />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL LIST EDITING */}
      <Modal style={styles.modalList}
        animationType="fade"
        transparent={false}
        visible={modalListVisible}
        onRequestClose={() => {
          setModalListVisible(!modalListVisible);
        }}
      >
        <View>
          <View style={styles.modalListView}>
            <Text style={styles.modalListText}>List editing</Text>
            <Text>Here you can delete items</Text>

            <FlatList style={styles.flatlistEdit}
              data={products}
              renderItem={renderModalItem}
              keyExtractor={(item) => item ? item.id : 0}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.btnCloseEdit}
          activeOpacity={0.8}
          onPress={() => setModalListVisible(!modalListVisible)}
        >
          <Ionicons style={styles.closeBtnEditText} name="close-circle" />
        </TouchableOpacity>

      </Modal>

    </SafeAreaView>
  );
}