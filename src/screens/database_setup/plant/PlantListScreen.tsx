import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  Pressable,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import CheckBox from '@react-native-community/checkbox';
import { GeneralSearchRequest } from '../../../api/requests/generalSearchRequest';
import { PaginationRequest } from '../../../api/requests/paginationRequest';
import RNFS from 'react-native-fs';
import Icon from 'react-native-vector-icons/FontAwesome';
// @ts-ignore
import SystemIcon from '../../../../assets/system.svg';
// @ts-ignore
import LocationIcon from '../../../../assets/location-pointer.svg';
// @ts-ignore
import EditIcon from '../../../../assets/edit.svg';
// @ts-ignore
import ViewIcon from '../../../../assets/view.svg';
// @ts-ignore
import DeleteIcon from '../../../../assets/trash.svg';
// @ts-ignore
import SelectDarkIcon from '../../../../assets/checkmark.svg';
// @ts-ignore
import SelectIcon from '../../../../assets/checkmark--filled.svg';
import { useFocusEffect } from '@react-navigation/native';
import {
  getDetailPlant,
  getOfflineDataPlant,
  searchPlant,
} from '../../../api/services/plantService';
import { AccountListModal } from '../account/AccountListModal.tsx';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {database} from "../../../database";
import {insertPlantWithAll} from "../../../services/storage.service.ts";

export const PlantListScreen: React.FC<{
  navigation: any;
  type: string;
  route: any;
}> = (({ navigation, type, route }) => {
  let account = route?.params?.params?.account ?? null;

  const isDarkMode = useColorScheme() === 'dark';
  const [searchId, setSearchId] = useState('');
  const [searchDescription, setSearchDescription] = useState('');
  const [id, setId] = useState('');
  const [description, setDescription] = useState('');
  const [filteredPlants, setFilteredPlants] = useState([]);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingDownload, setLoadingDownload] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [visibleModalDelete, setVisibleModalDelete] = useState(false);
  const [currentPage, setCurrentPage] = useState<any>(undefined);
  const [totalResults, setTotalResults] = useState(0);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [descriptionAccount, setDescriptionAccount] = useState<string>('');
  const [accountId, setAccountId] = useState<any>(undefined);
  const [searchAccountId, setSearchAccountId] = useState(null);
  const [isSelectMode, setIsSelectMode] = useState<boolean>(false);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [myState, setMyState] = useState(false);

  const [modalAccountVisible, setModalAccountVisible] =
    useState<boolean>(false);

  useEffect(() => {
    if (account) {
      setDescriptionAccount(account.description);
      setAccountId(account.id);
      setSearchAccountId(account.id);
    }
    setCurrentPage(1);
  }, [account]);

  useFocusEffect(
    React.useCallback(() => {
      if (currentPage === undefined) {
        setCurrentPage(1);
        return;
      }

      applyFilters(currentPage);


    }, [currentPage, description, id, accountId])
  );
  useFocusEffect(
    React.useCallback(() => {

      if(type == 'download') {
        setIsSelectMode(true);
      }
      return () => {
        setCurrentPage(undefined);
        setFilteredPlants([]);
      };
    }, [])
  );

  const toggleItemSelection = (itemId: number) => {
    console.log('toggleItemSelection', itemId);
    setSelectedItems((prevSelected) => {
      if (prevSelected.includes(itemId)) {
        return prevSelected.filter((id) => id !== itemId);
      } else {
        return [...prevSelected, itemId];
      }
    });
  };

  const cancelSelectMode = () => {
    setIsSelectMode(false);
    setSelectedItems([]);
  };

  const clearDescription = () => {
    setSearchDescription('');
    setDescription('');
  };

  const clearAccountId = () => {
    account = null;
    setSearchAccountId(null);
    setAccountId(null);
    setDescriptionAccount('');
  };

  const clearCode = () => {
    setSearchId('');
    setId('');
  };

  const nextPage = () => {
    const totalPages = totalResults > 0 ? Math.ceil(totalResults / 10) : 1;

    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
    }
  };

  const searchFromModal = () => {
    setCurrentPage(1);
    setId(searchId);
    setAccountId(searchAccountId);
    setDescription(searchDescription);
    setFilterModalVisible(false);
  };

  const applyFilters = (
    page: number = 1,
    code = undefined,
    descriptionLocal = undefined,
    accountIdLocal = undefined
  ) => {
    setFilterModalVisible(false);
    setFilteredPlants([]);
    setLoading(true);
    page = isNaN(page) ? 1 : page;
    searchPlant(
      new GeneralSearchRequest(
        code ?? id,
        descriptionLocal ?? description,
        accountIdLocal ?? accountId
      ),
      new PaginationRequest(page)
    )
      .then((data) => {
        setFilteredPlants(data.data.records);
        setTotalResults(data.data.total);
      })
      .catch((error) => {
        console.error('Error fetching filtered data:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const selectPlant = (item: any) => {
    navigation.navigate(item);
  };

  const goToChild = useCallback((selectItem: any) => {
    navigation.navigate('areaScreen', {
      params: {
        plant: {
          id: selectItem.id,
          code: selectItem.code,
          description: selectItem.description,
        },
      },
    });
  }, []);

  const goToDetail = useCallback((itemId: number) => {
    setLoading(true);
    getDetailPlant(itemId)
      .then((data) => {
        navigation.navigate('plantDetailsScreen', {
          params: {
            plant: data,
          },
        });
        console.log(data);
      })
      .catch((error) => {
        console.error('Error fetching filtered data:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const showModalDeleting = (item: any) => {
    setDeleteId(item.id);
    setVisibleModalDelete(true);
  };



  const searchIndexPlants = (plants: any[], id: number) => {
    return plants.findIndex((plant: any) => plant.id === id);
  };
  const downloadPlants = () => {
    setLoadingDownload(true);
    console.log(selectedItems);

    AsyncStorage.getItem('plants')
        .then((plantsString) => {

          const plantsPromises = selectedItems.map((plantId) =>
              getOfflineDataPlant(plantId).then((plantData) => {
                const plants = JSON.parse(plantsString || '[]');
                const index = searchIndexPlants(plants, plantId);
                if (index !== -1) {

                  plants[index] = plantData[0];
                } else {
                  plants.push(plantData[0]);
                }
                // console.log(plantData[0]);
                // console.log(plantData[0].areas);
                const assets = plantData[0]?.areas?.map((area: any) => area.systems).flat()?.map((system: any) => system.mawois).flat() || [];

                console.log(assets);
                const assetsPromises = assets.map((asset: any) => {
                  const imagesPromises = asset.images.map((imageUrl: any) => {
                    const fileName = imageUrl.split('/').pop();
                    const localPath = `${RNFS.DocumentDirectoryPath}/${plantId}_${asset.id}_${fileName}`;


                    return RNFS.downloadFile({
                      fromUrl: imageUrl,
                      toFile: localPath,
                    })
                        .promise
                        .then((result) => {
                          if (result.statusCode === 200) {
                            // console.log(`Imagen ${imageUrl} guardada en ${localPath}`);
                            return {
                              localPath,
                              assetId: asset.id,
                              plantId,
                            };
                          } else {
                            console.warn(`Descarga fallida para ${imageUrl}: status ${result.statusCode}`);
                            return null;
                          }
                        })
                        .catch((error) => {
                          console.error(`Error al guardar la imagen: ${imageUrl}`, error);
                          return null;
                        });
                  });

                  return Promise.all(imagesPromises);
                });

                return Promise.all(assetsPromises).then((assetsData) => {
                  console.log(plants);
                  insertPlantWithAll(database, plants)
                      // AsyncStorage.setItem('plants', JSON.stringify(plants))
                      .then(() => {

                        console.log('Plantas guardadas en el dispositivo');
                        return {
                          plantId,
                          assets: assetsData,
                        };
                      }).catch(error => {
                    console.error('Error guardando plantas:', error);
                    return null;
                  })
                  ;
                }); // Esperar todos los assets y organizarlos
              })
          );

          Promise.all(plantsPromises)
              .then((plantsData) => {
                console.log('Datos de plantas guardados localmente:', plantsData);

              })
              .catch((error) => {
                console.error('Error al procesar las plantas:', error);
              })
              .finally(() => {
                setLoadingDownload(false); // Desactivar loading
              });
        });

  };

  const handleAccountSelect = (account: any) => {
    setSearchAccountId(account.id);
    setDescriptionAccount(account.description);
  };

  const goToEditPlant = (itemId: number) => {
    setLoading(true);
    getDetailPlant(itemId)
      .then((data) => {
        navigation.navigate('plantEditScreen', {
          params: {
            plant: data,
          },
        });
        console.log(data);
      })
      .catch((error) => {
        console.error('Error fetching filtered data:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const renderItem = useCallback(
    ({ item, index }: { item: any; index: number }) => (
      <View
        style={[
          styles.accountItem,
          isDarkMode ? styles.darkItem : styles.lightItem,
        ]}
      >
        <Text
          style={[
            styles.accountText,
            isDarkMode ? styles.darkText : styles.lightText,
          ]}
        >
          {(currentPage - 1) * 10 + index + 1}
        </Text>
        <View style={styles.accountDetails}>
          <Text
            style={[
              styles.shortName,
              isDarkMode ? styles.darkText : styles.lightText,
            ]}
          >
            {item.code}
          </Text>
          <Text
            style={[
              styles.description,
              isDarkMode ? styles.darkDescription : styles.lightDescription,
            ]}
          >
            {item.description}
          </Text>
        </View>
        <View style={styles.accountDetails}>
          {type != 'modal' && !isSelectMode ? (
            <View style={styles.buttonIconContainer}>
              <TouchableOpacity
                style={styles.buttonIcon}
                onPress={() => goToChild(item)}
              >
                <SystemIcon
                  color={isDarkMode ? '#ffa500' : '#007bff'}
                  width={22}
                  height={22}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.buttonIcon}>
                <LocationIcon
                  color={isDarkMode ? '#ffa500' : '#007bff'}
                  width={22}
                  height={22}
                />
              </TouchableOpacity>
            </View>
          ) : (
            !isSelectMode ? (<View>
              <TouchableOpacity
                style={styles.buttonIcon}
                onPress={() => selectPlant(item)}
              >
                {isDarkMode ? (
                  <SelectDarkIcon width={22} height={22} />
                ) : (
                  <SelectIcon width={22} height={22} />
                )}
              </TouchableOpacity>
            </View>) : (<TouchableOpacity
                onPress={() => toggleItemSelection(item.id)}
            >
              <CheckBox
                  disabled={true}
                  value={selectedItems.includes(item.id)}
                  onValueChange={(newValue) => toggleItemSelection(item.id)}
                  tintColors={{ true: '#516091', false: '#516091' }}
              />

            </TouchableOpacity>)
          )}
          {type != 'modal' && !isSelectMode ? (
            <View style={styles.buttonIconCrudContainer}>
              <TouchableOpacity
                style={styles.buttonIcon}
                onPress={() => goToDetail(item.id)}
              >
                <ViewIcon
                  color={isDarkMode ? '#ffa500' : '#007bff'}
                  width={22}
                  height={22}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.buttonIcon}
                onPress={() => goToEditPlant(item.id)}
              >
                <EditIcon
                  color={isDarkMode ? '#ffa500' : '#007bff'}
                  width={22}
                  height={22}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.buttonIcon}
                onPress={() => showModalDeleting(item)}
              >
                <DeleteIcon
                  color={isDarkMode ? '#ffa500' : '#007bff'}
                  width={22}
                  height={22}
                />
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </View>
    ),
    [currentPage, isDarkMode, isSelectMode, selectedItems]
  );

  return (
    <View
      style={[
        styles.container,
        isDarkMode ? styles.darkMode : styles.lightMode,
      ]}
    >
      <Modal
        animationType="slide"
        transparent={true}
        visible={successModalVisible}
        onRequestClose={() => setSuccessModalVisible(false)}
      >
        <View style={styles.successModalContainer}>
          <View style={styles.successModalView}>
            <Text style={styles.successModalText}>
              Item deleted successfully!
            </Text>
            <View style={styles.successModalButtonsContainer}>
              <TouchableOpacity
                style={styles.successModalButton}
                onPress={() => setSuccessModalVisible(false)}
              >
                <Text style={styles.successModalButtonText}>Ok</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal animationType="fade" transparent={true} visible={loadingDelete}>
        <View style={styles.loadingModalContainer}>
          <View style={styles.loadingModalView}>
            <ActivityIndicator size="large" color="#007bff" />
            <Text style={styles.loadingModalText}>Deleting...</Text>
          </View>
        </View>
      </Modal>

      <Modal animationType="fade" transparent={true} visible={loadingDownload}>
        <View style={styles.loadingModalContainer}>
          <View style={styles.loadingModalView}>
            <ActivityIndicator size="large" color="#007bff" />
            <Text style={styles.loadingModalText}>Downloading plants...</Text>
          </View>
        </View>
      </Modal>

      <AccountListModal
        visible={modalAccountVisible}
        onClose={() => setModalAccountVisible(false)}
        onSelectAccount={handleAccountSelect}
      />

      {(!isSelectMode ? (<View style={styles.headerContainer}>
        <TouchableOpacity
          style={isDarkMode ? styles.createButtonDark : styles.createButton}
          onPress={() => navigation.navigate('plantCreateScreen')}
        >
          <Icon
            name="plus"
            size={16}
            style={styles.filterButtonIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterModalVisible(true)}
        >

          <Icon
            name="filter"
            size={16}
            style={styles.filterButtonIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setIsSelectMode(true)}
        >

          <Icon
            name="download"
            size={16}
            style={styles.filterButtonIcon}
          />
        </TouchableOpacity>
      </View>) :
      (<View style={styles.headerContainer}>
        <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setFilterModalVisible(true)}
        >

          <Icon
              name="filter"
              size={16}
              style={styles.filterButtonIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, styles.confirmDownloadButton]}
          onPress={() => downloadPlants()}
        >

          <Icon
            name="download"
            size={16}
            style={[styles.filterButtonIcon]}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, styles.cancelButton]}
          onPress={() => cancelSelectMode()}
        >

          <Icon
            name="ban"
            size={16}
            style={styles.filterButtonIcon}
          />
        </TouchableOpacity>
      </View>))}



      <View style={styles.pillsContainer}>
        {id ? (
          <View style={styles.pill}>
            <Text style={styles.pillText}>ID: {id}</Text>
            <TouchableOpacity onPress={() => clearCode()}>
              <Icon name="times" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : null}
        {description ? (
          <View style={styles.pill}>
            <Text style={styles.pillText}>Description: {description}</Text>
            <TouchableOpacity onPress={() => clearDescription()}>
              <Icon name="times" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : null}
        {accountId ? (
          <View style={styles.pill}>
            <Text style={styles.pillText}>Account: {descriptionAccount}</Text>
            <TouchableOpacity onPress={() => clearAccountId()}>
              <Icon name="times" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={filterModalVisible}
        onRequestClose={() => {
          setFilterModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalView,
              isDarkMode ? styles.darkModal : styles.lightModal,
            ]}
          >
            <Text style={styles.modalTitle}>Filters</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Id"
              placeholderTextColor={isDarkMode ? '#aaa' : '#555'}
              value={searchId}
              onChangeText={setSearchId}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Description"
              placeholderTextColor={isDarkMode ? '#aaa' : '#555'}
              value={searchDescription}
              onChangeText={setSearchDescription}
            />

            <View style={styles.modalButtonsContainer}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setFilterModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.applyButton]}
                onPress={searchFromModal}
              >
                <Text style={styles.modalButtonText}>Apply</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={isDarkMode ? '#ffa500' : '#007bff'}
          />
          <Text style={styles.loadingText}>Loading plants...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPlants}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          initialNumToRender={10}
          windowSize={5}
          maxToRenderPerBatch={10}
          style={styles.list}
        />
      )}

      <View style={styles.paginationContainer}>
        <Text
          style={isDarkMode ? styles.paginationInfoDark : styles.paginationInfo}
        >
          {totalResults === 0
            ? '0'
            : `${(currentPage - 1) * 10 + 1}-${Math.min(
                currentPage * 10,
                totalResults
              )}`}{' '}
          of {totalResults} items
        </Text>
        <TouchableOpacity style={styles.paginationButton}>
          <Text style={styles.paginationButtonText}>{currentPage}</Text>
        </TouchableOpacity>
        <Text
          style={isDarkMode ? styles.paginationInfoDark : styles.paginationInfo}
        >
          of {totalResults > 0 ? Math.ceil(totalResults / 10) : 1} pages
        </Text>
        <TouchableOpacity
          style={styles.paginationArrowButton}
          onPress={prevPage}
        >
          <Icon
            name="chevron-left"
            size={20}
            color={isDarkMode ? '#ffa500' : '#007bff'}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.paginationArrowButton}
          onPress={nextPage}
        >
          <Icon
            name="chevron-right"
            size={20}
            color={isDarkMode ? '#ffa500' : '#007bff'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  lightMode: {
    backgroundColor: '#f5f5f5',
  },
  darkMode: {
    backgroundColor: '#1f1f1f',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  inputContainer: {
    marginBottom: 15,
    width: '100%',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  searchContainer: {
    flexDirection: 'row',
  },
  buttonSearchContainer: {
    backgroundColor: '#007bff',
    marginLeft: 5,
    borderRadius: 8,
    height: 40,
  },
  inputSearch: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    flex: 1,
  },
  lightInput: {
    backgroundColor: '#fff',
    color: '#000',
  },
  darkInput: {
    backgroundColor: '#333',
    color: '#ffa500',
  },
  icon: {
    paddingHorizontal: 7,
    paddingVertical: 8,
    color: '#fff',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    marginRight: 10,
  },

  confirmDownloadButton: {
    backgroundColor: '#38be26',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e45835',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    marginRight: 10,
  },
  filterButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginRight: 5,
    fontSize: 16,
  },
  filterButtonIcon: {
    color: '#fff',
  },
  createButton: {
    alignSelf: 'center',
    backgroundColor: '#007bff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    marginRight: 10,
  },
  createButtonDark: {
    alignSelf: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 10,
    marginBottom: 10,
  },
  pillText: {
    color: '#fff',
    marginRight: 5,
  },
  searchInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
    width: '100%',
  },
  searchInputEntity: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: 350,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  darkModal: {
    backgroundColor: '#333',
  },
  lightModal: {
    backgroundColor: '#fff',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    elevation: 2,
    marginHorizontal: 10,
  },
  applyButton: {
    backgroundColor: '#007bff',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  lightItem: {
    backgroundColor: '#f5f5f5',
  },
  darkItem: {
    // backgroundColor: '#333',
  },
  accountText: {
    width: 30,
    fontWeight: 'bold',
  },
  accountDetails: {
    flex: 1,
    paddingLeft: 10,
  },
  shortName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  lightText: {
    color: '#000',
  },
  darkText: {
    color: '#ffa500',
  },
  lightDescription: {
    fontSize: 14,
    color: '#888',
  },
  darkDescription: {
    fontSize: 14,
    color: '#ccc',
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: '#ddd',
  },
  paginationText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  paginationButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#007bff',
    borderRadius: 5,
    marginHorizontal: 5,
  },
  paginationButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  paginationInfo: {
    fontSize: 14,
    marginHorizontal: 5,
  },
  paginationInfoDark: {
    fontSize: 14,
    marginHorizontal: 5,
    color: '#fff',
  },
  paginationArrowButton: {
    padding: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#007bff',
    fontWeight: 'bold',
  },
  buttonIcon: {
    marginRight: 14,
  },
  buttonIconContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginRight: 15,
    paddingLeft: 20,
  },
  buttonIconCrudContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginRight: 15,
    marginTop: 10,
    paddingLeft: 20,
  },
  description: {
    fontSize: 14,
    color: '#555',
  },
  modalContainer: {
    width: 300,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 5,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#ff4d4d',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loadingModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  loadingModalView: {
    width: 200,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  loadingModalText: {
    marginTop: 10,
    fontSize: 16,
    color: '#007bff',
    fontWeight: 'bold',
  },
  successModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  successModalView: {
    width: 300,
    padding: 30,
    backgroundColor: 'white',
    borderRadius: 15,
    alignItems: 'center',
  },
  successModalText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 20,
  },
  successModalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  successModalButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    marginHorizontal: 10,
  },
  successModalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
