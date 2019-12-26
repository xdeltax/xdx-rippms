import React from 'react';
import NewWindow from 'react-new-window';
import Button from '@material-ui/core/Button';

let timer; 

export default class OAuth extends React.Component {
  state = {
  	windowOpen: false,
    disabled: false,
  };

  constructor(props) {
  	super(props);

    const { socket, provider, onAuthSuccess, onAuthFailed, } = props;

    global.log("OAuth:: constructor:: provider:: ", provider, socket);

    const ioRoute = `clientapi.oauth.${provider}.io`;
    socket && socket.on(ioRoute, (err, res) => { // get reply with logindata from server (provider/callback) via socket
    	//global.log("oAuth:: incomming socket message:: ", socket.id, provider, err, res)
      if (this.state && this.state.windowOpen) {
	      this.closeWindow();
	      if (!err) {
	      	onAuthSuccess && onAuthSuccess(socket.id, provider, res);
	      } else {
					onAuthFailed && onAuthFailed(socket.id, provider, err);
	      }
	    }
    });
  }

  componentDidMount() {
  };

  openWindow = () => {
    const { server, provider, socket, onAuthFailed, onWindowOpen } = this.props;

    if (!this.state.disabled && server && provider && socket && socket.id) {
	    timer = setTimeout(() => {
	    	if (this.state.windowOpen) this.closeWindow();
				clearTimeout(timer);
	      onAuthFailed && onAuthFailed(socket.id, provider, "login attempt timed out");
	    }, 5000);			

      this.setState({windowOpen: true, });
      onWindowOpen && onWindowOpen(socket.id, )
    }
  };

  closeWindow = () => {
    const { socket, onWindowClose } = this.props;

  	this.setState({windowOpen: false, disabled: false, });
		clearTimeout(timer);
    onWindowClose && onWindowClose(socket.id, )
  };

  render() {
    const { server, buttonText, provider, uid, providerLogo, socket, fingerprint, onWindowBlocked, onAuthSuccess, onAuthFailed, onWindowOpen, onWindowClose, } = this.props;
    const { windowOpen, disabled, } = this.state;

    const _uid = (uid) ? uid : "";
    const fphash = (fingerprint && fingerprint.hash) ? fingerprint.hash : "";
    const socketid = (socket && socket.id) ? socket.id : "";

    const url = `${server}/${provider}.io?sid=${socketid}&fp=${fphash}&uid=${_uid}&username=1&password=1`;

    const width = window.innerWidth;
    const height= window.innerHeight;
    const left= (window.innerWidth / 2) - (width / 2);
    const top = (window.innerHeight / 2) - (height / 2);

    const windowFeatures = {width: width, height: height, center: true, toolbar: false, location: false, directories: false, status: false, menubar: false, scrollbars: false, resizable: false, copyhistory: false, };

    return (!fphash || !socketid) ? null : (
    	<React.Fragment>
    	 	{windowOpen && <NewWindow url={url} name={provider || "oAuthWindow"} features={windowFeatures} onUnload={ () => { this.closeWindow(); }} onBlock={onWindowBlocked} /> }
        <Button disabled={windowOpen} style={{ margin: 5, }} variant="outlined" color="primary" onClick={this.openWindow}>
          {providerLogo && <img width="25px" height="25px" src={providerLogo} alt="" style={{marginRight: 15,}} />}
          {buttonText}
        </Button>
      </React.Fragment>
    )
  };
};
