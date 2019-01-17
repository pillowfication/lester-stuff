import React, { Component } from 'react'
import classnames from 'classnames'

import network from '../../../network'
import nameMatches from '../../../name-matches'
const authors = Object.keys(network.authors).sort()

import zf from '../foundation.scss'
import styles from './MainPage.scss'

class Tester extends Component {
  constructor(props) {
    super(props)
    this.inputRef = React.createRef()
    this.state = { output: '' }
    this.onInputBlur = this.onInputBlur.bind(this)
  }

  onInputBlur () {
    const output = this.props.getOutput(this.inputRef.current.value)
    this.setState({ output: output ? JSON.stringify(output, null, 2) : 'undefined' })
  }

  render () {
    return (
      <div style={{ border: '1px solid gray', padding: '1rem', margin: '1rem' }}>
        <p>{this.props.desc}</p>
        <input type='text' ref={this.inputRef} onBlur={this.onInputBlur} />
        <br />
        <code><pre>{this.state.output}</pre></code>
      </div>
    )
  }
}

class Tester2 extends Component {
  constructor(props) {
    super(props)
    this.input1Ref = React.createRef()
    this.input2Ref = React.createRef()
    this.state = { output: '' }
    this.onInputBlur = this.onInputBlur.bind(this)
  }

  onInputBlur () {
    const output = this.props.getOutput(this.input1Ref.current.value, Number(this.input2Ref.current.value))
    this.setState({ output: output ? JSON.stringify(output, null, 2) : 'undefined' })
  }

  render () {
    return (
      <div style={{ border: '1px solid gray', padding: '1rem', margin: '1rem' }}>
        <p>{this.props.desc}</p>
        <input type='text' ref={this.input1Ref} onBlur={this.onInputBlur} />
        <input type='text' ref={this.input2Ref} onBlur={this.onInputBlur} defaultValue='5' />
        <br />
        <code><pre>{this.state.output}</pre></code>
      </div>
    )
  }
}

class MainPage extends Component {
  render () {
    return (
      <div className={zf.gridContainer}>
        <h1>network playground</h1>
        <Tester desc='Get author blob' getOutput={x => network.authors[x]} />
        <Tester desc='Get name matches by parsing' getOutput={x =>
          authors.filter(author => {
            try {
              return nameMatches(x, author)
            } catch (e) {
              return false
            }
          })
        } />
        <Tester desc='Get most similar name matches by Levenshtein distance' getOutput={x => network.suggest(x)} />
        <Tester2 desc='Get similar name matches within specified Levenshtein distance' getOutput={(x, y) => network.suggest1(x, y)} />
      </div>
    )
  }
}

export default MainPage
