import React from "react";
import axios from "axios";
import {
  Layout,
  Card,
  ResourceList,
  TextStyle,
  Icon,
  Thumbnail,
  Modal,
  Stack,
  DropZone,
  InlineError,
  TextField,
  Autocomplete,
  Frame,
  Toast
} from "@shopify/polaris";
import { DeleteMajorMonotone, EditMajorMonotone } from "@shopify/polaris-icons";

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.addNewImage = this.addNewImage.bind(this);
    this.setSelectedListItems = this.setSelectedListItems.bind(this);
    this.editImage = this.editImage.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.deleteImage = this.deleteImage.bind(this);
    this.handleDropZoneDrop = this.handleDropZoneDrop.bind(this);
    this.toggleOpenFileDialog = this.toggleOpenFileDialog.bind(this);
    this.updateImageName = this.updateImageName.bind(this);
    this.updateCategoryOptions = this.updateCategoryOptions.bind(this);
    this.updateCategoryName = this.updateCategoryName.bind(this);
    this.handleAddImages = this.handleAddImages.bind(this);
    this.handleEditImages = this.handleEditImages.bind(this);
    this.state = {
      allImageData: [],
      listItemCount: 0,
      imageListItems: [],
      selectedListItems: [],
      activeModal: false,
      modalAction: {},
      loading: false,
      file: null,
      validImageTypes: ["image/gif", "image/jpeg", "image/png"],
      openFileDialog: false,
      fileUpload: "",
      uploadedFile: "",
      fileError: "",
      imageNameError: "",
      imageCategoryError: "",
      imageName: "",
      categoryInitOptions: [],
      categoryOptions: [],
      categorySelectedOptions: [],
      categoryTextField: "",
      categoryValue: "",
      id: "",
      fileURL: "",
      fileFlag: false,
      nameFlag: false,
      categoryFlag: false,
      activeDeleteModal: false,
      toast: false,
      toastContent: ""
    };
  }

  async componentDidMount() {
    this.getList();
  }

  getList = async () => {
    try {
      let response = await axios.get("https://" + host + "/background");
      console.log(response.data)
      this.setState({ allImageData: response.data });
      let allImageData = response.data;
      let allCategorys = [];
      for (let i in allImageData) {
        allCategorys.push(allImageData[i].category);
      }
      let filterCategory = allCategorys.filter(function(elem, index, self) {
        return index === self.indexOf(elem);
      });
      let categoryArray = [];
      for (let i in filterCategory) {
        let item = filterCategory[i];
        categoryArray.push({
          value: item,
          label: item
        });
      }
      this.setState({
        categoryInitOptions: categoryArray,
        categoryOptions: categoryArray
      });
      let imageListItemsData = [];
      for (let i in allImageData) {
        let item = allImageData[i];
        imageListItemsData.push({
          id: item._id,
          name: item.filename,
          category: item.category,
          media: <Thumbnail source={item.filepath} alt={item.filename} />
        });
      }
      this.setState({ imageListItems: imageListItemsData });
      this.setState({ listItemCount: imageListItemsData.length });
    } catch (error) {
      console.log(error);
    }
  };

  addNewImage() {
    this.setState({
      activeModal: true,
      file: null,
      fileURL: "",
      imageName: "",
      categoryValue: "",
      fileError: "",
      imageNameError: "",
      imageCategoryError: "",
      modalAction: {
        content: "Add",
        onAction: this.handleAddImages
      }
    });
  }

  setSelectedListItems(items) {
    console.log(items);
  }

  editImage(id, name, media, category) {
    console.log(id, name, media, category);
    this.setState({
      modalAction: {
        content: "Save",
        onAction: this.handleEditImages
      },
      fileError: "",
      imageNameError: "",
      imageCategoryError: "",
      id: id,
      imageName: name,
      file: null,
      fileURL: media.props.source,
      categoryValue: category,
      activeModal: true,
      fileFlag: false,
      nameFlag: false,
      categoryFlag: false
    });
  }

  deleteImage(id) {
    this.setState({
      id: id,
      activeDeleteModal: true
    });
    console.log(id);
  }

  confirmDelete = async () => {
    this.setState({ loading: true });
    let res = await axios.get(
      `https://${host}/background/deleteImage?id=${this.state.id}`
    );
    console.log(res.data);
    if (res.data.status === "deleted") {
      this.setState({ 
        loading: false,
        toast: true,
        activeDeleteModal: false,
        toastContent: "Image Deleted"
      });
      setTimeout(() => {
        this.setState({
          toast: false
        })
      }, 1500);
      this.getList();      
    } else {
      this.setState({ 
        loading: false,
        activeDeleteModal: false,
        toast: true,
        toastContent: "Image Delete Failed, try again"
      });
      setTimeout(() => {
        this.setState({
          toast: false
        })
      }, 1500);
    }
  };

  closeModal() {
    this.setState({ activeModal: false });
  }

  handleDropZoneDrop(_dropFiles, acceptedFiles, _rejectedFiles) {
    this.setState({
      file: acceptedFiles[0],
      fileError: "",
      fileFlag: true,
      fileURL: ""
    });
  }

  toggleOpenFileDialog() {
    this.setState({ openFileDialog: !this.state.openFileDialog });
    console.log("toggle");
  }

  updateImageName(value) {
    this.setState({
      imageName: value,
      imageNameError: "",
      nameFlag: true
    });
  }

  updateCategoryOptions(selected) {
    const selectedValue = selected.map(selectedItem => {
      const matchedOption = this.state.categoryOptions.find(option => {
        return option.value.match(selectedItem);
      });
      return matchedOption && matchedOption.label;
    });
    this.setState({ categorySelectedOptions: [] });
    this.updateCategoryName(selectedValue[0]);
  }

  updateCategoryName(value) {
    this.setState({
      categoryValue: value,
      imageCategoryError: "",
      categoryFlag: true
    });
    if (this.state.categoryValue === "") {
      this.setState({ categorySelectedOptions: this.state.categoryOptions });
    }

    const filterRegex = new RegExp(value, "i");
    const resultOptions = this.state.categoryInitOptions.filter(option =>
      option.label.match(filterRegex)
    );
    this.setState({ categoryOptions: resultOptions });
  }

  handleAddImages() {
    console.log(
      this.state.file,
      this.state.imageName,
      this.state.categoryValue
    );
    if (
      this.state.file === null &&
      this.state.imageName === "" &&
      this.state.categoryValue === ""
    ) {
      this.setState({
        fileError: "Need Image",
        imageNameError: "Need Image Name",
        imageCategoryError: "Need Category"
      });
      return;
    } else if (this.state.file === null && this.state.imageName === "") {
      this.setState({
        fileError: "Need Image",
        imageNameError: "Need Image Name"
      });
      return;
    } else if (this.state.file === null && this.state.categoryValue === "") {
      this.setState({
        fileError: "Need Image",
        imageCategoryError: "Need Category"
      });
      return;
    } else if (this.state.imageName === "" && this.state.categoryValue === "") {
      this.setState({
        imageNameError: "Need Image Name",
        imageCategoryError: "Need Category"
      });
      return;
    } else if (this.state.file === null) {
      this.setState({
        fileError: "Need Image"
      });
      return;
    } else if (this.state.imageName === "") {
      this.setState({
        imageNameError: "Need Image Name"
      });
      return;
    } else if (this.state.categoryValue === "") {
      this.setState({
        imageCategoryError: "Need Category"
      });
      return;
    }
    for (let i in this.state.allImageData) {
      let item = this.state.allImageData[i];
      if (item.filename === this.state.imageName) {
        this.setState({
          imageNameError: "Image Name Exist"
        });
        return;
      }
    }
    this.setState({ loading: true });
    let formdata = new FormData();
    formdata.append("file", this.state.file);
    formdata.append("filename", this.state.imageName);
    formdata.append("category", this.state.categoryValue);
    axios
      .post("https://" + host + "/background", formdata, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      })
      .then(res => {
        if (res.data.status === "save") {
          this.setState({
            activeModal: false, 
            loading: false,
            toast: true,
            toastContent: "Image Saved"
          });
          setTimeout(() => {
            this.setState({
              toast: false
            })
          }, 1500);
          this.getList();      
        } else {
          this.setState({ 
            loading: false,
            toast: true,
            toastContent: "Image Save Failed, try again"
          });
          setTimeout(() => {
            this.setState({
              toast: false
            })
          }, 1500);
        }
      }).catch(err => {
        this.setState({ 
          loading: false,
          toast: true,
          toastContent: "Image Save Failed, try again"
        });
        setTimeout(() => {
          this.setState({
            toast: false
          })
        }, 1500);
      })
  }

  handleEditImages() {
    console.log(
      this.state.file,
      this.state.imageName,
      this.state.categoryValue
    );
    if (this.state.imageName === "" && this.state.categoryValue === "") {
      this.setState({
        imageNameError: "Need Image Name",
        imageCategoryError: "Need Category"
      });
      return;
    } else if (this.state.imageName === "") {
      this.setState({
        imageNameError: "Need Image Name"
      });
      return;
    } else if (this.state.categoryValue === "") {
      this.setState({
        imageCategoryError: "Need Category"
      });
      return;
    }
    for (let i in this.state.allImageData) {
      let item = this.state.allImageData[i];
      if (item.filename === this.state.imageName) {
        if (this.state.nameFlag) {
          this.setState({
            imageNameError: "Image Name Exist"
          });
          return;
        }
      }
    }
    if (!this.state.fileFlag && !this.state.nameFlag && !this.state.categoryFlag) {
      this.setState({ activeModal: false });
      return;
    }

    if (this.state.fileFlag) {
      this.setState({ loading: true });
      let formdata = new FormData();
      formdata.append("file", this.state.file);
      formdata.append("filename", this.state.imageName);
      formdata.append("category", this.state.categoryValue);
      formdata.append("id", this.state.id);
      axios
        .post("https://" + host + "/background", formdata, {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        })
        .then(res => {
          if (res.data.status === "save") {
            this.setState({
              activeModal: false,
              loading: false,
              toast: true,
              toastContent: "Image Saved"
            });
            setTimeout(() => {
              this.setState({
                toast: false
              })
            }, 1500);
            this.getList();         
          } else {
            this.setState({ 
              loading: false,
              toast: true,
              toastContent: "Image Save Failed, try again"
            });
            setTimeout(() => {
              this.setState({
                toast: false
              })
            }, 1500);
          }
        }).catch(err => {
          this.setState({ 
            loading: false,
            toast: true,
            toastContent: "Image Save Failed, try again"
          });
          setTimeout(() => {
            this.setState({
              toast: false
            })
          }, 1500);
        })
    } else {     
      this.setState({ loading: true });
      let formdata = {
        id: this.state.id,
        filename: this.state.imageName,
        category: this.state.categoryValue
      };
      axios
        .post("https://" + host + "/background/editWithoutFile", {
          data: formdata
        })
        .then(res => {
          if (res.data.status === "save") {
            this.setState({
              activeModal: false,
              loading: false,
              toast: true,
              toastContent: "Data Saved"
            });
            setTimeout(() => {
              this.setState({
                toast: false
              })
            }, 1500);
            this.getList();         
          } else {
            this.setState({ 
              loading: false,
              toast: true,
              toastContent: "Data Save Failed, try again"
            });
            setTimeout(() => {
              this.setState({
                toast: false
              })
            }, 1500);
          }
        }).catch(err => {
          this.setState({ 
            loading: false,
            toast: true,
            toastContent: "Data Save Failed, try again"
          });
          setTimeout(() => {
            this.setState({
              toast: false
            })
          }, 1500);
        })     
    }
  }

  toastAction = () => {
    this.setState({
      toast: false
    })
  }

  render() {
    const categoryTextField = (
      <Autocomplete.TextField
        onChange={this.updateCategoryName}
        label="Image Category"
        value={this.state.categoryValue}
        placeholder="Enter category"
        error={this.state.imageCategoryError}
      />
    );
    const fileUpload =
      this.state.fileURL === "" ? (
        !this.state.file && <DropZone.FileUpload />
      ) : (
        <Stack>
          <Thumbnail size="large" alt="edit" source={this.state.fileURL} />
        </Stack>
      );

    const uploadedFile = this.state.file && (
      <Stack>
        <Thumbnail
          size="large"
          alt={this.state.file.name}
          source={
            this.state.validImageTypes.indexOf(this.state.file.type) > 0
              ? window.URL.createObjectURL(this.state.file)
              : "https://cdn.shopify.com/s/files/1/0757/9955/files/New_Post.png?12678548500147524304"
          }
        />
      </Stack>
    );

    const toastMarkup = this.state.toast ? (
      <Toast content={this.state.toastContent} onDismiss={this.toastAction} />
    ) : null;

    return (
      <div>
        <Layout>
          <Layout.Section>
            <Card
              title="Background Images"
              actions={[
                {
                  content: "Add Background Image",
                  onAction: this.addNewImage
                }
              ]}
            >
              <Card.Section>
                <TextStyle variation="subdued">
                  {this.state.listItemCount} Background Images
                </TextStyle>
              </Card.Section>
              <Card.Section>
                <ResourceList
                  resourceName={{ singular: "image", plural: "images" }}
                  items={this.state.imageListItems}
                  selectedItems={this.state.selectedListItems}
                  onSelectionChange={this.setSelectedListItems}
                  renderItem={item => {
                    const { id, name, media, category } = item;
                    const shortcutActions = [
                      {
                        content: (
                          <Icon source={EditMajorMonotone} color="red" />
                        ),
                        onAction: () =>
                          this.editImage(id, name, media, category)
                      },
                      {
                        content: (
                          <Icon source={DeleteMajorMonotone} color="red" />
                        ),
                        onAction: () => this.deleteImage(id)
                      }
                    ];

                    return (
                      <ResourceList.Item
                        id={id}
                        media={media}
                        accessibilityLabel={`View details for ${name}`}
                        shortcutActions={shortcutActions}
                        persistActions
                      >
                        <h3>
                          <TextStyle variation="strong">
                            <span style={{ fontSize: 12 }}>Name: </span>
                            {name}
                          </TextStyle>
                        </h3>
                        <h3>
                          <TextStyle variation="strong">
                            <span style={{ fontSize: 12 }}>Category: </span>
                            {category}
                          </TextStyle>
                        </h3>
                      </ResourceList.Item>
                    );
                  }}
                />
              </Card.Section>
            </Card>
          </Layout.Section>
        </Layout>
        <Modal
          open={this.state.activeModal}
          onClose={this.closeModal}
          title="Add Image"
          primaryAction={this.state.modalAction}
          style={{ padding: "20px" }}
          loading={this.state.loading}
        >
          <Modal.Section>
            <Stack alignment="center">
              <Stack.Item>
                <div style={{ width: 100, height: 100 }}>
                  <DropZone
                    openFileDialog={this.state.openFileDialog}
                    onDrop={this.handleDropZoneDrop}
                    onFileDialogClose={this.toggleOpenFileDialog}
                  >
                    {fileUpload}
                    {uploadedFile}
                  </DropZone>
                  <InlineError message={this.state.fileError} />
                </div>
              </Stack.Item>
              <Stack.Item>
                <TextField
                  label="Image Name"
                  value={this.state.imageName}
                  onChange={this.updateImageName}
                  placeholder="Enter image name"
                  error={this.state.imageNameError}
                />
              </Stack.Item>
              <Stack.Item>
                <Autocomplete
                  options={this.state.categoryOptions}
                  selected={this.state.categorySelectedOptions}
                  onSelect={this.updateCategoryOptions}
                  textField={categoryTextField}
                />
              </Stack.Item>
            </Stack>
          </Modal.Section>
        </Modal>
        <Modal
          open={this.state.activeDeleteModal}
          onClose={this.handleDeleteModalChange}
          title="Do you really want to delete?"
          loading={this.state.loading}
          primaryAction={{
            content: "Yes",
            onAction: this.confirmDelete
          }}
          secondaryActions={{
            content: "No",
            onAction: () => {
              this.setState({ activeDeleteModal: false });
            }
          }}
        />
        <Frame>
            {toastMarkup}
        </Frame>
      </div>
    );
  }
}
