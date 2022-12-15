import React, { Component, Fragment } from 'react'
import { Grid } from "@material-ui/core";
import uuid from 'react-uuid';

class InfoFields extends Component {
    constructor(props) {
        super(props);
        this.state = {};
    }

    render() {
        let {
            metadata,
            hover_index,
            infos,
        } = this.props;

        const InfoList = infos.map((info) => 
            <Fragment>
                <Grid key={uuid()} item xs={4}>
                    {info}:
                </Grid>
                <Grid key={uuid()} item xs={8}>   
                    {metadata[hover_index][info]}
                </Grid>
            </Fragment>
        )

        return (
            <Grid key={uuid()} container justifyContent="space-between" spacing={1} wrap="wrap">    
                <Grid key={uuid()} item xs={12}>   
                    <b>{metadata[hover_index].Title}</b>
                </Grid>
                {InfoList}
            </Grid>
        );
    }
}

export default InfoFields