import React, { Component }   from 'react'
import { Provider }           from 'react-redux'
import {
  Router
} from 'react-router'

export default class StatefulApp extends Component {
  render() {
    return <Provider store={this.props.store}>
      <Router routes={this.props.routes} history={this.props.history} />
    </Provider>
  }
}
