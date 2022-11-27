import * as React from 'react';
import { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, FlatList, TouchableOpacity, Image, StyleSheet, Alert, Pressable } from 'react-native';
import database from '../../database/functions/DatabaseConnect';

const db = database;

export default function OverviewScreen({ navigation }) {

  var [lists, setLists] = useState([]);

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
            setLists(lists);
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

  const Item = ({ item }) => {
    if (item) {
      return (
        <TouchableOpacity style={styles.item}>
          <Text style={styles.title} activeOpacity={0.8}>{item.listName} - {item.createdAt}</Text>
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
    listContainer: {
      marginVertical: 30
    },
    listContainerText: {
      minHeight: 20,
      fontSize: 20,
      marginVertical: 10
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
    buttonContainer: {
      maxHeight: 90,
      marginTop: 50,
      flex: 1,
      alignItems: "center",
      justifyContent: "center"
    },
    button: {
      height: 50,
      backgroundColor: "#ff6961",
      width: "90%",
      padding: 10,
      margin: 10,
      borderRadius: 5
    },
    buttonText: {
      textAlign: "center",
      fontSize: 18
    }
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.listContainer}>
        <Text style={styles.listContainerText}>Lists storage</Text>
        {
          lists ?
            <FlatList
              data={lists}
              renderItem={renderItem}
              keyExtractor={(item) => item ? item.id : 0}
            />
            : null
        }
      </View>

      <View style={styles.buttonContainer}>
        <Text style={styles.buttonText}>Caution, these actions are irreversible ! </Text>
        <Pressable style={styles.button} onPress={() => alertDropProductsTable()} >
          <Text style={styles.buttonText}>Drop table products</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={() => alertDropListsTable()} >
          <Text style={styles.buttonText}>Drop table lists</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}