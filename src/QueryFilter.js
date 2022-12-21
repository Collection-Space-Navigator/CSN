import React, { Component } from 'react'
import  _ from "lodash";
import { Button, ButtonGroup } from "@material-ui/core";
import ReactFilterBox, {SimpleResultProcessing, GridDataAutoCompleteHandler} from "react-filter-box";
import "./filter-box.css";

//Extend this class to add your custom operator
class CustomAutoComplete extends GridDataAutoCompleteHandler {
    // Override this method to add new your operator
    needOperators(parsedCategory) {
        var result = super.needOperators(parsedCategory);
        return result.concat(["startsWith"]);
    }
}

class CustomResultProcessing extends SimpleResultProcessing {
    // Override this method to add your handler for startsWith operator
    filter(row, fieldOrLabel, operator, value){
        var field = this.tryToGetFieldCategory(fieldOrLabel);
        switch(operator){
            case "==": return row[field] === value;
            case "!=": return row[field] !== value;
            case "contains": return row[field].toLowerCase().indexOf(value.toLowerCase()) >=0;
            case "!contains": return row[field].toLowerCase().indexOf(value.toLowerCase()) <0;
            case "startsWith": return  _.startsWith(row[field].toLowerCase(), value.toLowerCase() ) ;
            default: return false;
        }
    }
}

class Filterbox extends Component {
    constructor(props) {
        super(props);
        this.state = {
            parseOK: true,
            query2: {}
        };
        this.applyFilter = this.applyFilter.bind(this);
        this.resetFilter = this.resetFilter.bind(this);
        this.options = this.props.settings.search;
        this.customAutoComplete = new CustomAutoComplete(this.props.metadata,this.options);
        // this.editorConfig = {
        //     direction: "rtl"
        // };
    }

    applyFilter() {
        var newData = new CustomResultProcessing(this.options).process(this.props.metadata, this.state.query2);
        var arr = new Float32Array(this.props.settings["total"]).fill(1);
        newData.forEach(element => {
            arr[element["index"]] = 0;
        });     
        this.props.calculateProjection(arr, "search", true);
    }

    resetFilter() {
        this.setState({ query: null, query2: '' });
        var arr = new Float32Array(this.props.settings["total"]).fill(0);
        this.props.calculateProjection(arr, "search", true);
    }

    //customer your rendering item in auto complete
    customRenderCompletionItem(self, data, pick) {
        var className = `hint-value cm-${data.type}`
        return <div className={className} >
                    <span style={{ fontWeight: "bold" }}>{data.value}</span>
                    <span style={{color:"gray", fontSize:10}}> [{data.type}] </span>
                </div>
    }

    onParseOk(expressions) {
        this.setState({ parseOK: false });
        this.setState({ query2: expressions });
        // this.applyFilter(expressions);
    }

    onParseError(expressions) {
        this.setState({ parseOK: true });
    }
    
    exportMetadata = () => {
        var filteredMetadata = [];
        for (let i = 0; i < this.props.metadata.length; i++) {
          if (this.props.currentProjection[i] === 0) {
            var obj = this.props.metadata[i];
            filteredMetadata.push(obj);
          }
        }
        this.setState(
          { filterDataToExportCSV: filteredMetadata },
          () => {
            document.getElementsByClassName('hidden')[0].click();
          }
        );
      };
      

    render() {
        return (
        <div className="main-container">
            <ReactFilterBox
                autoCompleteHandler = {this.customAutoComplete}
                customRenderCompletionItem = {this.customRenderCompletionItem.bind(this) }
                query={this.state.query}
                data={this.props.metadata}
                options={this.options}
                onParseOk={this.onParseOk.bind(this) }
                onParseError={this.onParseError.bind(this) }
                editorConfig={{ lineWrapping: true }}
            />

            <ButtonGroup variant="contained">
            <Button onClick={this.applyFilter}>apply</Button>
            <Button onClick={this.resetFilter}>reset</Button>
            </ButtonGroup>

        </div>
        )
    }
}

export default Filterbox