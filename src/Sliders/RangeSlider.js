import React from "react";
import { Grid, TextField } from "@material-ui/core";
import { Slider, Rail, Handles, Tracks } from "react-compound-slider";
import { MuiRail, MuiHandle, MuiTrack } from "./components";
import BarChart from "./BarChart";


class RangeSlider extends React.Component {
  constructor(props) {
    super(props);
    let data = props.datafilter;//.filter(() => true);
    const range = [Math.min.apply(null, data),Math.max.apply(null, data)];
    this.state = {
      domain: range,
      update: range,
      values: range,
      inputValues: range,
      typeNumber: this.props.typeNumber,
      step:props.step,
      color:props.color,
      hover_index: this.props.hover_index,
      isToggleOn: false,
    };

    this.changeSlider = this.changeSlider.bind(this);
    this.currentValues = range;
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(e) {
    this.setState(prevState => ({
      isToggleOn: !prevState.isToggleOn
    }));
    e.stopPropagation();
  }

  changeSlider(values) {
    this.currentValues = values;
    this.props.onChangeSlider(this.props.title, values);
  }


  render() {
    const { domain, values, update, inputValues, color, typeNumber } = this.state;
    return (
      <Grid container>
        <Grid item xs={12}>
          <div style={{ height: "90px", width: "270px", marginTop: "12px"}}>
            <BarChart
              update={update}
              domain={domain}
              color={color}
              barData={this.props.barData}
              calculateProjection={this.props.calculateProjection}
              settings={this.props.settings}
              currentProjection={this.props.currentProjection}
              sliderID={this.props.sliderID}
              metadata={this.props.metadata}
              selected={this.props.metadata[this.props.hover_index][this.props.sliderID]}

            />
            
            <Slider
              mode={3}
              step={typeNumber === "int"?1:0.01}
              domain={domain}
              color={color}
              rootStyle={{
                position: "relative",
                width: "100%"
              }}
              onUpdate={(update) => {
                this.setState({ update, inputValues: update });
              }}
              onChange={(values) => {
                this.setState({ values });
                this.changeSlider(update);
              }}
              values={values}
            >
              <Rail>
                {({ getRailProps }) => <MuiRail getRailProps={getRailProps} />}
              </Rail>
              <Handles>
                {({ handles, getHandleProps }) => (
                  <div className="slider-handles">
                    {handles.map((handle) => (
                      <MuiHandle
                        key={handle.id}
                        handle={handle}
                        domain={domain}
                        getHandleProps={getHandleProps}
                      />
                    ))}
                  </div>
                )}
              </Handles>
              <Tracks left={false} right={false}>
                {({ tracks, getTrackProps }) => (
                  <div className="slider-tracks">
                    {tracks.map(({ id, source, target }) => (
                      <MuiTrack
                        key={id}
                        source={source}
                        target={target}
                        getTrackProps={getTrackProps}
                      />
                    ))}
                  </div>
                )}
              </Tracks>
            </Slider>
            <Grid
              container
              alignItems="center"
              justifyContent="space-around"
              // style={{ marginTop: "15px" }}
            >
              <Grid
                item
                xs={4}
                style={{
                textAlign: "right",
                border: "solid 1px white",
                height:"20px",
                marginLeft: 'auto',
                marginRight: 'auto',
                marginTop: 10,
                }}
              >
                <TextField

                  fullWidth
                  variant="outlined"
                  label=""
                  size="small"
                  value={inputValues[0]}
                  margin="none"
                  inputProps={{
                    style: {
                      color:"white",
                      padding: 0,
                      marginLeft: 2
                    }
                  }}
                  onChange={(evt) => {
                    const value = evt.target.value;
                    const newState = [value, inputValues[1]];
                    this.setState({ inputValues: newState });
                    if (value && value >= domain[0]) {
                      this.setState({ values: newState });
                    }
                  }}
                />
              </Grid>
              <Grid item xs={4} style={{ textAlign: "center",  marginTop:"6px"}}>
              <div className="tooltip">
              <button onClick={this.handleClick}>
                <a href="#"
                style={{
                  color: "#00cc55",
                  cursor: "help",
                  textSize:"8px"
                }}>
                  {this.state.isToggleOn ? "close" : this.props.title}
                </a>
            </button>
            {this.state.isToggleOn ? <span className="tooltiptext">{this.props.info}</span> : null}
                
              </div>
              </Grid>
              <Grid
                item
                xs={4}
                style={{
                textAlign: "right",
                border: "solid 1px white",
                height:"20px",
                marginLeft: 'auto',
                marginRight: 'auto',
                marginTop: 10,
                }}
              >
                <TextField
                  fullWidth
                  variant="outlined"
                  label=""
                  size="small"
                  value={inputValues[1]}
                  margin="none"
                  inputProps={{
                    style: {
                      color:"white",
                      padding: 0,
                      marginLeft: 2
                    }
                  }}
                  // style={{ paddingTop: "2px", paddingBottom: "8px",color: "white" }}
                  onChange={(evt) => {
                    const value = evt.target.value;
                    const newState = [inputValues[0], value];
                    this.setState({ inputValues: newState });
                    if (value && value <= domain[1] && value >= values[0]) {
                      this.setState({ values: newState });
                    }
                  }}
                />
              </Grid>
            </Grid>
          </div>
        </Grid>
      </Grid>
    );
  }
}

export default React.memo(RangeSlider);
