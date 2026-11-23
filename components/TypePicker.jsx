import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import types from '../variables/Types';
import getProductImage from '../lists/functions/GetProductImage';
import { colors } from '../variables/theme';

export default function TypePicker({ selectedType, onSelect }) {
  const [modalVisible, setModalVisible] = useState(false);

  const handleSelect = (type) => {
    onSelect(type);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.pickerButton}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        {selectedType ? (
          <View style={styles.selectedRow}>
            <Image source={getProductImage(selectedType)} style={styles.pickerImg} />
            <Text style={styles.selectedText}>{selectedType}</Text>
          </View>
        ) : (
          <Text style={styles.placeholderText}>Select product category</Text>
        )}
        <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={types}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const isSelected = item === selectedType;
                return (
                  <TouchableOpacity
                    style={[styles.typeItem, isSelected && styles.typeItemSelected]}
                    onPress={() => handleSelect(item)}
                    activeOpacity={0.7}
                  >
                    <Image source={getProductImage(item)} style={styles.typeImg} />
                    <Text style={[styles.typeText, isSelected && styles.typeTextSelected]}>
                      {item}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 6,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: 50,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  selectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerImg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 10,
  },
  selectedText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  placeholderText: {
    fontSize: 15,
    color: colors.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '75%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  typeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginVertical: 2,
  },
  typeItemSelected: {
    backgroundColor: '#eff6ff',
  },
  typeImg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  typeText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  typeTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
});
