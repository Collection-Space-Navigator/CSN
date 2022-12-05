import React from "react";
import { Bar, defaults } from "react-chartjs-2";

class BarChart extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      // bgColor: this.props.color,
      isHovering: false,
      barSelected: null,
    }
    this.onLeave = this.onLeave.bind(this)
    // this.showHideUpdate = this.showHideUpdate.bind(this);
  }
  

  calculateHistogram(domain,normalize){
    // Calculate frequency of data (adapted for float numbers)
    let data = []
    for(let i=0;i<this.props.settings["total"];i++){
      if(this.props.currentProjection[i]===0){
        data.push(this.props.metadata[i][this.props.sliderID])
      }
    }
    var buckets = {};
    this.bucketsFinder = {};
    const bucketCount = 50;
    var stepSize;
    if(domain[0] < 0){stepSize = (Math.abs(domain[0]) + Math.abs(domain[1])) / bucketCount}
    else{stepSize = Math.abs((Math.abs(domain[0]) - Math.abs(domain[1])) / bucketCount)}
    // Console.log("stepSize", stepSize);
    for (let i = 0; i < bucketCount; i++) {
      buckets[i] = 0;
    }
    var targetBucket;
      for (var i = 0; i < data.length; i++) {
        if (data[i] === domain[1]){targetBucket = bucketCount-1}
        else {
          // console.log(data[i])
          targetBucket = ((data[i] - domain[0]) / stepSize) | 0
        }
        buckets[targetBucket] +=1;
        // if (typeNumber === "int")
        // this.bucketsFinder[parseInt(data[i])] = targetBucket;
        // else
        this.bucketsFinder[parseFloat(data[i]).toFixed(1)] = targetBucket;
      }
    var bucketList = Object.values(buckets)
    if (normalize === true){
      // Normalize data
      var ratio = Math.max.apply(Math, bucketList) / 50;
        for (i = 0; i < bucketList.length; i++) {
          bucketList[i] = Math.round(bucketList[i] / ratio);
        }
      }
    const barDataValues = [];
    for (let i = 0; i < bucketList.length; i++) {
      barDataValues.push(bucketList[i] || 0);
    }
    // console.log(barDataValues)
    return barDataValues;
  }


  hoverEffect(chartElement) {
    this.setState({isHovering: true});
    if (chartElement[0]) {
      var barID = chartElement[0].index;
      var arr = new Float32Array( this.props.settings["total"] ).fill(1);
      // var arr = !this.props.filterImageAr;
      var prevArr = this.props.currentProjection;
      // console.log(this.props.barData["selections"][barID]);?
      this.props.barData["selections"][barID].forEach(element => {
        // if (prevArr[element] === 1) {
          arr[element] = prevArr[element]
        // }
        // console.log(this.props.barData["selections"][barID])
      });
      this.props.calculateProjection(arr, null, false);
      this.setState({barSelected: barID});
    }
  }

  onLeave() { 
    // this.setState(() => ({isHovering: false}), () => console.log(this.state));
    this.setState({isHovering: false});
    this.props.calculateProjection(this.props.currentProjection, null, false)
  }

  // componentDidUpdate(prevProps) {
  //   if (this.props.currentProjection !== prevProps.currentProjection) {
  //     this.barDataIst = this.calculateFrequencyOfData(this.props.domain,this.props.datafilter,false);
  //   }
  // }


  render() {
    const { barData, domain, color, selected } = this.props;
    defaults.animation = false;
    var markerData = Array(50).fill(0);
    this.barDataSoll = barData.histogram;
    this.barDataIst = this.calculateHistogram(domain,false);
    const barDataCalc = {
      labels: this.barDataSoll.map((val, i) => i),
      datasets: [
        {
          label: "barDataIst",
          type: 'bar',
          barThickness: 5,
          normalized: true,
          order: 2,
          backgroundColor: this.state.isHovering ? "rgb(64, 64, 64)" : markerData.map((val, i) =>
            i === this.bucketsFinder[parseFloat(selected).toFixed(1)]
              ? "#f50057"
              : color
            ),
          hoverBackgroundColor: color,
          // backgroundColor: this.state.bgColor,

          // backgroundColor: this.barDataIst.map((val, i) =>
          // i === this.bucketsFinder[parseFloat(selected).toFixed(1)]
          //   ? "rgb(245, 0, 87)"
          //   : this.state.isHovering ? "rgb(64, 64, 64)" : color
          // ),
          data: this.barDataIst
          },

          {
            label: "barDataSoll",
            type: 'bar',
            barThickness: 5,
            normalized: true,
            order: 3,
            backgroundColor: markerData.map((val, i) =>
            i === this.bucketsFinder[parseFloat(selected).toFixed(1)]
              ? "#542032"
              : "rgb(64, 64, 64)"
            ),
            hoverBackgroundColor: "rgb(64, 64, 64)",

          //   backgroundColor: this.barDataIst.map((val, i) =>
          //   i === this.bucketsFinder[parseFloat(selected).toFixed(1)]
          //     ? "rgb(255, 153, 189)"
          //     : "rgb(64, 64, 64)"
          // ),
            // hoverBackgroundColor: "rgba(255,99,132,0.4)",
            data: this.barDataSoll
          }
      ]
    };

    // console.log("selected",this.bucketsFinder[parseFloat(selected).toFixed(1)] );
    const options = {
      responsive: true,
      // pointStyle: 'triangle',
      interaction: {
        mode: 'index',
        intersect: false
        },
      events: ['mouseleave', "mousemove", "mouseout", "click"], //, 'touchstart', 'touchmove'],
      hoverBackgroundColor: color,
      onClick: () => {
            this.setState({isHovering: !this.state.isHovering});
            this.props.calculateProjection(this.props.currentProjection, null, false)
      },
      onHover: (event, chartElement) => {
        if (event.type === "mousemove" && this.state.isHovering && this.state.barSelected !== chartElement[0].index) {
          this.setState({bgColor: "rgb(64, 64, 64)"});
          this.hoverEffect(chartElement)
          if (event.native.target.style.cursor !== 'ew-resize') {
            event.native.target.style.cursor = 'ew-resize';
          }
        } else if (!this.state.isHovering && event.native.target.style.cursor !== 'pointer') {
            event.native.target.style.cursor = 'pointer';
          }
      // if (this.state.isHovering){
      //   ReactTooltip.hide(this.fooRef)
      // }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: false
        }
      },
      scales: {
        x: {
          display: false,
          stacked: true,
          // position: 'bottom'
        },
        yAxes: {
          beginAtZero: true,
          display: false,
          // stacked: true,
          // ticks: {
          //   min: 100
          // }
        }
      }
    };


    return (
      <Bar data={barDataCalc} height={62} options={options} onMouseLeave={this.onLeave} />
      );
  }
}

export default React.memo(BarChart);
