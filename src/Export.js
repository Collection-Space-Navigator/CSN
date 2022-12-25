
import React, { Component } from 'react'
import { Button } from "@material-ui/core";
import { CSVLink } from "react-csv";
import canvasToImage from 'canvas-to-image';


class Export extends Component {
    constructor(props) {
      super(props)
      this.state = {
        filterDataToExportCSV:[],
    }
    }

    makePNG = async () => {
        console.log('download projection area as png')
        canvasToImage(document.getElementById("threeCanvas"));
      }

  

render() {
    let {
        metadata,
        currentProjection
      } = this.props;

    return (
        <><div style={{ marginBottom: "12px" }}>
        <CSVLink 
            data={this.state.filterDataToExportCSV} 
            filename={"CSN_filtered_metadata.csv"} 
            target="_blank"
            onClick={() => {
            let filteredMetadata = [];
            for (let i=0;i<metadata.length;i++) {
                if(currentProjection[i]===0){
                var obj = metadata[i];
                filteredMetadata.push(obj)
                }
            }
            this.setState({filterDataToExportCSV: filteredMetadata});
            }}                
            >
            <Button variant="contained" fullWidth >Download metadata CSV</Button>
            </CSVLink>
            </div><div>
                <Button variant="contained" fullWidth onClick={this.makePNG}>Download projection PNG</Button>
            </div></>

    )


}
  
    // // Release memory of export filter metadata
    // if(this.state.filterDataToExportCSV.length>0) this.setState({filterDataToExportCSV: []});


}

export default React.memo(Export)

