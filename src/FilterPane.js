import React, { Component } from 'react'
import { Grid } from "@material-ui/core";
//import _ from "lodash";
import Filterbox from "./QueryFilter";
import "./react-filter-box.css";

class FilterPane extends Component {

  render() {
    let {
      metadata,
      settings,
    } = this.props

    return (
      <Grid container spacing={2}>
        <Filterbox 
          calculateProjection={this.props.calculateProjection}
          settings={settings}
          metadata={metadata}
          currentProjection={this.props.currentProjection}
          allFilter={this.props.allFilter}
        />
      </Grid>
    )
  }
}

export default React.memo(FilterPane)