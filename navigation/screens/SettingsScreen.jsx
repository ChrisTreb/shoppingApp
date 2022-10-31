import * as React from 'react';
import { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
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
    }, []);

    const getData = () => {
        db.transaction(
            tx => {
                tx.executeSql(`SELECT * FROM 'products' ORDER BY type DESC`, [], (trans, result) => {
                    var len = result.rows.length;

                    if(len > 0 ) {
                        console.log('Data = ' + JSON.stringify(result.rows._array));
                        products = result.rows._array;
                        setProducts(products);
                    }
                });
            }
        );
    }

    const Item = ({ title, type }) => (
        <View>
          <Text>{title} - {type}</Text>
        </View>
    );

    const renderItem = ({ item }) => (
        <Item title={item.name} type={item.type} />
      );
    

    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
             <FlatList
                data={products}
                renderItem={renderItem}
                keyExtractor={item => item.id}
      />
        </View>
    );
}