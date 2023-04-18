import React, { Component } from 'react';
import { Grid } from "@material-ui/core";
import RangeSlider from "./RangeSlider";
//import uuid from 'react-uuid';

class Sliders extends Component {
  constructor(props) {
    super(props);

    this.changeSlider = this.changeSlider.bind(this);
    // create references for each slider
    this.slidersAr = []
    for (let element in this.props.settings.sliders) {
      this.slidersAr.push( this.props.settings.sliders[element].id );
    }
    this.refSliders = {}
    this.filterData = {}
    this.filtered = {}

    for(let i=0;i<this.slidersAr.length;i+=1){
      this.refSliders[this.slidersAr[i]] = React.createRef();
      // Initial values non filter
      let filterVals = []
      for (let element in this.props.metadata) {
        filterVals.push( this.props.metadata[element][this.slidersAr[i]] );
      }
      this.filterData[this.slidersAr[i]] = filterVals
    }
    this.state = {
      datafilter: this.filterData
    }

  }

  changeSlider(componentName, values) {
    console.log(componentName, values);
    let {
      metadata,
    } = this.props
    this.filtered[componentName] = new Float32Array( this.props.settings["total"]).fill(0)
    let filteredArr = new Float32Array( this.props.settings["total"])

    for(let element in metadata){
      if(values[0] > metadata[element][componentName] ||
          values[1] < metadata[element][componentName]
          ){
            this.filtered[componentName][element] = 1
      }
    }
    let list = Object.values(this.filtered)
    let arr = filteredArr.map((x, idx) => list.reduce((max, curr) => max + curr[idx], 0));
    this.props.calculateProjection(arr, "filter", true)
  }


  render() {
    let {
      hover_index,
      settings,
      barData,
    } = this.props;

    const slidersSettings = settings['sliders'];
    const SliderList = slidersSettings.map((slider) =>
    <Grid item>
      <RangeSlider
        ref={this.refSliders[slider['id']]}
        datafilter={this.state.datafilter[slider['id']]}
        title={slider['title']}
        id={slider['id']}
        info={slider['info']}
        typeNumber={slider['typeNumber']}
        color={slider['color']}
        onChangeSlider={this.changeSlider}
        hover_index={hover_index}
        barData={barData[slider['id']]}
        calculateProjection={this.props.calculateProjection}
        currentProjection={this.props.currentProjection}
        settings={settings}
        sliderID={slider['id']}
        metadata={this.props.metadata}
        />
      </Grid>
    )

    return (
      <Grid container style={{ marginLeft: "6px"}}>
        <Grid item >
        {SliderList}
        </Grid>
      </Grid>
    );
  }
}

export default Sliders
