import React from 'react';
import NewWindow from 'react-new-window';
import Button from '@material-ui/core/Button';

export default class OAuth extends React.Component {
  state = {
  	windowOpen: false,
    disabled: false,
  };

  componentDidMount() {
    const { socket, provider, onAuthSuccess } = this.props;
    
    socket && socket.on(provider, userdata => { // get reply with logindata from server (provider/callback) via socket
      if (this.state && this.state.windowOpen) this.closeWindow();
      onAuthSuccess && onAuthSuccess(socket.id, provider, userdata)
    });
  };

  clickStartAuthProcess = () => {
    const { server, provider, socket, onWindowOpen } = this.props;
    if (!this.state.disabled && server && provider && socket && socket.id) {
      this.setState({windowOpen: true, });
      onWindowOpen && onWindowOpen(socket.id, )
    }
  };

  closeWindow = () => {
    const { socket, onWindowClose } = this.props;
  	this.setState({windowOpen: false, disabled: false, });
    onWindowClose && onWindowClose(socket.id, )
  };

  render() {
    const { server, buttonText, provider, providerLogo, socket, onWindowBlocked, onAuthSuccess, onWindowOpen, onWindowClose, } = this.props;
    const { windowOpen, disabled, } = this.state;

    const url = `${server}/${provider}.io?socketid=${socket.id}`;
    const width = window.innerWidth;
    const height= window.innerHeight;
    //const left= (window.innerWidth / 2) - (width / 2);
    //const top = (window.innerHeight / 2) - (height / 2);
    const windowFeatures = {width: width, height: height, center: true, toolbar: false, location: false, directories: false, status: false, menubar: false, scrollbars: false, resizable: false, copyhistory: false, };
    return (
    	<React.Fragment>
    	 	{windowOpen && <NewWindow url={url} name={provider || "oAuthWindow"} features={windowFeatures} onUnload={ () => { this.closeWindow(); }} onBlock={onWindowBlocked} /> }
        <Button disabled={windowOpen} style={{ margin: 5, }} variant="outlined" color="primary" onClick={this.clickStartAuthProcess}>
          {providerLogo && <img width="25px" height="25px" src={providerLogo} alt="" style={{marginRight: 15,}} />}
          {buttonText} {provider}
        </Button>
      </React.Fragment>
    )
  };
};
