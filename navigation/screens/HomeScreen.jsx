import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Modal,
  Alert,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { dbService } from '../../database/functions/DatabaseConnect';
import setImage from '../../lists/functions/GetProductImage';
import { colors } from '../../variables/theme';

// Memoized item for the main shopping list
const HomeProductItem = React.memo(({ item, onAddToCart }) => {
  return (
    <TouchableOpacity
      onPress={() => onAddToCart(item)}
      style={styles.item}
      activeOpacity={0.7}
    >
      <Image style={styles.productImg} source={setImage(item.type)} />
      <Text style={styles.title} numberOfLines={1}>
        {item.name}
      </Text>
      <Ionicons
        name="radio-button-off-outline"
        size={22}
        color={colors.textMuted}
        style={styles.checkIcon}
      />
    </TouchableOpacity>
  );
});

// Memoized item for the edit modal
const EditProductItem = React.memo(({ item, onRemove }) => {
  return (
    <TouchableOpacity
      onPress={() => onRemove(item)}
      style={styles.itemEdit}
      activeOpacity={0.7}
    >
      <Image style={styles.productImg} source={setImage(item.type)} />
      <Text style={styles.title} numberOfLines={1}>
        {item.name}
      </Text>
      <Ionicons
        name="trash-outline"
        size={22}
        color={colors.danger}
        style={styles.checkIcon}
      />
    </TouchableOpacity>
  );
});

export default function HomeScreen({ navigation }) {
  const [modalHomeVisible, setModalHomeVisible] = useState(false);
  const [modalListVisible, setModalListVisible] = useState(false);
  const [currentList, setCurrentList] = useState(null);
  const [products, setProducts] = useState([]);

  // Load current list info and products
  const loadData = useCallback(() => {
    try {
      const activeList = dbService.getCurrentList();
      setCurrentList(activeList);

      if (activeList) {
        const listProducts = dbService.getCurrentListProducts();
        setProducts(listProducts);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error("HomeScreen loadData error:", err);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation, loadData]);

  // Remove item from current list in database
  const handleRemoveItem = useCallback((item) => {
    try {
      dbService.removeProductFromCurrentList(item.id);
      loadData();
    } catch (err) {
      Alert.alert("Error", "Could not remove item from list");
    }
  }, [loadData]);

  // Confirm remove from list in edit modal
  const confirmRemoveItem = useCallback((item) => {
    Alert.alert(
      "Remove item?",
      `Delete "${item.name}" from your current list?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => handleRemoveItem(item),
        },
      ],
      { cancelable: true }
    );
  }, [handleRemoveItem]);

  // Check item (mark as added to cart in this shopping session)
  const handleAddToCart = useCallback((item) => {
    Alert.alert(
      "Add to Cart",
      `Mark "${item.name}" as taken and hide it?`,
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          onPress: () => {
            setProducts((prev) => prev.filter((p) => p.id !== item.id));
          },
        },
      ],
      { cancelable: true }
    );
  }, []);

  const renderItem = useCallback(
    ({ item }) => <HomeProductItem item={item} onAddToCart={handleAddToCart} />,
    [handleAddToCart]
  );

  const renderEditItem = useCallback(
    ({ item }) => <EditProductItem item={item} onRemove={confirmRemoveItem} />,
    [confirmRemoveItem]
  );

  const keyExtractor = useCallback((item) => item.id.toString(), []);

  const hasItems = currentList && products.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* List Header */}
      <View style={styles.listHeader}>
        <View style={styles.headerInfo}>
          <Text style={styles.listHeaderText} numberOfLines={1}>
            {currentList?.listName || "No Active List"}
          </Text>
          {currentList?.createdAt ? (
            <Text style={styles.listDateText}>Created on {currentList.createdAt}</Text>
          ) : null}
        </View>

        {currentList ? (
          <TouchableOpacity
            style={styles.btnEdit}
            onPress={() => setModalListVisible(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="create-outline" size={26} color={colors.primary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Main List Content */}
      {hasItems ? (
        <FlatList
          style={styles.flatlist}
          contentContainerStyle={styles.flatlistContent}
          data={products}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
        />
      ) : (
        <View style={styles.emptyListContainer}>
          <Image
            style={styles.emptyListImage}
            source={require('../../img/home/cat.png')}
            resizeMode="contain"
          />
          <Text style={styles.emptyListTitle}>Your list is empty</Text>
          <Text style={styles.emptyListText}>
            Select or create a list in Products and add items to get started!
          </Text>
        </View>
      )}

      {/* Modal Welcome */}
      <Modal
        animationType="fade"
        transparent={false}
        visible={modalHomeVisible}
        onRequestClose={() => setModalHomeVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalHomeView}>
            <View style={styles.welcomeLogoRow}>
              <Ionicons name="cart" size={48} color={colors.primary} />
              <Text style={styles.modalHomeText}>Listahan</Text>
            </View>
            <Text style={styles.modalHomeSubText}>Your smart shopping companion</Text>
            <TouchableOpacity
              style={styles.startButton}
              activeOpacity={0.8}
              onPress={() => setModalHomeVisible(false)}
            >
              <Ionicons name="arrow-forward" size={32} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Edit List */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalListVisible}
        onRequestClose={() => setModalListVisible(false)}
      >
        <SafeAreaView style={styles.modalSafeContainer}>
          <View style={styles.modalHeaderBar}>
            <View>
              <Text style={styles.modalListText}>Edit List</Text>
              <Text style={styles.modalSubText}>Tap an item to delete it from this list</Text>
            </View>
            <TouchableOpacity
              style={styles.closeHeaderBtn}
              onPress={() => setModalListVisible(false)}
            >
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
          </View>

          <FlatList
            style={styles.flatlistEdit}
            contentContainerStyle={styles.flatlistContent}
            data={products}
            renderItem={renderEditItem}
            keyExtractor={keyExtractor}
            ListEmptyComponent={
              <View style={styles.emptyModalContainer}>
                <Text style={styles.emptyModalText}>No items remaining in this list.</Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerInfo: {
    flex: 1,
  },
  listHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  listDateText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  btnEdit: {
    padding: 6,
    marginLeft: 12,
  },
  flatlist: {
    flex: 1,
  },
  flatlistContent: {
    padding: 16,
    paddingBottom: 24,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2.5,
    elevation: 2,
  },
  itemEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fed7d7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2.5,
    elevation: 2,
  },
  title: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  productImg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 14,
  },
  checkIcon: {
    marginLeft: 8,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyListImage: {
    width: 140,
    height: 140,
    marginBottom: 20,
    opacity: 0.85,
  },
  emptyListTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyListText: {
    textAlign: 'center',
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  centeredView: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalHomeView: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalHomeText: {
    fontSize: 38,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 10,
  },
  modalHomeSubText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 40,
    textAlign: 'center',
  },
  startButton: {
    backgroundColor: colors.primary,
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
  modalSafeContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeaderBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalListText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalSubText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeHeaderBtn: {
    padding: 6,
  },
  flatlistEdit: {
    flex: 1,
  },
  emptyModalContainer: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyModalText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});
