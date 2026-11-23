import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  SafeAreaView,
  Image,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { dbService } from '../../database/functions/DatabaseConnect';
import getProductsFromList from '../../lists/functions/GetProductsFromList';
import setImage from '../../lists/functions/GetProductImage';
import { colors } from '../../variables/theme';

// Memoized List Row
const ListRow = React.memo(({ item, isCurrent, onSelect, onBrowse }) => {
  const parsedProducts = useMemo(() => getProductsFromList(item.products), [item.products]);
  const productCount = parsedProducts.length;

  return (
    <View style={[styles.item, isCurrent && styles.itemCurrent]}>
      <TouchableOpacity
        style={styles.itemMainTouch}
        onPress={() => onSelect(item)}
        activeOpacity={0.7}
      >
        <View style={styles.listTextContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {item.listName}
            </Text>
            {isCurrent && (
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>ACTIVE</Text>
              </View>
            )}
          </View>
          <Text style={styles.subtitle}>
            {item.createdAt} • {productCount} {productCount > 1 ? "items" : "item"}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.btnBrowseList}
        onPress={() => onBrowse(item, parsedProducts)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons
          name={productCount > 0 ? "open-outline" : "eye-off-outline"}
          size={20}
          color="#ffffff"
        />
      </TouchableOpacity>
    </View>
  );
});

// Memoized Modal Product Row
const ModalProductRow = React.memo(({ item }) => {
  return (
    <View style={styles.modalProductItem}>
      <Image style={styles.productImg} source={setImage(item.type)} />
      <View style={styles.modalProductTextContainer}>
        <Text style={styles.modalProductTitle} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.modalProductCategory} numberOfLines={1}>
          {item.type}
        </Text>
      </View>
    </View>
  );
});

export default function OverviewScreen({ navigation }) {
  const [lists, setLists] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedList, setSelectedList] = useState(null);
  const [modalProducts, setModalProducts] = useState([]);

  // Load lists from DB
  const loadLists = useCallback(() => {
    try {
      const allLists = dbService.getAllLists();
      setLists(allLists);
    } catch (err) {
      console.error("OverviewScreen loadLists error:", err);
    }
  }, []);

  useEffect(() => {
    loadLists();
    const unsubscribe = navigation.addListener('focus', loadLists);
    return unsubscribe;
  }, [navigation, loadLists]);

  // Switch to selected list
  const handleSwitchList = useCallback((list) => {
    try {
      dbService.switchList(list.id, list.products);
      loadLists();
      Alert.alert("List Activated", `"${list.listName}" is now your active list.`);
    } catch (err) {
      Alert.alert("Error", "Could not activate this list.");
    }
  }, [loadLists]);

  // Confirm set as current list
  const confirmSetCurrentList = useCallback((item) => {
    if (item.currentList === 1) {
      Alert.alert("Already Active", `"${item.listName}" is already your active list.`);
      return;
    }

    Alert.alert(
      "Activate List",
      `Set "${item.listName}" as your active shopping list?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Activate",
          onPress: () => handleSwitchList(item),
        },
      ],
      { cancelable: true }
    );
  }, [handleSwitchList]);

  // Browse list products in modal
  const handleBrowseList = useCallback((item, productsArr) => {
    if (!productsArr || productsArr.length === 0) {
      Alert.alert("Empty List", `"${item.listName}" does not contain any products yet.`);
      return;
    }
    setSelectedList(item);
    setModalProducts(productsArr);
    setModalVisible(true);
  }, []);

  // Drop products table confirmation
  const alertDropProductsTable = () => {
    Alert.alert(
      "CAUTION!",
      "Are you sure you want to delete all products from your catalog? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All Products",
          style: "destructive",
          onPress: () => {
            try {
              dbService.dropProductsTable();
              loadLists();
              Alert.alert("Catalog Cleared", "All products have been deleted.");
            } catch (err) {
              Alert.alert("Error", "Failed to reset products table.");
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Drop lists table confirmation
  const alertDropListsTable = () => {
    Alert.alert(
      "CAUTION!",
      "Are you sure you want to delete all saved shopping lists? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All Lists",
          style: "destructive",
          onPress: () => {
            try {
              dbService.dropListsTable();
              loadLists();
              Alert.alert("Lists Cleared", "All lists have been deleted.");
            } catch (err) {
              Alert.alert("Error", "Failed to reset lists table.");
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const renderItem = useCallback(
    ({ item }) => (
      <ListRow
        item={item}
        isCurrent={item.currentList === 1}
        onSelect={confirmSetCurrentList}
        onBrowse={handleBrowseList}
      />
    ),
    [confirmSetCurrentList, handleBrowseList]
  );

  const renderModalProduct = useCallback(
    ({ item }) => <ModalProductRow item={item} />,
    []
  );

  const keyExtractor = useCallback((item) => item.id.toString(), []);
  const modalKeyExtractor = useCallback((item, index) => (item?.id ? item.id.toString() : index.toString()), []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Ionicons name="folder-outline" size={22} color={colors.primary} />
          <Text style={styles.sectionTitle}>Saved Lists</Text>
        </View>

        <FlatList
          data={lists}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="documents-outline" size={50} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No saved lists found</Text>
              <Text style={styles.emptySubText}>
                Go to the Products tab and tap the + button to create a list.
              </Text>
            </View>
          }
        />

        {/* Danger zone actions */}
        <View style={styles.dangerZone}>
          <View style={styles.warningRow}>
            <Ionicons name="warning-outline" size={18} color={colors.danger} />
            <Text style={styles.warningText}>Danger Zone (Irreversible)</Text>
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.dangerBtn}
              onPress={alertDropProductsTable}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={16} color="#ffffff" style={styles.btnIcon} />
              <Text style={styles.buttonText}>Clear Products</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dangerBtn}
              onPress={alertDropListsTable}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={16} color="#ffffff" style={styles.btnIcon} />
              <Text style={styles.buttonText}>Clear Lists</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Modal Browse List Content */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleContainer}>
              <Text style={styles.modalListText} numberOfLines={1}>
                {selectedList?.listName}
              </Text>
              <Text style={styles.modalSubtitle}>
                {modalProducts.length} {modalProducts.length > 1 ? "products" : "product"}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setModalVisible(false)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={modalProducts}
            renderItem={renderModalProduct}
            keyExtractor={modalKeyExtractor}
            contentContainerStyle={styles.modalListContent}
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 8,
  },
  listContent: {
    paddingBottom: 20,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  itemCurrent: {
    borderColor: colors.primary,
    borderWidth: 1.5,
    backgroundColor: '#f0f7ff',
  },
  itemMainTouch: {
    flex: 1,
  },
  listTextContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    maxWidth: '75%',
  },
  activeBadge: {
    backgroundColor: colors.primary,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  activeBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  btnBrowseList: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  emptyContainer: {
    paddingTop: 60,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 14,
    marginBottom: 6,
  },
  emptySubText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  dangerZone: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 14,
    paddingBottom: 16,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  warningText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dangerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    backgroundColor: colors.danger,
    borderRadius: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  btnIcon: {
    marginRight: 6,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitleContainer: {
    flex: 1,
  },
  modalListText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  modalListContent: {
    padding: 16,
  },
  modalProductItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  productImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  modalProductTextContainer: {
    flex: 1,
  },
  modalProductTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  modalProductCategory: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
