const OpenDatabase = () => (

    function openDatabase() {
        if (Platform.OS === "web") {
            return {
                transaction: () => {
                    return {
                        executeSql: () => { },
                    };
                },
            };
        }
    
        const db = SQLite.openDatabase("db.db");
        return db;
    }
);

export default OpenDatabase;