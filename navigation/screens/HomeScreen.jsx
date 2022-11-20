import * as React from 'react';
import { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, FlatList, TouchableOpacity, Image, StyleSheet, Modal, Alert, StatusBar } from 'react-native';
import database from '../../database/functions/DatabaseConnect';

const db = database;

export default function HomeScreen({ navigation }) {

  const types = ['Fruits et légumes', 'Produits frais', 'Epicerie', 'Liquides', 'Surgelés', 'Hygiène', 'Textile', 'Droguerie', 'Autres'];
  const [modalVisible, setModalVisible] = useState(true);
  var [list, setList] = useState({});
  var [products, setProducts] = useState([]);
  var [displayedProducts, setDisplayedProducts] = useState([]);

  useEffect(() => {
    // Reload list each time we load the page
    const unsubscribe = navigation.addListener('focus', () => {
      getCurrentListProducts();
      getCurrentListData();
    });
    return unsubscribe;
  }, [navigation]);

  // SELECT from productsLists table
  const getCurrentListProducts = () => {
    db.transaction(
      tx => {
        tx.executeSql(`SELECT * FROM products WHERE inCurrentList = 1`, [], (trans, result) => {
          var len = result.rows.length;
          if (len > 0) {
            products = result.rows._array;
            console.log('Products in currentList = ' + JSON.stringify(result.rows._array));
            setProducts(products);
          } else {
            console.log('Database empty... no products in currentList');
            products = null;
            setProducts(products);
            setDisplayedProducts(displayedProducts);
          }
        });
      }
    );
  }

  const getCurrentListData = () => {
    db.transaction(
      tx => {
        tx.executeSql(`SELECT * FROM productsLists WHERE currentList = 1`, [], (trans, result) => {
          var len = result.rows.length;
          if (len > 0) {
            list = result.rows._array[0];
            console.log('CurrentList = ' + JSON.stringify(result.rows._array[0]));
            setList(list);
          } else {
            console.log('CurrentList is empty... ');
            setList(list);
            products = null
            setProducts(products);
            setDisplayedProducts(displayedProducts);
          }
        });
      }
    );
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

  const styles = StyleSheet.create({
    container: {
      width: '90%',
      flex: 1,
      marginHorizontal: 16
    },
    listHeader: {
      flex: 1,
      height: 50,
      maxHeight: 60,
      paddingVertical: 10,
      justifyContent: "center",
      alignContent: "center"
    },
    listHeaderText: {
      fontSize: 14,
      marginLeft: 10,
      fontWeight: "bold",
      marginTop: 20
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
    modalView: {
      backgroundColor: "#000",
      height: "100%",
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
      marginTop: 150,
      paddingBottom: 30,
      fontSize: 25,
      fontWeight: 'bold',
      marginBottom: 15,
      textAlign: "center"
    },
    homeImg: {
      paddingVertical: 50,
      width: '100%',
      height: 250,
      borderRadius: 10,
      marginBottom: 50
    },
    startButton: {
      maxHeight: 60,
      paddingVertical: 10,
      backgroundColor: "#1E90FF",
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      width: '90%',
      borderRadius: 5
    },
    startButtonText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 20
    }
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar />
      <View style={styles.listHeader}>
        {list.name ?
          <Text style={styles.listHeaderText}>{list.listName} - {list.createdAt}</Text>
          :
          <Text style={styles.listHeaderText}>No Active List</Text>
        }
      </View>

      {
        list && products ?
        <FlatList
          data={products}
          renderItem={renderItem}
          keyExtractor={(item) => item ? item.id : 0}
        />
        : <View style={styles.emptyListContainer}>
            <Image style={styles.emptyListImage} source={require('../../img/home/cat.png')} />
            <Text style={styles.emptyListText}>Create a list first and add at least one product !</Text>
          </View>
      }

      <Modal style={styles.modal}
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>Hello Shopping App</Text>
            <Image style={styles.homeImg} source={require('../../img/home/home.png')} />
            <TouchableOpacity style={styles.startButton}
              activeOpacity={0.8}
              onPress={() => setModalVisible(!modalVisible)}
            >
              <Text style={styles.startButtonText}>Let's go Shopping !</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}