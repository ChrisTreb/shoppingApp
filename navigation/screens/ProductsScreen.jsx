import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { dbService } from '../../database/functions/DatabaseConnect';
import setImage from '../../lists/functions/GetProductImage';
import { colors } from '../../variables/theme';
import SearchBar from '../../components/SearchBar';
import TypePicker from '../../components/TypePicker';

// Memoized item row
const ProductRow = React.memo(({ item, onAddToList, onDeletePrompt }) => {
  const isInList = item.inCurrentList === 1;

  return (
    <TouchableOpacity
      onPress={() => onDeletePrompt(item)}
      style={styles.item}
      activeOpacity={0.7}
    >
      {!isInList ? (
        <TouchableOpacity
          onPress={() => onAddToList(item)}
          style={styles.itemBtnAdd}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="add" size={24} color="#ffffff" />
        </TouchableOpacity>
      ) : (
        <View style={styles.itemBtnAddedPlaceholder} />
      )}

      <Image style={styles.itemProductImg} source={setImage(item.type)} />

      <View style={styles.itemTextContainer}>
        <Text style={styles.itemTitle} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.itemCategory} numberOfLines={1}>
          {item.type}
        </Text>
      </View>

      {isInList && (
        <Ionicons
          style={styles.iconListCheck}
          name="checkmark-circle"
          size={24}
          color={colors.success}
        />
      )}
    </TouchableOpacity>
  );
});

export default function ProductsScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [lists, setLists] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch] = useState('');

  // Form states
  const [nameForm, setNameForm] = useState('');
  const [typeForm, setTypeForm] = useState('');
  const [nameListForm, setNameListForm] = useState('');

  // Refresh products and lists from database
  const loadData = useCallback(() => {
    try {
      const allProducts = dbService.getProducts();
      setProducts(allProducts);

      const allLists = dbService.getAllLists();
      setLists(allLists);
    } catch (err) {
      console.error("ProductsScreen loadData error:", err);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation, loadData]);

  // Filtered products with useMemo for instant responsiveness
  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const query = search.trim().toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.type.toLowerCase().includes(query)
    );
  }, [products, search]);

  // Insert a new product
  const handleInsertProduct = () => {
    if (!nameForm.trim() || !typeForm.trim()) {
      Alert.alert(
        "Missing Information",
        "Please enter both a product name and select a category."
      );
      return;
    }

    try {
      dbService.insertProduct(nameForm.trim(), typeForm.trim());
      setNameForm('');
      setTypeForm('');
      setModalVisible(false);
      loadData();
    } catch (err) {
      Alert.alert("Error", "Could not save product. Please try again.");
    }
  };

  // Insert a new list
  const handleInsertList = () => {
    const trimmed = nameListForm.trim();
    if (!trimmed || trimmed.length > 24) {
      Alert.alert(
        "Invalid List Name",
        "List name is required and must not exceed 24 characters."
      );
      return;
    }

    try {
      dbService.createList(trimmed);
      setNameListForm('');
      setModalVisible(false);
      loadData();
      Alert.alert("Success", `List "${trimmed}" created and activated!`);
    } catch (err) {
      Alert.alert("Error", "Could not create list. Please try again.");
    }
  };

  // Add item to currently active list
  const handleAddToList = useCallback((item) => {
    try {
      const result = dbService.addProductToCurrentList(item);
      if (result?.alreadyInList) {
        Alert.alert("Already in List", `"${item.name}" is already in your current list.`);
        return;
      }
      loadData();
    } catch (err) {
      if (err.message === "NO_ACTIVE_LIST") {
        Alert.alert(
          "No Active List",
          "Please create or select a list before adding items.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Create List",
              onPress: () => setModalVisible(true),
            },
          ]
        );
      } else {
        Alert.alert("Error", "Could not add item to list.");
      }
    }
  }, [loadData]);

  // Delete product from database
  const handleDeleteProduct = useCallback((id) => {
    try {
      dbService.deleteProduct(id);
      loadData();
    } catch (err) {
      Alert.alert("Error", "Could not delete product.");
    }
  }, [loadData]);

  // Confirm delete alert
  const promptDeleteProduct = useCallback((item) => {
    Alert.alert(
      "Delete Product",
      `Are you sure you want to delete "${item.name}" from your catalog?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => handleDeleteProduct(item.id),
        },
      ],
      { cancelable: true }
    );
  }, [handleDeleteProduct]);

  const renderItem = useCallback(
    ({ item }) => (
      <ProductRow
        item={item}
        onAddToList={handleAddToList}
        onDeletePrompt={promptDeleteProduct}
      />
    ),
    [handleAddToList, promptDeleteProduct]
  );

  const keyExtractor = useCallback((item) => item.id.toString(), []);

  return (
    <SafeAreaView style={styles.safeAreaView}>
      <View style={styles.content}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          onClear={() => setSearch('')}
        />

        <FlatList
          data={filteredProducts}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={54} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>
                {search ? "No matching products" : "No products in catalog"}
              </Text>
              <Text style={styles.emptySubText}>
                {search
                  ? "Try a different search term."
                  : "Tap the + button below to add your first product."}
              </Text>
            </View>
          }
        />
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={32} color="#ffffff" />
      </TouchableOpacity>

      {/* Add Product / New List Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalMainTitle}>Quick Actions</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={26} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Section 1: Add New Product */}
              <View style={styles.sectionContainer}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="fast-food-outline" size={20} color={colors.primary} />
                  <Text style={styles.sectionTitle}>Add New Product</Text>
                </View>

                <TextInput
                  style={styles.input}
                  placeholder="Product name (e.g., Bananas)"
                  placeholderTextColor={colors.textMuted}
                  value={nameForm}
                  onChangeText={setNameForm}
                />

                <TypePicker
                  selectedType={typeForm}
                  onSelect={setTypeForm}
                />

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleInsertProduct}
                  activeOpacity={0.8}
                >
                  <Ionicons name="save-outline" size={18} color="#ffffff" style={styles.btnIcon} />
                  <Text style={styles.actionButtonText}>Save Product</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              {/* Section 2: Create New List */}
              <View style={styles.sectionContainer}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="list-outline" size={20} color={colors.primary} />
                  <Text style={styles.sectionTitle}>Create New List</Text>
                </View>

                <TextInput
                  style={styles.input}
                  placeholder="List name (e.g., Weekly Groceries)"
                  placeholderTextColor={colors.textMuted}
                  maxLength={24}
                  value={nameListForm}
                  onChangeText={setNameListForm}
                />
                <Text style={styles.helperText}>Max 24 characters</Text>

                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonSecondary]}
                  onPress={handleInsertList}
                  activeOpacity={0.8}
                >
                  <Ionicons name="create-outline" size={18} color="#ffffff" style={styles.btnIcon} />
                  <Text style={styles.actionButtonText}>Create & Activate List</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  listContent: {
    paddingBottom: 85,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingVertical: 10,
    paddingHorizontal: 12,
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
  itemBtnAdd: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  itemBtnAddedPlaceholder: {
    width: 6,
    height: 36,
    marginRight: 6,
  },
  itemProductImg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 12,
  },
  itemTextContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  itemCategory: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  iconListCheck: {
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 14,
  },
  modalMainTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  sectionContainer: {
    marginVertical: 8,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    color: colors.text,
    backgroundColor: '#ffffff',
    marginBottom: 6,
  },
  helperText: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    backgroundColor: colors.primary,
    borderRadius: 8,
    marginTop: 8,
  },
  actionButtonSecondary: {
    backgroundColor: colors.primaryDark,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  btnIcon: {
    marginRight: 6,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 14,
  },
});
