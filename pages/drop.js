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
  Frame,
  Toast
} from "@shopify/polaris";
import { DeleteMajorMonotone, EditMajorMonotone } from "@shopify/polaris-icons";

export default class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      allImageData: [],
      listItemCount: 0,
      imageListItems: [],
      selectedListItems: [],
      activeModal: false,
      modalAction: {
        content: "Add",
        onAction: this.handleAddImages
      },
      loading: false,
      file: null,
      validImageTypes: ["image/gif", "image/jpeg", "image/png"],
      openFileDialog: false,
      fileUpload: "",
      uploadedFile: "",
      fileError: "",
      id: "",
      fileURL: "",
      fileFlag: false,
      oilNameFlag: false,
      popularFlag: false,
      activeDeleteModal: false,
      supplierName: "",
      oilName: "",
      oilType: "",
      functionalSub: "",
      aromaticSub: "",
      blendsWellWith: "",
      aromaticDescription: "",
      aromaType: "",
      classifications: "",
      note: "",
      supplierNameError: "",
      oilNameError: "",
      oilTypeError: "",
      functionalSubError: "",
      aromaticSubError: "",
      blendWellWithError: "",
      aromaticDescriptionError: "",
      aromaTypeError: "",
      classificationsError: "",
      noteError: ""
    };
  }

  async componentDidMount() {
    this.getList();
  }

  getList = async () => {
    try {
      let response = await axios.get("https://" + host + "/drop");
      this.setState({ allImageData: response.data });
      let allImageData = response.data;

      let imageListItemsData = [];
      for (let i in allImageData) {
        let item = allImageData[i];
        imageListItemsData.push({
          id: item._id,
          supplierName: item.supplierName,
          oilName: item.oilName,
          oilType: item.oilType,
          functionalSub: item.functionalSub,
          aromaticSub: item.aromaticSub,
          blendsWellWith: item.blendsWellWith,
          aromaticDescription: item.aromaticDescription,
          aromaType: item.aromaType,
          classifications: item.classifications,
          note: item.note,
          media: <Thumbnail source={item.filepath} alt={item.filename} />
        });
      }
      this.setState({
        imageListItems: imageListItemsData,
        listItemCount: imageListItemsData.length
      });
    } catch (error) {
      console.log(error);
    }
  };

  addNewImage = () => {
    this.setState({
      activeModal: true,
      file: null,
      fileURL: "",
      supplierName: "",
      oilName: "",
      oilType: "",
      functionalSub: "",
      aromaticSub: "",
      blendsWellWith: "",
      aromaticDescription: "",
      aromaType: "",
      classifications: "",
      note: "",
      fileError: "",
      supplierNameError: "",
      oilNameError: "",
      oilTypeError: "",
      functionalSubError: "",
      aromaticSubError: "",
      blendWellWithError: "",
      aromaticDescriptionError: "",
      aromaTypeError: "",
      classificationsError: "",
      noteError: "",
      modalAction: {
        content: "Add",
        onAction: this.handleAddImages
      },
      toast: false,
      toastContent: ""
    });
  };

  setSelectedListItems = items => {
    console.log(items);
  };

  editImage = (
    id,
    supplierName,
    media,
    oilName,
    oilType,
    functionalSub,
    aromaticSub,
    blendsWellWith,
    aromaticDescription,
    aromaType,
    classifications,
    note
  ) => {
    console.log(
      id,
      supplierName,
      media,
      oilName,
      oilType,
      functionalSub,
      aromaticSub,
      blendsWellWith,
      aromaticDescription,
      aromaType,
      classifications,
      note
    );
    this.setState({
      modalAction: {
        content: "Save",
        onAction: this.handleEditImages
      },
      fileError: "",
      supplierNameError: "",
      oilNameError: "",
      oilTypeError: "",
      functionalSubError: "",
      aromaticSubError: "",
      blendWellWithError: "",
      aromaticDescriptionError: "",
      aromaTypeError: "",
      classificationsError: "",
      noteError: "",
      id: id,
      file: null,
      fileURL: media.props.source,
      supplierName: supplierName,
      oilName: oilName,
      oilType: oilType,
      functionalSub: functionalSub,
      aromaticSub: aromaticSub,
      blendsWellWith: blendsWellWith,
      aromaticDescription: aromaticDescription,
      aromaType: aromaType,
      classifications: classifications,
      note: note,
      activeModal: true,
      fileFlag: false
    });
  };

  deleteImage = id => {
    this.setState({
      id: id,
      activeDeleteModal: true
    });
    console.log(id);
  };

  confirmDelete = async () => {
    this.setState({ loading: true });
    let res = await axios.get(
      `https://${host}/drop/deleteImage?id=${this.state.id}`
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

  closeModal = () => {
    this.setState({ activeModal: false });
  };

  handleDropZoneDrop = (_dropFiles, acceptedFiles, _rejectedFiles) => {
    this.setState({
      file: acceptedFiles[0],
      fileError: "",
      fileFlag: true,
      fileURL: ""
    });
  };

  toggleOpenFileDialog = () => {
    this.setState({ openFileDialog: !this.state.openFileDialog });
    console.log("toggle");
  };

  updateSupplierName = value => {
    if (this.state.supplierName !== value) this.setState({ popularFlag: true });
    this.setState({
      supplierName: value,
      supplierNameError: ""
    });
  };

  updateOilName = value => {
    if (this.state.oilName !== value) this.setState({ oilNameFlag: true });
    this.setState({
      oilName: value,
      oilNameError: ""
    });
  };
  updateOilType = value => {
    if (this.state.oilType !== value) this.setState({ popularFlag: true });
    this.setState({
      oilType: value,
      oilTypeError: ""
    });
  };
  updateFunctionalSub = value => {
    console.log("pre:" + this.state.functionalSub + "new:" + value);
    if (this.state.functionalSub !== value)
      this.setState({ popularFlag: true });
    this.setState({
      functionalSub: value,
      functionalSubError: ""
    });
  };
  updateAromaticSub = value => {
    if (this.state.aromaticSub !== value) this.setState({ popularFlag: true });
    this.setState({
      aromaticSub: value,
      aromaticSubError: ""
    });
  };
  updateBlendWellWith = value => {
    if (this.state.blendsWellWith !== value)
      this.setState({ popularFlag: true });
    this.setState({
      blendsWellWith: value,
      blendWellWithError: ""
    });
  };
  updateAromaticDescription = value => {
    if (this.state.aromaticDescription !== value)
      this.setState({ popularFlag: true });
    this.setState({
      aromaticDescription: value,
      aromaticDescriptionError: ""
    });
  };
  updateAromaType = value => {
    if (this.state.aromaType !== value) this.setState({ popularFlag: true });
    this.setState({
      aromaType: value,
      aromaTypeError: ""
    });
  };
  updateClassifications = value => {
    if (this.state.classifications !== value)
      this.setState({ popularFlag: true });
    this.setState({
      classifications: value,
      classificationsError: ""
    });
  };
  updateNote = value => {
    if (this.state.note !== value) this.setState({ popularFlag: true });
    this.setState({
      note: value,
      noteError: ""
    });
  };

  handleAddImages = () => {
    if (
      this.state.file === null &&
      this.state.supplierName === "" &&
      this.state.oilName === "" &&
      this.state.oilType === "" &&
      this.state.aromaType === "" &&
      this.state.classifications === "" &&
      this.state.note === ""
    ) {
      this.setState({
        fileError: "Need Image",
        supplierNameError: "Need Supplier Name",
        oilNameError: "Need Oil Name",
        oilTypeError: "Need Oil Type",
        aromaTypeError: "Need Aroma Type",
        classificationsError: "Need Classifications",
        noteError: "Need Note"
      });
      return;
    } else if (this.state.file === null) {
      this.setState({
        fileError: "Need Image"
      });
      return;
    } else if (this.state.supplierName === "") {
      this.setState({
        supplierNameError: "Need Supplier Name"
      });
      return;
    } else if (this.state.oilName === "") {
      this.setState({
        oilNameError: "Need Oil Name"
      });
      return;
    } else if (this.state.oilType === "") {
      this.setState({
        oilTypeError: "Need Oil Type"
      });
      return;
    } else if (this.state.aromaType === "") {
      this.setState({
        aromaTypeError: "Need Aroma Type"
      });
      return;
    } else if (this.state.classifications === "") {
      this.setState({
        classificationsError: "Need Classifications"
      });
      return;
    } else if (this.state.note === "") {
      this.setState({
        noteError: "Need Note"
      });
      return;
    }
    for (let i in this.state.allImageData) {
      let item = this.state.allImageData[i];
      if (item.filename === this.state.oilName) {
        this.setState({
          oilNameError: "Oil Name Exist"
        });
        return;
      }
    }

    this.setState({ loading: true });
    let formdata = new FormData();
    formdata.append("file", this.state.file);
    formdata.append("supplierName", this.state.supplierName);
    formdata.append("oilName", this.state.oilName);
    formdata.append("oilType", this.state.oilType);
    formdata.append("functionalSub", this.state.functionalSub);
    formdata.append("aromaticSub", this.state.aromaticSub);
    formdata.append("blendsWellWith", this.state.blendsWellWith);
    formdata.append("aromaticDescription", this.state.aromaticDescription);
    formdata.append("aromaType", this.state.aromaType);
    formdata.append("classifications", this.state.classifications);
    formdata.append("note", this.state.note);

    axios
      .post("https://" + host + "/drop", formdata, {
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
  };

  handleEditImages = () => {
    console.log(
      this.state.file,
      this.state.supplierName,
      this.state.oilName,
      this.state.oilType,
      this.state.functionalSub,
      this.state.aromaticSub,
      this.state.blendsWellWith,
      this.state.aromaticDescription,
      this.state.aromaType,
      this.state.classifications,
      this.state.note
    );
    if (
      this.state.file === null &&
      this.state.supplierName === "" &&
      this.state.oilName === "" &&
      this.state.oilType === "" &&
      this.state.aromaType === "" &&
      this.state.classifications === "" &&
      this.state.note === ""
    ) {
      this.setState({
        fileError: "Need Image",
        supplierNameError: "Need Supplier Name",
        oilNameError: "Need Oil Name",
        oilTypeError: "Need Oil Type",
        aromaTypeError: "Need Aroma Type",
        classificationsError: "Need Classifications",
        noteError: "Need Note"
      });
      return;
    } else if (this.state.supplierName === "") {
      this.setState({
        supplierNameError: "Need Supplier Name"
      });
      return;
    } else if (this.state.oilName === "") {
      this.setState({
        oilNameError: "Need Oil Name"
      });
      return;
    } else if (this.state.oilType === "") {
      this.setState({
        oilTypeError: "Need Oil Type"
      });
      return;
    } else if (this.state.aromaType === "") {
      this.setState({
        aromaTypeError: "Need Aroma Type"
      });
      return;
    } else if (this.state.classifications === "") {
      this.setState({
        classificationsError: "Need Classifications"
      });
      return;
    } else if (this.state.note === "") {
      this.setState({
        noteError: "Need Note"
      });
      return;
    }

    if (
      !this.state.fileFlag &&
      !this.state.oilNameFlag &&
      !this.state.popularFlag
    ) {
      this.setState({ activeModal: false });
      return;
    }

    if (this.state.fileFlag) {
      this.setState({ loading: true });
      let formdata = new FormData();
      formdata.append("file", this.state.file);
      formdata.append("supplierName", this.state.supplierName);
      formdata.append("oilName", this.state.oilName);
      formdata.append("oilType", this.state.oilType);
      formdata.append("functionalSub", this.state.functionalSub);
      formdata.append("aromaticSub", this.state.aromaticSub);
      formdata.append("blendsWellWith", this.state.blendsWellWith);
      formdata.append("aromaticDescription", this.state.aromaticDescription);
      formdata.append("aromaType", this.state.aromaType);
      formdata.append("classifications", this.state.classifications);
      formdata.append("note", this.state.note);
      formdata.append("dataID", this.state.id);
      axios
        .post("https://" + host + "/drop", formdata, {
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
      axios
        .post("https://" + host + "/drop/editWithoutFile", {
          dataID: this.state.id,
          supplierName: this.state.supplierName,
          oilName: this.state.oilName,
          oilType: this.state.oilType,
          functionalSub: this.state.functionalSub,
          aromaticSub: this.state.aromaticSub,
          blendsWellWith: this.state.blendsWellWith,
          aromaticDescription: this.state.aromaticDescription,
          aromaType: this.state.aromaType,
          classifications: this.state.classifications,
          note: this.state.note
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
  };

  toastAction = () => {
    this.setState({
      toast: false
    })
  }

  render() {
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
              title="Drop Images"
              actions={[
                {
                  content: "Add Drop Image",
                  onAction: this.addNewImage
                }
              ]}
            >
              <Card.Section>
                <TextStyle variation="subdued">
                  {this.state.listItemCount} Drop Images
                </TextStyle>
              </Card.Section>
              <Card.Section>
                <ResourceList
                  resourceName={{ singular: "image", plural: "images" }}
                  items={this.state.imageListItems}
                  selectedItems={this.state.selectedListItems}
                  onSelectionChange={this.setSelectedListItems}
                  renderItem={item => {
                    const {
                      id,
                      supplierName,
                      media,
                      oilName,
                      oilType,
                      functionalSub,
                      aromaticSub,
                      blendsWellWith,
                      aromaticDescription,
                      aromaType,
                      classifications,
                      note
                    } = item;
                    const shortcutActions = [
                      {
                        content: (
                          <Icon source={EditMajorMonotone} color="red" />
                        ),
                        onAction: () =>
                          this.editImage(
                            id,
                            supplierName,
                            media,
                            oilName,
                            oilType,
                            functionalSub,
                            aromaticSub,
                            blendsWellWith,
                            aromaticDescription,
                            aromaType,
                            classifications,
                            note
                          )
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
                            <span style={{ fontSize: 12 }}>
                              Supplier Name:{" "}
                            </span>
                            {supplierName}
                          </TextStyle>
                        </h3>
                        <h3>
                          <TextStyle variation="strong">
                            <span style={{ fontSize: 12 }}>Oil Name: </span>
                            {oilName}
                          </TextStyle>
                        </h3>
                        <h3>
                          <TextStyle variation="strong">
                            <span style={{ fontSize: 12 }}>Oil Type: </span>
                            {oilType}
                          </TextStyle>
                        </h3>
                        <h3>
                          <TextStyle variation="strong">
                            <span style={{ fontSize: 12 }}>
                              Functional Sub:{" "}
                            </span>
                            {functionalSub}
                          </TextStyle>
                        </h3>
                        <h3>
                          <TextStyle variation="strong">
                            <span style={{ fontSize: 12 }}>Aromatic Sub: </span>
                            {aromaticSub}
                          </TextStyle>
                        </h3>
                        <h3>
                          <TextStyle variation="strong">
                            <span style={{ fontSize: 12 }}>
                              Blends Well With:{" "}
                            </span>
                            {blendsWellWith}
                          </TextStyle>
                        </h3>
                        <h3>
                          <TextStyle variation="strong">
                            <span style={{ fontSize: 12 }}>
                              Aromatic Description:{" "}
                            </span>
                            {aromaticDescription}
                          </TextStyle>
                        </h3>
                        <h3>
                          <TextStyle variation="strong">
                            <span style={{ fontSize: 12 }}>Aroma Type: </span>
                            {aromaType}
                          </TextStyle>
                        </h3>
                        <h3>
                          <TextStyle variation="strong">
                            <span style={{ fontSize: 12 }}>
                              Classifications:{" "}
                            </span>
                            {classifications}
                          </TextStyle>
                        </h3>
                        <h3>
                          <TextStyle variation="strong">
                            <span style={{ fontSize: 12 }}>Note: </span>
                            {note}
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
                  label="Supplier Name"
                  value={this.state.supplierName}
                  onChange={this.updateSupplierName}
                  placeholder="Enter Supplier Name"
                  error={this.state.supplierNameError}
                />
              </Stack.Item>
              <Stack.Item>
                <TextField
                  label="Oil Name"
                  value={this.state.oilName}
                  onChange={this.updateOilName}
                  placeholder="Enter Oil Name"
                  error={this.state.oilNameError}
                />
              </Stack.Item>
              <Stack.Item>
                <TextField
                  label="Oil Type"
                  value={this.state.oilType}
                  onChange={this.updateOilType}
                  placeholder="Enter Oil Type"
                  error={this.state.oilTypeError}
                />
              </Stack.Item>
              <Stack.Item>
                <TextField
                  label="Functional Sub"
                  value={this.state.functionalSub}
                  onChange={this.updateFunctionalSub}
                  placeholder="Enter Functional Sub"
                  error={this.state.functionalSubError}
                />
              </Stack.Item>
              <Stack.Item>
                <TextField
                  label="Aromatic Sub"
                  value={this.state.aromaticSub}
                  onChange={this.updateAromaticSub}
                  placeholder="Enter Aromatic Sub"
                  error={this.state.aromaticSubError}
                />
              </Stack.Item>
              <Stack.Item>
                <TextField
                  label="Blends well with"
                  value={this.state.blendsWellWith}
                  onChange={this.updateBlendWellWith}
                  placeholder="Enter Blend well with"
                  error={this.state.blendWellWithError}
                />
              </Stack.Item>
              <Stack.Item>
                <TextField
                  label="Aromatic Descriptions"
                  value={this.state.aromaticDescription}
                  onChange={this.updateAromaticDescription}
                  placeholder="Enter Aromatic Description"
                  error={this.state.aromaticDescriptionError}
                />
              </Stack.Item>
              <Stack.Item>
                <TextField
                  label="Aroma Type"
                  value={this.state.aromaType}
                  onChange={this.updateAromaType}
                  placeholder="Enter Aroma Type"
                  error={this.state.aromaTypeError}
                />
              </Stack.Item>
              <Stack.Item>
                <TextField
                  label="Classifications"
                  value={this.state.classifications}
                  onChange={this.updateClassifications}
                  placeholder="Enter Classifications"
                  error={this.state.classificationsError}
                />
              </Stack.Item>
              <Stack.Item>
                <TextField
                  label="Note"
                  value={this.state.note}
                  onChange={this.updateNote}
                  placeholder="Enter Note"
                  error={this.state.noteError}
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
