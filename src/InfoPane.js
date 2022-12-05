import React, { Component } from 'react'
import InfoFields from "./InfoFields";

class InfoPane extends Component {
  constructor(props) {
    super(props)
    this.state = {
      dimensions: {},
    };
  }

  render() {
    let {
      hover_index,
      infos,
      metadata,
    } = this.props;

    return (
      <InfoFields
      metadata={metadata}
      hover_index={hover_index}
      infos={infos}
      />
    )

  }
}

export default React.memo(InfoPane)
