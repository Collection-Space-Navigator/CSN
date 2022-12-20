import React, { Component } from 'react'
import { Grid } from "@material-ui/core";

class MappingsPane extends Component {
  constructor(props) {
    super(props)
    this.handleSelectAlgorithm = this.handleSelectAlgorithm.bind(this);
    this.handleSelectDataset = this.handleSelectDataset.bind(this);
  }

  handleSelectAlgorithm(e) {
    let v = e.target.value;
    this.props.selectAlgorithm(v);
  }

  handleSelectDataset(e) {
    let v = e.target.value;
    this.props.selectDataset(v);
  }

  render() {
    let {
      algorithm_options,
      algorithm_choice,
      dataset_options,
      selectedDataset,
      datasetInfo
    } = this.props;

    return (
      
      <Grid container spacing={1}>
          <Grid item xs={4}>
            Dataset:
          </Grid>
          <Grid item xs={8}>
            <select className="full-width"
              onChange={this.handleSelectDataset}
              value={selectedDataset}
            >
              {dataset_options.map((option, index) => (
              <option key={option} value={option}>
                  {option}
              </option>
              ))}
            </select>
          </Grid>

          <Grid item xs={4}>
            Projection:
          </Grid>
          <Grid item xs={8}>
            <select className="full-width"
              onChange={this.handleSelectAlgorithm}
              value={algorithm_options[algorithm_choice]}
            >
              {algorithm_options.map((option, index) => (
              <option key={option} value={option}>
                  {option}
              </option>
              ))}
            </select>
          </Grid>
          <Grid item xs={12}>
          <p className="info">{datasetInfo}</p>
          </Grid>
      </Grid>
    )
  }
}

export default React.memo(MappingsPane)