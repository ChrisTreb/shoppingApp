import * as React from 'react';
import { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, FlatList, TouchableOpacity, Image, StyleSheet, StatusBar, Alert, Modal, TextInput } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import database from '../../database/functions/DatabaseConnect';

const db = database;

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
        tx.executeSql(`INSERT INTO 'products' (name, type, lastOrder) VALUES (? , ? , ?)`, ['Bananes', 'fruits et légumes', "datetime('now')"], (trans, result) => {
            console.log(trans, JSON.stringify(result))
        },
            error => {
                console.log("error inserting product into table products " + error.message);
            });
    }
);

db.transaction(
    tx => {
        tx.executeSql(`INSERT INTO 'products' (name, type, lastOrder) VALUES (? , ? , ?)`, ['Beurre', 'Produits frais', "datetime('now')"], (trans, result) => {
            console.log(trans, JSON.stringify(result))
        },
            error => {
                console.log("error inserting product into table products " + error.message);
            });
    }
);

export default function SettingsScreen() {

    var [products, setProducts] = useState("");
    const [modalVisible, setModalVisible] = useState(false);
    const [nameForm, onChangeName] = React.useState("");
    const [typeForm, onChangeType] = React.useState("");
    const [imgForm, onChangeImg] = React.useState("");

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
    });


    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={products}
                renderItem={renderItem}
                keyExtractor={item => item.id}
            />
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.button} >
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
                        <TextInput
                            style={styles.input}
                            placeholder="Product type - ex : Produit frais"
                            onChangeText={onChangeType}
                            value={typeForm}
                        ></TextInput>
                        <TextInput
                            style={styles.input}
                            placeholder="Product image - ex : https://test/img.png"
                            onChangeText={onChangeImg}
                            value={imgForm}
                        ></TextInput>

                        <View style={styles.modalButtonContainer}>
                            <TouchableOpacity
                                style={styles.closeModalButton}
                                onPress={() => setModalVisible(!modalVisible)}
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