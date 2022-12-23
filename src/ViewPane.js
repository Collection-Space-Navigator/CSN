import React, { Component } from 'react'
import { Grid, Slider, Box, Checkbox } from "@material-ui/core";

class ViewPane extends Component {
  constructor(props) {
    super(props)
    this.state = {
      dimensions: {},
      checked: this.props.filterGrey
    }
  }

  handleChange = () => {
    this.setState(prevState => ({
      checked: !prevState.checked
    }));
    this.props.handleChangeGrey(this.state.checked ? 1 : 0);
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
                  {option.toLowerCase()}
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

          <Grid item xs={11}>
          show filtered-out items (slower):
          </Grid>
          <Grid item xs={1}>
            <input type="checkbox" 
            checked={this.state.checked} 
            onChange={this.handleChange}
            />
          </Grid>

      </Grid>
    )
  }
}

export default React.memo(ViewPane)
