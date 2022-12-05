import React, { Component } from 'react'
import { Grid } from "@material-ui/core";
import Select from 'react-select'

class FilterSelect extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedOptions: [],
    };
    this.selectionOptions = this.props.choices;
    this.selectionOptions = this.selectionOptions.map(x => ({value: x, label: x}));
  }

  handleChange = (selections) => {
    var selections = selections.map(o => o.value);
    this.props.calculateProjection(this.props.filterID, selections, this.props.filterImageAr, true);
  }

  render() {

    const customStyles = {
      option: (provided, state) => ({
        ...provided,
        color: 'black',
        padding: 4,
      }),
      control: (provided) => ({
        ...provided,
        width: 270,  
        backgroundColor: '#2b2b2b',
        borderColor: '#adadad',
        color: 'black'
      }),
      input: (provided) => ({
        ...provided,
        color: 'white',
      }),
      menuPortal: (base) => ({ 
        ...base, 
        zIndex: 9999,
      })
    }

    return (
      <Grid container spacing={1}>
          <Grid item xs={12}>
              {this.props.filterName}:
              </Grid>
              <Grid item xs={12}>
              <Select 
                  value={this.state.selectedOption}
                  options={this.selectionOptions}
                  isMulti
                  isSearchable
                  onChange={this.handleChange}
                  placeholder="select or search"
                  styles={customStyles}
                  menuPlacement="bottom"
                  menuPosition="fixed"
              />
          </Grid>
      </Grid>
    );
  }
}

export default React.memo(FilterSelect);