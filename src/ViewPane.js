import React, { Component } from 'react'
import { Grid, Slider,Box } from "@material-ui/core";

class ViewPane extends Component {
  constructor(props) {
    super(props)
    this.state = {
      dimensions: {}
    }
  }

  render() {
    let {
      clusters
    } = this.props

    return (
      <Grid container spacing={1}>
          <Grid item xs={4}>
            clusters:
          </Grid>
          <Grid item xs={8}>
            <select onChange={this.props.handleChangeCluster}>
            <option key="0" value="0">-</option>
              {clusters['clusterList'].map((option, index) => (
              <option key={option} value={option}>
                  {option}
            </option>
              ))}
            </select> 
          </Grid>
          <Grid item xs={4}>
            size (out):
          </Grid>
          <Grid item xs={8}>
          <Box height={10}>
          <Slider
            size="small"
            defaultValue={this.props.scaleMin}
            min={3}
            max={60}
            onChange={this.props.handleChangeScale}
          />
          </Box>
          </Grid>
          <Grid item xs={4}>
          size (in):
          </Grid>
          <Grid item xs={8}>
          <Box height={10}>
          <Slider
            size="small"
            defaultValue={this.props.scaleMax}
            min={3}
            max={120}
            onChange={this.props.handleChangeZoom}
          />
          </Box>
          </Grid>
      </Grid>
    )
  }
}

export default React.memo(ViewPane)
