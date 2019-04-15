import React, { Component } from 'react';
import api from '../../services/api';
import { distanceInWords } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Dropzone from 'react-dropzone';
import socket from 'socket.io-client';

import { MdInsertDriveFile } from 'react-icons/md';

import logo from '../../assets/logo.svg';
import { Container } from './styles'

export default class Box extends Component {
  state = {
    box: {},
    lastRefresh: new Date(),
    displayRefresh: ''

  }

  async componentDidMount() {
    this.subscribeToNewFiles();
    this.lastUpdate();

    const box = this.props.match.params.id
    const response = await api.get(`boxes/${box}`);
    this.setState({ box: response.data })

    this.interval = setInterval(() => {
      this.lastUpdate();
    }, 5000)
  }

  lastUpdate = () => {
    let tempo = distanceInWords(this.state.lastRefresh, new Date(), {
      locale: pt,
      includeSeconds: true
    })
    this.setState({ displayRefresh: tempo })
  }

  subscribeToNewFiles = () => {
    const box = this.props.match.params.id;
    const io = socket('https://omnistack-backend-romulo.herokuapp.com');
    io.emit('connectRoom', box);
    io.on('file', data => {
      this.setState({ lastRefresh: new Date() })
      this.setState({ box: { ...this.state.box, files: [data, ...this.state.box.files] } })
    })

  }

  handleUpload = files => {
    files.forEach(file => {
      const data = new FormData();
      const box = this.props.match.params.id

      data.append('file', file);

      api.post(`boxes/${box}/files`, data)
    });
  }

  render() {
    return (
      <div>
        <p>última atualização: {this.state.displayRefresh}</p>
        <Container>
          <header>
            <img src={logo} alt='logo' />
            <h1>{this.state.box.title}</h1>
          </header>
          <Dropzone onDropAccepted={this.handleUpload}>
            {({ getRootProps, getInputProps }) => (
              <div className="upload" {...getRootProps()}>
                <input {...getInputProps()} />
                <p>Arraste arquivos ou clique aqui</p>
              </div>
            )}
          </Dropzone>

          <ul>
            {
              this.state.box.files && this.state.box.files.map(file => (
                <li key={file._id}>
                  <a className="fileInfo" href={file.url}>
                    <MdInsertDriveFile size={24} color="#A5CFFF" />
                    <strong>{file.title}</strong>
                  </a>
                  <span>há{" "} {distanceInWords(file.createdAt, new Date(), {
                    locale: pt,
                    includeSeconds: true
                  })}</span>
                </li>
              ))
            }
          </ul>
        </Container >
      </div>
    );
  }
}
