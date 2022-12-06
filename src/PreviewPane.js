import React, { Component } from 'react'

class PreviewPane extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dimensions: {},
      imgURL: null
    };
    this.onImgLoad = this.onImgLoad.bind(this);
  }

  componentDidMount() {
    this.props.setPreviewPaneCanvas(this.side_canvas);
  }

  onImgLoad({target:img}) {
    this.setState({dimensions:{height:img.offsetHeight,
                               width:img.offsetWidth}});
  }

  componentWillUpdate(nextState) {
    if( this.state.imgURL !== nextState.prevURL ) {
      if(this.state.imgURL !== null){
        this.setState({ imgURL: null });
      }
      if( this.textTimer ) clearTimeout(this.textTimer)
      this.textTimer = setTimeout(() => {
        this.setState({ imgURL: nextState.prevURL });
      }, 10)
    }
  }

  render() {
    let {
      previewPane_image_size,
    } = this.props;
    const {width, height} = this.state.dimensions;
    var imgWidth = "auto";
    var imgHeight = "100%";
    if (width >= height) {
      imgWidth = "100%";
      imgHeight = "auto"
    };

    return (
      <div>
      <div style={{position: "absolute", width: previewPane_image_size, height: previewPane_image_size, textAlign: "center"}}>
        <span style={{display: "inline-block", height: "100%", verticalAlign: "middle"}}/>
          <img
            src={this.state.imgURL}
            onLoad={this.onImgLoad}
            alt=""
            style={{
            verticalAlign: "middle",
            width: imgWidth,
            height: imgHeight,
          }}
          />
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
