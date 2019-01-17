import React, { Component } from 'react'

import MainPage from './components/MainPage.jsx'
import './App.scss'

class App extends Component {
  render () {
    return (
      <React.Fragment>
        <main>
          <MainPage />
        </main>
      </React.Fragment>
    )
  }
}

export default App
