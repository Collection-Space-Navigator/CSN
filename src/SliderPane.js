import React, { Component } from 'react'
import Sliders from "./Sliders/Sliders";

class SliderPane extends Component {
  constructor(props) {
    super(props);
    this.sliderReset = this.sliderReset.bind(this);
  }

  sliderReset() {
    console.log("reset range sliders");
  }

  render() {
    let {
      metadata,
      hover_index,
    } = this.props;

    return (
      <Sliders
        metadata={metadata}
        settings={this.props.settings}
        hover_index={hover_index}
        barData={this.props.barData}
        filterImageAr={this.props.filterImageAr}
        calculateProjection={this.props.calculateProjection}
        currentProjection={this.props.currentProjection}
      />
    )
  }
}

export default React.memo(SliderPane)