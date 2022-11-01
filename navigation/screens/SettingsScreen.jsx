import * as React from 'react';
import { useEffect, useState } from 'react';
import { SafeAreaView, Text, FlatList, TouchableOpacity, Image, StyleSheet, StatusBar, Alert } from 'react-native';
import * as SQLite from "expo-sqlite";

function openDatabase() {
    const db = SQLite.openDatabase("db.db");
    return db;
}

const db = openDatabase();

db.transaction(
    tx => {
        tx.executeSql(`DROP TABLE IF EXISTS products`, [], (trans, result) => {
            console.log("table dropped successfully => " + JSON.stringify(result));
        },
            error => {
                console.log("error on dropping table " + error.message);
            });
    }
);

db.transaction(
    tx => {
        tx.executeSql(`CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, name VARCHAR(50) NOT NULL, type VARCHAR(50) NOT NULL, img VARCHAR(255), lastOrder TIMESTAMP)`, [], (trans, result) => {
            console.log("table created successfully => " + JSON.stringify(result));
        },
            error => {
                console.log("error on creating table products" + error.message);
            });
    }
);

db.transaction(
    tx => {
        tx.executeSql(`INSERT INTO 'products' (name, type, lastOrder) VALUES ('Bananes', 'fruits et légumes', datetime('now'))`, [], (trans, result) => {
            console.log(trans, JSON.stringify(result))
        },
            error => {
                console.log("error inserting product into table products " + error.message);
            });
    }
);

db.transaction(
    tx => {
        tx.executeSql(`INSERT INTO 'products' (name, type, lastOrder) VALUES ('Beurre', 'Produits frais', datetime('now'))`, [], (trans, result) => {
            console.log(trans, JSON.stringify(result))
        },
            error => {
                console.log("error inserting product into table products " + error.message);
            });
    }
);

export default function SettingsScreen() {

    var [products, setProducts] = useState("");

    useEffect(() => {
        getData();
        deleteItem();
    }, []);

    const getData = () => {
        db.transaction(
            tx => {
                tx.executeSql(`SELECT * FROM 'products' ORDER BY type DESC`, [], (trans, result) => {
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

    const deleteItem = (name) => {
        if (name != null) {
            db.transaction(
                tx => {
                    tx.executeSql(`DELETE FROM 'products' WHERE name = '` + name + `'`, [], (trans, result) => {
                        console.log("Deleting item : " + name);
                        getData();
                    });
                }
            );
        }
    }

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

    const Item = ({ name }) => (
        <TouchableOpacity onPress={() => deleteAlert(name)} style={styles.item}>
            <Image style={styles.productImg} source={require('../../img/products/banane.jpg')} />
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
        }
    });


    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={products}
                renderItem={renderItem}
                keyExtractor={item => item.id}
            />
        </SafeAreaView>
    );
}