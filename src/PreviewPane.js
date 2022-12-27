import React, { Component } from 'react'

class PreviewPane extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dimensions: {},
      imgURL: null,
      previewImage: false,
      timeoutId: null
    };
    // this.onImgLoad = this.onImgLoad.bind(this);
  }

  componentDidMount() {
    this.props.setPreviewPaneCanvas(this.side_canvas);
  }

  componentDidUpdate(prevProps) {
    if (this.props.hover_index !== prevProps.hover_index) {
      this.setState({ previewImage: false });
      clearTimeout(this.state.timeoutId);
      const timeoutId = setTimeout(() => {
        this.setState({ previewImage: true });
      }, 100);
      this.setState({ timeoutId });
    }
  }

  render() {
    let {
      previewPane_image_size,
    } = this.props;
    // const {width, height} = this.state.dimensions;
    // var imgWidth = "auto";
    // var imgHeight = "100%";
    // if (width >= height) {
    //   imgWidth = "100%";
    //   imgHeight = "auto"
    // };

    return (
      <div>
      <div style={{position: "absolute", width: previewPane_image_size, height: previewPane_image_size, textAlign: "center"}}>
        <span style={{display: "inline-block", height: "100%", verticalAlign: "middle"}}/>

      {this.state.previewImage === true ? this.props.setPreviewImage() : null}
      
      </div>
        <canvas 
          ref={side_canvas => {
            this.side_canvas = side_canvas
          }}
          width={previewPane_image_size}
          height={previewPane_image_size}
        />
      </div>
    )
  }
}
export default React.memo(PreviewPane)
