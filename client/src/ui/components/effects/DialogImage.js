import React from 'react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
//import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

//import ClickAwayListener from '@material-ui/core/ClickAwayListener';


export default class extends React.Component {
  state = {
    imageUrl: "",
  };

  handleClickOpen = () => {
    this.setState({ open: true });
  };

  handleClose = () => {
    //if (this.props.onClose) this.props.onClose(); else this.setState({ open: false });
  };

  handleClickAway = () => {
    this.handleClose();
  };

  componentDidUpdate(prevProps) {
    //  Typical usage (don't forget to compare props):
    //if (this.props.triggerOpen !== prevProps.triggerOpen) { }
  }

  render() {
    const { title, click0title, click1title, click2title, open, onClick, onBrowseCommand, onCloseCommand, ...otherProps } = this.props;
    //<ClickAwayListener onClickAway={this.handleClickAway}>

    //           TransitionComponent={Transition}
    //           keepMounted
    // onClose={ () => { onClose && onClose() } }

    return (
        <Dialog {...otherProps}
          open={open}
          onClose={ () => { (onCloseCommand) && onCloseCommand() }}
          aria-labelledby="alert-dialog-slide-title"
          aria-describedby="alert-dialog-slide-description"
        >
          <DialogTitle id="alert-dialog-slide-title">
            {title}
          </DialogTitle>
          <DialogContent>
            {this.props.children}
          </DialogContent>
          <DialogActions>
            {click0title &&
              <React.Fragment>
              <input type="file" accept="image/*" ref="uploadImage1" id="outlined-button-file12" multiple={false} style={{display: "none"}} onChange={ (e) => {
                  const files = e.target.files; // all selected files
                  // file[0]
                  //   lastModified: 1549754996121
                  //   lastModifiedDate: Sun Feb 10 2019 00:29:56 GMT+0100 (Mitteleuropäische Normalzeit) {}
                  //   name: "nopicture2-profilecard.svg"
                  //   size: 3408
                  //   type: "image/svg+xml"
                  //   webkitRelativePath: ""
                  //const value = e.target.value; // full path and filename
                  if (files && files.length > 0) { // this is no array !!! { files = { 0:file, length: 1}
                    const file = files[0]; // const file = this.refs.uploadImage1.files[0];
                    if (file.type.startsWith('image/') === true) { // global.ddd("YYY", file.type.startsWith('image/'))
                      const freader  = new FileReader();
                      freader.onloadend = () => {
                        this.setState({ imageUrl: freader.result });
                        (onBrowseCommand) && onBrowseCommand(click0title, freader.result); // result is in base64 format
                      }
                      if (file) { freader.readAsDataURL(file); this.setState({ imageUrl: freader.result }) } else { this.setState({ imageUrl: "" }) }
                    }
                  }
                }}
              />
              <label htmlFor="outlined-button-file12"><Button color={"primary"} component="span">{click0title || ""}</Button></label>
              </React.Fragment>
            }
            {click1title &&
            <Button color={click2title ? "secondary" : "primary"}
              onClick={ () => {
                (onCloseCommand) && onCloseCommand(click1title);
                (onClick) && onClick(click1title);
              }}
            >
              {click1title || "CANCEL"}
            </Button>
            }
            {click2title && click1title !== click2title &&
            <Button color="primary"
              onClick={ () => {
                (onCloseCommand) && onCloseCommand(click2title);
                (onClick) && onClick(click2title);
              }}
            >
              {click2title || "OK"}
            </Button>
            }
          </DialogActions>
        </Dialog>
    );
  }
}
//      </ClickAwayListener>
