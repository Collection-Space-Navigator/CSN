import React, { Component } from 'react'
import {useParams, useNavigate} from "react-router-dom";
import Layout from './Layout'
import * as _ from 'lodash'
import * as d3 from 'd3'
import color from 'color'
// import * as THREE from 'three'
import { CircularProgress } from "@material-ui/core";


function withRouter(Component) {
  return props => <Component {...props} params={useParams()} navigate={useNavigate()} />;
}

class Data extends Component {
  constructor(props) {
    super(props);
    this.state = {
      // tilesLoaded: 0,
      algorithm_options: null,
      dataset_options: null,
      dataset_dirs: null,
      embeddings_data: null,
      mappings: null,
      metadata:null,
      defaultDataset:null,
      algorithm_name:0
    };
  }

  scaleEmbeddings(embeddings) {
    let xs = embeddings.map(e => Math.abs(e[0]));
    let ys = embeddings.map(e => Math.abs(e[1]));
    let max_x = _.max(xs);
    let max_y = _.max(ys);
    let max = Math.max(max_x, max_y);
    let scale = d3
      .scaleLinear()
      .domain([-max, max])
      .range([-20, 20]);
    let scaled_embeddings = embeddings.map(e => [scale(e[0]), scale(e[1])]);
    return scaled_embeddings;
  }
  
  componentDidMount() {
    // Get parameters from URL and save to settings
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    this.setState({ selectedDataset: urlParams.get('dataset')});
    if(urlParams.get('projection')!==undefined) this.setState({algorithm_name:urlParams.get('projection')});
    // Load embeddings
    this.loadInit('datasets/datasets_config.json')
  }

  loadConfig(path){
    this.loadSettings(`datasets/${path}/config.json`);
    this.loadBarData(`datasets/${path}/barData.json`);
    this.loadMetadata(`datasets/${path}/metadata.json`);
  }
  
  prepareMappings(ID){
    let algorithm_options = [];
    for (let i in this.state.settings.embeddings) {
      console.log(this.state.settings.embeddings[i].name);
      algorithm_options[i] = this.state.settings.embeddings[i].name;
    }
    this.setState({ algorithm_options: algorithm_options });
  }

  loadDataset(ID){
    let mappings = [];
    const embeddings = this.state.settings.embeddings;
    for (let i in embeddings) {
      // console.log(embeddings[i].key);
      fetch(`${process.env.PUBLIC_URL}/datasets/${this.state.datasetDir}/${embeddings[i].file}`)
        .then(response => response.json())
        .then(embeddings_data => {
          let scaled_embeddings = embeddings_data;
          // this.scaleEmbeddings(embeddings_data);
          mappings[i] = scaled_embeddings;
        }
        )
        .then(() => {
          this.setState({ mappings: mappings, embeddings_data: mappings[0] })
        })
  }
}

  // loadTiles(){ 
  //   const tile_locations = [...Array(this.state.settings.sprite_number)].map(
  //     (n, i) => `${process.env.PUBLIC_URL}/datasets/${this.state.datasetDir}/tile_${i}.webp`
  //   )
  //   let loader = new THREE.TextureLoader();
  //   this.tiles = tile_locations.map(l => {
  //     let t = loader.load(l,
  //       function ( texture ) {
  //         this.setState({ tilesLoaded: this.state.tilesLoaded+1 });
  //       }.bind(this)
  //     )
  //     t.flipY = false
  //     t.magFilter = THREE.NearestFilter
  //     return t
  //   })    
  // }


  addToUrl(paramName,value){
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    urlParams.set(paramName, value);
    this.props.navigate("?"+urlParams.toString());
  }

  prepareDatasets(ID){
    let dataset_options = [];
    let dataset_dirs = [];
    for (let i in this.state.settings.embeddings) {
      console.log(this.state.settings.embeddings[i].name);
      dataset_options[i] = this.state.settings.embeddings[i].name;
      dataset_dirs[i] = this.state.settings.embeddings[i].directory;
    }
    this.setState({ dataset_options: dataset_options, dataset_dirs: dataset_dirs });
  }

  changeDataset(choice){
    this.addToUrl('dataset',choice);
    let k = this.state.dataset_options.indexOf(choice);
    let newDataset = this.state.dataset_dirs[k]
    this.setState({ 
      selectedDataset: choice, 
      datasetDir: newDataset,
      algorithm_options: null,
      embeddings_data: null,
      mappings: null,
      metadata: null
    });
    this.loadConfig(newDataset);
  }

  loadInit(file){
    fetch(`${process.env.PUBLIC_URL}/`+file)
      .then(response => response.json())
      .then(init =>{
        let dataset_options = [];
        let dataset_dirs = [];
        for (let i in init.data) {
          console.log(init.data[i].directory);
          dataset_options[i] = init.data[i].name;
          dataset_dirs[i] = init.data[i].directory;
        }
        this.setState({ dataset_options: dataset_options,dataset_dirs: dataset_dirs});
        // Select dataset folder from defined in URL parameters
        if(this.state.selectedDataset===null){
          this.setState({ selectedDataset: init.data[init.default].name,  datasetDir: init.data[init.default].directory});
          this.addToUrl('dataset',init.data[init.default].name);
        }else{
          let foundInitDataset = false;
          for (let i in init.data) {
            if(init.data[i].name===this.state.selectedDataset){
              this.setState({datasetDir: init.data[i].directory});
              foundInitDataset = true;
            } 
          }
          if(!foundInitDataset) this.setState({ selectedDataset: init.data[init.default].name,  datasetDir: init.data[init.default].directory});
        }
      }
      )
      .then(()=> 
      this.loadConfig(this.state.datasetDir))

  }

  loadSettings(file){
    fetch(`${process.env.PUBLIC_URL}/`+file)
      .then(response => response.json())
      .then(settings =>{
        // Convert colors from rgb(255,0,0) to array [1.0,0.0,0.0]
        try{
          const floatColorConvertedArr = settings.clusters.clusterColors.map(myColorFunction);
          function myColorFunction(value) {
            return [color(value).rgb().array()[0]/255,color(value).rgb().array()[1]/255,color(value).rgb().array()[2]/255];
          }
          settings.clusters.clusterColors = floatColorConvertedArr;
        }catch(error){}
        // Save settings to 
        this.setState({
          settings: settings
        });
      }
      )
      .then(() =>
      this.prepareMappings(0))
      .then(()=> 
      this.loadDataset(0))
      // .then(()=> 
      // this.loadTiles())
  }

  loadMetadata(file){
    fetch(`${process.env.PUBLIC_URL}/`+file)
      .then(response => response.json())
      .then(metadata =>
        this.setState({
          metadata: metadata,
        })
      )
  }

  loadBarData(file){
    fetch(`${process.env.PUBLIC_URL}/`+file)
      .then(response => response.json())
      .then(barData =>
        this.setState({
          barData: barData,
        })
      )
  }


  render() {
    return this.state.embeddings_data && this.state.metadata ? (

      <Layout
        {...this.state}
        addToUrl={this.addToUrl.bind(this)}
        algorithm_name={this.state.algorithm_name}
        algorithm_options={this.state.algorithm_options}
        dataset_options={this.state.dataset_options}
        dataset_dirs={this.state.dataset_dirs}
        changeDataset={this.changeDataset.bind(this)}
        selectedDataset={this.state.selectedDataset}
        datasetDir={this.state.datasetDir}
        // tiles={this.tiles}
      />

    ) : (
      <div className="loading" ><CircularProgress color="inherit"/><div>loading datasets... </div></div>
      
    )
  }
}

export default withRouter(Data)

