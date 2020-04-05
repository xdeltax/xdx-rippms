import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Popover from '@material-ui/core/Popover';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';

import HelpOutlineICON from '@material-ui/icons/HelpOutline';

const useStyles = makeStyles(theme => ({
  typography: {
    padding: theme.spacing(1),
    color: props => props.color,
  },
  root: {

  },
  paper: {
    color: props => props.textColorWindow || "inherit",
    backgroundColor: props => props.backgroundColorWindow || "rgba(255, 255, 255, 0.9)",
  },
}));

export default function SimplePopover(props) {
  const classes = useStyles(props);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const {
    icon,
    noTypography,
    backgroundColorWindow,
    textColorWindow,
    children,
    onClose,
    ...otherProps
  } = props;

  const handleClick = event => { setAnchorEl(event.currentTarget) };

  const handleClose = (event) => {
    setAnchorEl(null);
    onClose && onClose();
  };

  return (
    <React.Fragment>
      <IconButton {...otherProps} onClick={handleClick} >
        { icon || <HelpOutlineICON />}
      </IconButton>
      <Popover classes={{root: classes.root, paper: classes.paper, }}
        anchorEl={anchorEl} style={{paper: {}}}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'center', horizontal: 'center', }}
        transformOrigin={{ vertical: 'top', horizontal: 'right', }}
      >
        {noTypography ? children || "Help" : <Typography className={classes.typography}>{children || "Help"}</Typography> }
      </Popover>
    </React.Fragment>
  );
}
