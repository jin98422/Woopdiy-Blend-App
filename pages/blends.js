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
  Frame,
  Toast,
  Button
} from "@shopify/polaris";
import { DeleteMajorMonotone, EditMajorMonotone } from "@shopify/polaris-icons";

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      listItemCount: 0,
      imageListItems: [],
      selectedListItems: [],
      loading: false,
      ids: [],
      activeDeleteModal: false,
      toast: false,
      toastContent: "",
      activeMulti: false,
    };
  }

  async componentDidMount() {
    this.getList();
  }

  getList = async () => {
    try {
      let response = await axios.get("https://" + host + "/merged");
      console.log(response.data)
      let allImageData = response.data;
      let imageListItemsData = [];
      for (let i in allImageData) {
        let item = allImageData[i];
        imageListItemsData.push({
          id: item._id,
          fullname: item.first_name + " " + item.last_name,
          email: item.email,
          blendName: item.blendName,
          category: item.category,
          font: item.font,
          color: item.color,
          rate: item.rate,
          created: item.createdAt,
          media: <Thumbnail source={item.filepath} alt={item.blendName} />
        });
      }
      this.setState({ imageListItems: imageListItemsData });
      this.setState({ listItemCount: imageListItemsData.length });
    } catch (error) {
      console.log(error);
    }
  };

 deleteMultiBlend = () => {
    this.setState({
        ids: this.state.selectedItems,
        activeDeleteModal: true
    });
 }

  setSelectedItems = (items) => {
    console.log(items);
    if(items.length !== 0) {
        this.setState({activeMulti: true})
    } else {
        this.setState({activeMulti: false})
    }
    this.setState({selectedItems: items})
  }

  deleteImage = (id) => {
    this.setState({
      ids: [id],
      activeDeleteModal: true
    });
    console.log(id);
  }

  confirmDelete = async () => {
    this.setState({ loading: true });
    console.log(this.state.ids)
    await axios.post(
      `https://${host}/blend/deleteBlend`, {
          ids: this.state.ids
      }
    ).then(res => {
        if (res.data.status === "deleted") {
            this.setState({ 
              loading: false,
              toast: true,
              activeDeleteModal: false,
              toastContent: "Blend Deleted"
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
    }).catch(err => {
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
    })
  };

  toastAction = () => {
    this.setState({
      toast: false
    })
  }

  render() {
    const toastMarkup = this.state.toast ? (
      <Toast content={this.state.toastContent} onDismiss={this.toastAction} />
    ) : null;

    const multiDelete = this.state.activeMulti && (<Button primary={true} onClick={this.deleteMultiBlend}>Delete Selected Blends</Button>);

    return (
      <div>
        <Layout>
          <Layout.Section>
            <Card
                title="All Blend Data"
            >
              <Card.Section>
                <TextStyle variation="subdued">
                  {this.state.listItemCount} Blends
                </TextStyle>
                {multiDelete}
              </Card.Section>
              <Card.Section>
                <ResourceList
                    resourceName={{ singular: "image", plural: "images" }}
                    items={this.state.imageListItems}
                    selectedItems={this.state.selectedItems}
                    onSelectionChange={this.setSelectedItems}
                    selectable
                    renderItem={item => {
                    const { id, blendName, fullname, email, category, font, color, rate, created, media } = item;
                    const shortcutActions = [
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
                        accessibilityLabel={`View details for ${blendName}`}
                        shortcutActions={shortcutActions}
                        persistActions
                      >
                        <h3>
                          <TextStyle variation="strong">
                            <span style={{ fontSize: 12 }}>Blend Name: </span>
                            {blendName}
                          </TextStyle>
                        </h3>
                        <h3>
                          <TextStyle variation="strong">
                            <span style={{ fontSize: 12 }}>Full Name: </span>
                            {fullname}
                          </TextStyle>
                        </h3>
                        <h3>
                          <TextStyle variation="strong">
                            <span style={{ fontSize: 12 }}>Email: </span>
                            {email}
                          </TextStyle>
                        </h3>
                        <h3>
                          <TextStyle variation="strong">
                            <span style={{ fontSize: 12 }}>Category: </span>
                            {category}
                          </TextStyle>
                        </h3>
                        <h3>
                          <TextStyle variation="strong">
                            <span style={{ fontSize: 12 }}>Font: </span>
                            {font}
                          </TextStyle>
                        </h3>
                        <h3>
                          <TextStyle variation="strong">
                            <span style={{ fontSize: 12 }}>Color: </span>
                            {color}
                          </TextStyle>
                        </h3>
                        <h3>
                          <TextStyle variation="strong">
                            <span style={{ fontSize: 12 }}>Rate: </span>
                            {rate}
                          </TextStyle>
                        </h3>
                        <h3>
                          <TextStyle variation="strong">
                            <span style={{ fontSize: 12 }}>createdAt: </span>
                            {created}
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
