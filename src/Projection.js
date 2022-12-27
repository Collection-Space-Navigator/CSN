import React, { Component } from 'react'
import * as THREE from 'three'
import * as _ from 'lodash'
import * as d3 from 'd3'
import * as TWEEN from '@tweenjs/tween.js'
import { CircularProgress } from "@material-ui/core";

class Projection extends Component {
  constructor(props) {
    super(props)
    this.loadTiles()
    this.state = {
      tilesLoaded: 0,
      view: null
    }
    this.init = this.init.bind(this)
    this.pointsAr = []
    this.addPoints = this.addPoints.bind(this)
    this.handleResize = this.handleResize.bind(this)
    this.setupCamera = this.setupCamera.bind(this)
    this.animate = this.animate.bind(this)
    this.getScaleFromZ = this.getScaleFromZ.bind(this)
    this.getZFromScale = this.getZFromScale.bind(this)
    this.changeEmbeddings = this.changeEmbeddings.bind(this)
  }


  loadTiles(){ 
    this.sprite_size = this.props.settings.sprite_side * this.props.settings.sprite_side
    this.tile_locations = [...Array(this.props.settings.sprite_number)].map(
      (n, i) => `${process.env.PUBLIC_URL}/datasets/${this.props.datasetDir}/tile_${i}.png`
    )  
    this.datasetIMG = this.tile_locations.map(src => {
      let img = document.createElement('img')
      img.src = src
      return img
    })
  }


  //changeEmbeddings(prev_choice, new_choice) {
  changeEmbeddings(new_choice) {
    let ranges = []
    for (let i = 0; i < this.props.settings.sprite_number; i++) {
      let start = i * this.sprite_size
      let end = (i + 1) * this.sprite_size
      if (i === this.props.settings.sprite_number - 1) end = this.props.settings.sprite_number * this.sprite_size
      ranges.push([start, end])
    }

    let embedding_chunks = ranges.map(range =>
      this.props.mappings[new_choice].slice(
        range[0],
        range[1]
      )
    )

    for (let c = 0; c < this.props.settings.sprite_number; c++) {
      let echunk = embedding_chunks[c]

      let points = this.scene.children[0].children[c]
      let numVertices = echunk.length

      let position = points.geometry.attributes.position.array
      let target = new Float32Array(numVertices * 3)
      for (let i = 0, index = 0, l = numVertices; i < l; i++, index += 3) {
        let x = echunk[i][0]
        let y = echunk[i][1]
        let z = 0
        target[index] = x
        target[index + 1] = y
        target[index + 2] = z
      }

      let tween = new TWEEN.Tween(position)
        .to(target, 1000)
        .easing(TWEEN.Easing.Linear.None)
      tween.onUpdate(function() {
        points.geometry.attributes.position = new THREE.BufferAttribute(
          position,
          3
        )
        points.geometry.attributes.position.needsUpdate = true // required after the first render
      })
      tween.start();
    }
  }

  zoomScaler(input) {
    let scaleProj = d3
    .scaleLinear()
    .domain([20,0])
    .range([this.props.scaleMin, this.props.scaleMax])
    .clamp(true);
    return scaleProj(input);
  }

  getZFromScale(scale) {
    let rvFOV = THREE.Math.degToRad(this.camera.fov);
    let scale_height = this.props.height / scale;
    let camera_z_position = scale_height / (2 * Math.tan(rvFOV / 2));
    return camera_z_position;
  }

  getScaleFromZ(camera_z_position) {
    let rvFOV = THREE.Math.degToRad(this.camera.fov);
    let half_fov_height = Math.tan(rvFOV / 2) * camera_z_position;
    let fov_height = half_fov_height * 2;
    let scale = this.props.height / fov_height;
    return scale;
  }

  handleResize = (width, height) => {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    let current_scale = this.getScaleFromZ(this.camera.position.z);
    let d3_x = -(this.camera.position.x * current_scale) + this.props.width / 2;
    let d3_y = this.camera.position.y * current_scale + this.props.height / 2;
    var resize_transform = d3.zoomIdentity
      .translate(d3_x, d3_y)
      .scale(current_scale);
    let view = d3.select(this.mount);
    this.d3_zoom.transform(view, resize_transform);
  }

  zoomHandler() {
    let d3_transform = d3.event.transform;
    let scale = d3_transform.k;
    let x = -(d3_transform.x - this.props.width / 2) / scale;
    let y = (d3_transform.y - this.props.height / 2) / scale;
    let z = this.getZFromScale(scale);
    this.camera.position.set(x, y, z);
    // point size scales at end of zoom
    let new_size = this.zoomScaler(z);
    let point_group = this.scene.children[0].children;
    for (let c = 0; c < point_group.length; c++) {
      point_group[c].material.uniforms.size.value = new_size;
    }
  }

  setupCamera() {
    let { width, height, embeddings_data } = this.props

    let vFOV = this.camera.fov
    let rvFOV = THREE.Math.degToRad(vFOV)

    let xs = embeddings_data.map(e => e[0])
    let min_x = _.min(xs)
    let max_x = _.max(xs)
    let ys = embeddings_data.map(e => e[1])
    let min_y = _.min(ys)
    let max_y = _.max(ys)

    let max_x_from_center = _.max([min_x, max_x].map(m => Math.abs(m)))
    let max_y_from_center = _.max([min_y, max_y].map(m => Math.abs(m)))

    let max_center = Math.max(max_x_from_center, max_y_from_center)

    let camera_z_start
    // if (data_aspect > aspect) {
    //   // console.log("width is limiter");
    //   // camera_z_start = max_x_from_center / Math.tan(rvFOV / 2) / aspect
    // } else {
    //   // console.log("height is limiter");
    //   // camera_z_start = max_y_from_center / Math.tan(rvFOV / 2)
    // }

    camera_z_start = max_center / Math.tan(rvFOV / 2)

    let far = camera_z_start * 1.25
    this.camera.far = far
    this.camera.position.z = camera_z_start * 1.1

    // set up zoom
    this.d3_zoom = d3
      .zoom()
      .scaleExtent([this.getScaleFromZ(far - 1), this.getScaleFromZ(0.1)])
      .on('zoom', this.zoomHandler.bind(this))

    let view = d3.select(this.mount)
    this.view = view
    view.call(this.d3_zoom)
    let initial_scale = this.getScaleFromZ(this.camera.position.z)
    var initial_transform = d3.zoomIdentity
      .translate(width / 2, height / 2)
      .scale(initial_scale)
    this.d3_zoom.transform(view, initial_transform)
    this.setState({ view: view })
  }

  addPoints() {
    let { embeddings_data,metadata } = this.props;

    // split embeddings and labels into chunks to match sprites
    let ranges = [];
    for (let i = 0; i < this.props.settings.sprite_number; i++) {
      let start = i * this.sprite_size;
      let end = (i + 1) * this.sprite_size;
      if (i === this.props.settings.sprite_number - 1) end = this.props.settings.sprite_number * this.sprite_size;
      ranges.push([start, end]);
    }
    let embedding_chunks = ranges.map(range =>
      embeddings_data.slice(range[0], range[1])
    );

    // load the textures
    let loader = new THREE.TextureLoader();
    this.textures = this.tile_locations.map(l => {
      let t = loader.load(l,
        function ( w ) {
          this.setState({ tilesLoaded: this.state.tilesLoaded+1 });
        }.bind(this)
      )
      t.flipY = false
      t.magFilter = THREE.NearestFilter
      return t
    })  
    let geometry;
    let point_group = new THREE.Group();
    for (let c = 0; c < this.props.settings.sprite_number; c++) {
      let echunk = embedding_chunks[c];
      //let lchunk = label_chunks[c]

      let vertices = [];
      for (let v = 0; v < echunk.length; v++) {
        let embedding = echunk[v];
        let vert = new THREE.Vector3(embedding[0], embedding[1], 0);
        vertices[v] = vert;
      }

      geometry = new THREE.BufferGeometry();

      let numVertices = vertices.length;
      console.log("numVertices -->",numVertices)
      let positionAr = new Float32Array(numVertices * 3);
      let offsetAr = new Float32Array(numVertices * 2);
      let clusterAr = new Float32Array(numVertices * 3);
      let filterAr = new Float32Array(numVertices );
      //let clustersActive = new Float32Array(numVertices );
      geometry.addAttribute('position', new THREE.BufferAttribute(positionAr, 3));
      geometry.addAttribute('offset', new THREE.BufferAttribute(offsetAr, 2));
      geometry.addAttribute('filter', new THREE.BufferAttribute(filterAr, 1));
      geometry.addAttribute('cluster', new THREE.BufferAttribute(clusterAr, 3));
      //geometry.addAttribute('clusterActive', new THREE.BufferAttribute(clustersActive, 1));

      for (let i = 0, index = 0, l = numVertices; i < l; i++, index += 3) {
        let x = echunk[i][0];
        let y = echunk[i][1];
        let z = 0;
        positionAr[index] = x;
        positionAr[index + 1] = y;
        positionAr[index + 2] = z;
      }

      // geometry.attributes.position.copyVector3sArray(vertices)

      let texture_subsize = 1 / this.props.settings.sprite_side;

      for (let i = 0, index = 0, l = numVertices; i < l; i++, index += 2) {
        let x = ((i % this.props.settings.sprite_side) * this.props.settings.sprite_image_size) / this.props.settings.sprite_actual_size
        let y =
          (Math.floor(i / this.props.settings.sprite_side) * this.props.settings.sprite_image_size) / this.props.settings.sprite_actual_size
        offsetAr[index] = x;
        offsetAr[index + 1] = y;
      }
      if (this.props.settings.clusters.clusterList) {
        // Todo: connect cluster the array
        let clusterSelected = this.props.clusterTypeSelected;
        let clusterColors = this.props.settings.clusters.clusterColors;
        console.log("clusterSelected",clusterSelected)
        for (let i = 0, index = 0, l = numVertices; i < l; i++, index += 1) {
          // Images disable when are not visible
          filterAr[index] = 0.0;// default value to show all images

          // Clusters visualization

          if( clusterSelected !== "-" && this.props.settings.clusters.clusterList.includes(clusterSelected) ){ 
              let clusterId = metadata[index][clusterSelected];
              if(clusterId >= clusterColors.length){
                clusterAr[index*3] = 1.0;
                clusterAr[index*3 + 1] = 1.0;
                clusterAr[index*3 + 2] = 1.0;
              }else{
                clusterAr[index*3] = clusterColors[clusterId][0];
                clusterAr[index*3 + 1] = clusterColors[clusterId][1];
                clusterAr[index*3 + 2] = clusterColors[clusterId][2];
              }
          }
      }
    }
      // uniforms
      let uniforms = {
        texture: { value: this.textures[c] },
        repeat: { value: new THREE.Vector2(texture_subsize, texture_subsize) },
        size: { value: this.props.settings.sprite_image_size },
        greyTransparency:{ value:0.1},
        imageTransparency:{ value:1.0},
        clusterActive:{ value:0.0}
      };

      let vertex_shader = `
        attribute vec2 offset;
        varying vec2 vOffset;
        attribute vec3 cluster;
        varying vec3 vCluster;
        attribute float filteredActive;
        varying float vFilteredActive;
        uniform float clusterActive;
        varying float vClusterActive;
        uniform float size;
        uniform float greyTransparency;
        varying float vGreyTransparency;
        uniform float imageTransparency;
        varying float vImageTransparency;

        void main() {
          vOffset = offset;
          vFilteredActive = filteredActive;
          vCluster = cluster;
          vClusterActive = clusterActive;
          vGreyTransparency = greyTransparency;
          vImageTransparency = imageTransparency;
          gl_PointSize = size;
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }`;

      let fragment_shader = `
        uniform sampler2D texture;
        uniform vec2 repeat;
        varying vec2 vOffset;
        varying vec3 vCluster;
        varying float vClusterActive;
        varying float vFilteredActive;
        varying float vGreyTransparency;
        varying float vImageTransparency;
        void main() {
          vec2 uv = vec2( gl_PointCoord.x, gl_PointCoord.y );
          vec4 tex = texture2D( texture, uv * repeat + vOffset );
          // make transparent images
          if ( tex.a < 0.003 ) discard;

          // Display clusters
          vec4 replace_color = vec4(vCluster,1.0);
          vec4 default_border_color = vec4(0.00392156863,0.00392156863,0.00392156863,0.00392156863);
          vec4 diff = tex - default_border_color;
          float equality = float(dot(diff,diff) < 0.99 && vClusterActive > 0.9);
          tex = mix( tex, replace_color, equality);
           
          // make transparent images
          tex = mix( tex,  vec4(0.0,0.0,0.0,0.0), vImageTransparency);

          // Grey images filter our selection 
          vec4 filterout_color = vec4(0.3,0.3,0.3,vGreyTransparency);
          float filterout_equality = float(vFilteredActive > 0.9);
          tex = mix( tex, filterout_color, filterout_equality );
          gl_FragColor = tex; //* vec4(vColor, 1.0);
        }`;

      // material
      let material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vertex_shader,
        fragmentShader: fragment_shader,
        transparent: true
      });

      // point cloud
      let point_cloud = new THREE.Points(geometry, material);
      point_cloud.userData = { sprite_index: c };
      this.pointsAr.push(point_cloud);
      // console.log("new points")
      point_group.add(point_cloud);
    }
    this.scene.add(point_group);
  }

  addBlankHighlightPoints() {
    let hover_container = new THREE.Group();
    this.scene.add(hover_container);

    let vert = new THREE.Vector3(0, 0, 0);
    let vertices = [vert];
    let geometry = new THREE.BufferGeometry();
    let numVertices = vertices.length;
    var positionAr = new Float32Array(numVertices * 3); // 3 coordinates per point
    var offsetAr = new Float32Array(numVertices * 2); // 2 coordinates per point
    geometry.addAttribute('position', new THREE.BufferAttribute(positionAr, 3));
    geometry.addAttribute('offset', new THREE.BufferAttribute(offsetAr, 2));

    // all the attributes will be filled on hover
    let texture_subsize = 1 / this.props.settings.sprite_side;

    // uniforms
    let uniforms = {
      texture: { value: this.textures[0] },
      repeat: { value: new THREE.Vector2(texture_subsize, texture_subsize) },
      size: { value: 84.0 }, //56
    };

    let vertex_shader = `
        attribute vec2 offset;
        varying vec2 vOffset;
        uniform float size;
        void main() {
          vOffset = offset;
          gl_PointSize = size;
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }`;

    let fragment_shader = `
        uniform sampler2D texture;
        uniform vec2 repeat;
        varying vec2 vOffset;
        void main() {
          vec2 uv = vec2( gl_PointCoord.x, gl_PointCoord.y );
          vec4 tex = texture2D( texture, uv * repeat + vOffset );
          gl_FragColor = tex;
        }`;

    // material
    var material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vertex_shader,
      fragmentShader: fragment_shader,
      transparent: true,
    });

    let point = new THREE.Points(geometry, material);
    point.frustumCulled = false;

    this.scene.children[1].visible = false;
    this.scene.children[1].add(point);
  }

  // filter images - update color of images to get inactive (grey) or active images
  updateProjection=(ar)=>{
    this.filterAr = ar;
    let ranges = [];
    let ar_sliced = [];
    for (let i = 0; i < this.props.settings.sprite_number; i++) {
      let start = i * this.sprite_size;
      let end = (i + 1) * this.sprite_size;
      if (i === this.props.settings.sprite_number - 1) end = this.props.settings.sprite_number * this.sprite_size;
      ranges.push([start, end]);
      ar_sliced.push(ar.slice(start, end));
    }
    // 
    for (let c = 0; c < this.props.settings.sprite_number; c++) {
      let points = this.scene.children[0].children[c];
      points.geometry.attributes.filteredActive = new THREE.BufferAttribute(
        ar_sliced[c],
        1
      );
      points.geometry.attributes.filteredActive.needsUpdate = true;
    }
    // let point = this.scene.children[0].children[0]
    // console.log(point.geometry);
  }

  updatePass2Shader=(num)=>{
    for (let c = 0; c < this.props.settings.sprite_number; c++) {
      let points = this.scene.children[0].children[c];
      if(num===1){
        points.material.uniforms.greyTransparency.value = 0.1;
        points.material.uniforms.greyTransparency.needsUpdate = true;
        points.material.uniforms.imageTransparency.value = 1.0;
        points.material.uniforms.imageTransparency.needsUpdate = true;
      }
      if(num===2){
        points.material.uniforms.greyTransparency.value = 0.0;
        points.material.uniforms.greyTransparency.needsUpdate = true;
        points.material.uniforms.imageTransparency.value = 0.0;
        points.material.uniforms.imageTransparency.needsUpdate = true;
      }
    }
  }

  updateClusterColors=(clusterSelected)=>{
    console.log('updateClusterColors',clusterSelected);
    
    let numVertices =  this.props.metadata.length;//this.props.settings.sprite_number * this.sprite_size;
    console.log("clusterSelected:",clusterSelected, "numVertices Update -->",numVertices, ' metadata.length:', this.props.metadata.length)
    let clusters = new Float32Array(numVertices * 3);
    //let clustersActive = new Float32Array(numVertices );
    let clusterColors = this.props.settings.clusters.clusterColors;
    console.log(numVertices,clusterSelected !=="-",this.props.settings.total,clusterColors);
    
    let ranges = [];
    // let clustersActiveAr_sliced = [];
    let clustersAr_sliced = [];

    if( clusterSelected !=="disabled" ){
      for (let i = 0, index = 0, l = numVertices; i < l; i++, index += 1) {
          let clusterId = this.props.metadata[index][clusterSelected];
          if(clusterId>=clusterColors.length){
            clusters[index*3] = 1.0;
            clusters[index*3 + 1] = 1.0;
            clusters[index*3 + 2] = 1.0;
          }else{
            clusters[index*3] = clusterColors[clusterId][0];
            clusters[index*3 + 1] = clusterColors[clusterId][1];
            clusters[index*3 + 2] = clusterColors[clusterId][2];
          }
      }

      for (let i = 0; i < this.props.settings.sprite_number; i++) {
        let start = i * this.sprite_size;
        let end = (i + 1) * this.sprite_size;
        if (i === this.props.settings.sprite_number - 1) end = this.props.settings.sprite_number * this.sprite_size;
        ranges.push([start, end]);
        clustersAr_sliced.push(clusters.slice(start*3, end*3));
      }
    }
    
    for (let c = 0; c < this.props.settings.sprite_number; c++) {
      let points = this.scene.children[0].children[c];
      if( clusterSelected !=="disabled" ){
        points.geometry.attributes.cluster = new THREE.BufferAttribute(
          clustersAr_sliced[c],
          3
        );
        points.geometry.attributes.cluster.needsUpdate = true;
        
        points.material.uniforms.clusterActive.value = 1.0;
        points.material.uniforms.clusterActive.needsUpdate = true;
      }else{
        points.material.uniforms.clusterActive.value = 0.0;
        points.material.uniforms.clusterActive.needsUpdate = true;
      }
    }


  }

  highlightPoint(sprite_index, digit_index, full_index) {    
    let { algorithm_choice, mappings } = this.props;

    let point = this.scene.children[1].children[0];

    // console.log(mappings[algorithm_choice][full_index]);
    let embedding = mappings[algorithm_choice][full_index];

    let vert = new THREE.Vector3(embedding[0], embedding[1], 0);
    let vertices = [vert];

    var offsets = new Float32Array(2); // 2 coordinates per point

    let x = ((digit_index % this.props.settings.sprite_side) * this.props.settings.sprite_image_size) / 2048;
    let y = (Math.floor(digit_index / this.props.settings.sprite_side) * this.props.settings.sprite_image_size) / 2048;
    offsets[0] = x;
    offsets[1] = y;

    point.geometry.attributes.position.copyVector3sArray(vertices);
    point.geometry.attributes.position.needsUpdate = true; // required after the first render
    point.geometry.attributes.offset.array = offsets;
    point.geometry.attributes.offset.needsUpdate = true; // required after the first render

    // need to set attributes on geometry and uniforms on material
    point.material.uniforms.texture.value = this.textures[sprite_index];
  }

  removeHighlights() {
    let highlight_container = this.scene.children[1];
    let highlights = highlight_container.children;
    highlight_container.remove(...highlights);
  }

  checkIntersects(mouse_position) {
    let { width, height, previewPane_ctx, previewPane_image_size } = this.props;

    function mouseToThree([mouseX, mouseY]) {
      return new THREE.Vector3(
        (mouseX / width) * 2 - 1,
        -(mouseY / height) * 2 + 1,
        1
      );
    }

    function sortIntersectsByDistanceToRay(intersects) {
      return _.sortBy(intersects, 'distanceToRay');
    }

    let mouse_vector = mouseToThree(mouse_position);
    this.raycaster.setFromCamera(mouse_vector, this.camera);
    this.raycaster.params.Points.threshold = 0.25;
    let intersects = this.raycaster.intersectObjects(
      this.scene.children[0].children
    );
    if (intersects[0]) {
      let sorted_intersects = sortIntersectsByDistanceToRay(intersects);
      let intersect = sorted_intersects[0];
      let sprite_index = intersect.object.userData.sprite_index;
      let digit_index = intersect.index;
      let full_index = sprite_index * this.sprite_size + digit_index;
      // if filter is null then allow selected all, then when filter is defined only allow visible image to be selected
      if( this.filterAr===undefined || this.filterAr[full_index]<1.0){
        this.props.setHoverIndex(full_index);
        // console.log(full_index)
        this.highlightPoint(sprite_index, digit_index, full_index);
        this.scene.children[1].visible = true;
        previewPane_ctx.clearRect(0, 0,  previewPane_image_size, previewPane_image_size);
        previewPane_ctx.fillRect(0, 0, previewPane_image_size, previewPane_image_size);
        previewPane_ctx.fillStyle = "transparent";
        try{
          previewPane_ctx.drawImage(
            this.datasetIMG[sprite_index],
            // source rectangle
            (digit_index % this.props.settings.sprite_side) * this.props.settings.sprite_image_size,
            Math.floor(digit_index / this.props.settings.sprite_side) * this.props.settings.sprite_image_size,
            this.props.settings.sprite_image_size,
            this.props.settings.sprite_image_size,
            // destination rectangle
            0,
            0,
            previewPane_image_size,
            previewPane_image_size
          );
        }catch (error){
          console.log("previewPane_ctx.drawImage",error);
        }
      }
    } else {
      this.props.setHoverIndex(null);
      this.scene.children[1].visible = false;
      previewPane_ctx.fillRect(0, 0, previewPane_image_size, previewPane_image_size);
      previewPane_ctx.fillStyle = "transparent";
    }
  }

  handleMouse() {
    let view = d3.select(this.renderer.domElement);
    this.raycaster = new THREE.Raycaster();

    view.on('mousemove', () => {
      let [mouseX, mouseY] = d3.mouse(view.node());
      let mouse_position = [mouseX, mouseY];
      this.checkIntersects(mouse_position);
    })
    
    view.on('dblclick', () => {
      if(this.scene.children[1].visible) this.props.clickOnImage();
    })
  }

  init() {
    let { width, height } = this.props;
    this.scene = new THREE.Scene();
    let vFOV = 75;
    let aspect = width / height;
    let near = 0.01;
    let far = 1000;

    this.camera = new THREE.PerspectiveCamera(vFOV, aspect, near, far);

    this.renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true });
    //this.renderer.setClearColor(0x111111, 1);
    this.renderer.autoClear = false;
    this.renderer.setSize(width, height);
    this.renderer.domElement.id = "threeCanvas";
    this.mount.appendChild(this.renderer.domElement);

    this.addPoints();
    this.addBlankHighlightPoints();
    this.setupCamera();
    this.animate();
    this.handleMouse();
    this.changeEmbeddings(this.props.algorithm_choice);
  }

  animate() {
    requestAnimationFrame(this.animate);
    TWEEN.update();
    this.renderer.clear()
    // 1-Pass :: Render filtered images (grey semi-transparent images that create a shadow behind)
    if(parseInt(this.props.greyRenderTypeSelected)===0){
      this.updatePass2Shader(1)
      this.renderer.render(this.scene, this.camera);
    }
    // 2-Pass - Render all images
    this.updatePass2Shader(2)
    this.renderer.render(this.scene, this.camera);
  }

  componentDidMount() {
    this.init();
  }

  componentDidUpdate(prevProps) {
    let { width, height } = this.props;
    if (width !== prevProps.width || height !== prevProps.height) {
      this.handleResize(width, height);
    }
    
    if (prevProps.algorithm_choice !== this.props.algorithm_choice) {
      this.changeEmbeddings(
        //prevProps.algorithm_choice,
        this.props.algorithm_choice,
      );
    }
    
    if (this.props.scaleMin !== prevProps.scaleMin || this.props.scaleMax !== prevProps.scaleMax){
      this.handleResize(width, height);
    }
  }

  componentWillUnmount() {
    this.mount.removeChild(this.renderer.domElement);
  }

  render() {
    let { width, height } = this.props;
    const tileProgress = this.state.tilesLoaded;
    const allTiles = this.props.settings.sprite_number;
    return (
      <><div>
        {tileProgress < 1 ? <div className="loading"><CircularProgress color="inherit"/><div>loading tiles...</div></div> : 
        tileProgress < allTiles-1 ? <div className="loading-small"><CircularProgress color="inherit"/><div>loading...</div></div> : 
        ''
      }
      </div><div
          style={{ width: width, height: height, overflow: 'hidden' }}
          ref={mount => {
            this.mount = mount
          } } /></>
    ) 
  }
}

export default React.memo(Projection)


