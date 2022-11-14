import * as React from 'react';
import { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, FlatList, TouchableOpacity, Image, StyleSheet, StatusBar, Alert, Modal, TextInput } from 'react-native';
import SelectDropdown from 'react-native-select-dropdown'
import Ionicons from 'react-native-vector-icons/Ionicons';
import database from '../../database/functions/DatabaseConnect';

const db = database;

// DEV - Drop table
/*
db.transaction(
  tx => {
    tx.executeSql(`DROP TABLE IF EXISTS products`, [], (trans, result) => {
      console.log("table products dropped successfully => " + JSON.stringify(result));
    },
      error => {
        console.log("error on dropping table : " + error.message);
      });
  }
);
*/

// DEV - Create table
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
        //console.log("table created successfully => " + JSON.stringify(result));
      },
      error => {
        console.log("error on creating table products : " + error.message);
      });
  }
);

/*
// DEV - Insert test data
db.transaction(
  tx => {
    tx.executeSql(`INSERT INTO 'products' (name, type, lastOrder) VALUES (? , ? , ?)`,
      ['Bananes', 'fruits et légumes', new Date().toISOString().slice(0, 10)], (trans, result) => {
        //console.log(trans, JSON.stringify(result))
      },
      error => {
        console.log("error inserting product into table products : " + error.message);
      });
  }
);

// DEV - Insert test data
db.transaction(
  tx => {
    tx.executeSql(`INSERT INTO 'products' (name, type, lastOrder) VALUES (? , ? , ?)`,
      ['Beurre', 'Produits frais', new Date().toISOString().slice(0, 10)], (trans, result) => {
        //console.log(trans, JSON.stringify(result))
      },
      error => {
        console.log("error inserting product into table products : " + error.message);
      });
  }
);
*/

export default function ProductsScreen({ navigation }) {

  var [products, setProducts] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [nameForm, onChangeName] = React.useState("");
  const [typeForm, onChangeType] = React.useState("");

  // Select options array
  const types = ['Fruits et légumes', 'Produits frais', 'Epicerie', 'Liquides', 'Surgelés', 'Hygiène', 'Textile', 'Droguerie', 'Autres'];

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
        tx.executeSql(`SELECT * FROM 'products' ORDER BY type ASC`, [], (trans, result) => {
          var len = result.rows.length;
          products = result.rows._array;

          if (len > 0) {
            console.log('Data = ' + JSON.stringify(result.rows._array));
            setProducts(products);
          } else {
            console.log('Database empty...');
            setProducts(products);
          }
        });
      }
    );
  }

  // Insert in table products
  const insertItem = (name, type, image) => {
    setModalVisible(false);

    image = setImage(type);

    if (name != undefined && type != undefined && name != "" && type != "") {
      console.log("Inserting new item in db ! " + name + ", " + type);

      db.transaction(
        tx => {
          tx.executeSql(`INSERT INTO 'products' (name, type, lastOrder) VALUES (? , ? , ?)`,
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
          tx.executeSql(`DELETE FROM 'products' WHERE name = '` + name + `'`, [], (trans, result) => {
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

  // TODO Put images 
  const Item = ({ name, type }) => (
    <TouchableOpacity onPress={() => deleteAlert(name)} style={styles.item}>
      <Image style={styles.productImg} source={setImage(type)} />
      <Text style={styles.title} activeOpacity={0.8}>{name}</Text>
    </TouchableOpacity >
  );

  const renderItem = ({ item }) => (
    <Item style={styles.title} name={item.name} type={item.type} itemId={item.id} />
  );

  // Style
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
    },
    select: {
      width: '100%',
      margin: 0
    },
    dropdown: {
      height: 'auto'
    }
  });

  // Render view
  return (
    <SafeAreaView style={styles.container}>
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

            <Text style={styles.modalText}>Ajouter un produit</Text>

            <TextInput
              style={styles.input}
              placeholder="Product name - ex : Fromage râpé"
              onChangeText={onChangeName}
              value={nameForm}
            ></TextInput>
            <SelectDropdown
              data={types}
              buttonStyle={styles.select}
              dropdownStyle={styles.dropdown}
              defaultButtonText="Select product type"
              onSelect={onChangeType}
              value={typeForm}
            />

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={() => insertItem(nameForm, typeForm)}
              >
                <Text style={styles.textStyle}>Save</Text>
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