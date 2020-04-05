import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import MoreVertIcon from '@material-ui/icons/MoreVert';

const useStyles = makeStyles(theme => ({
  typography: {
    padding: theme.spacing(1),
    color: props => props.color,
  },
  paper: { // menu
  },
  list: { // menu-items

  },
}));

//const ITEM_HEIGHT = 48;

export default function LongMenu(props) {
  const classes = useStyles(props);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const {
    icon,
    headerLabel,
    menuItems,
    selectedItem,
    backgroundColorWindow,
    textColorWindow,
    menuWidth,
    maxHeight,
    onClick,
    ...otherProps
  } = props;

  const handleClick = event => { setAnchorEl(event.currentTarget) };

  const handleClose = (event, index, item) => {
    setAnchorEl(null);
    onClick && onClick(event, index, item);
  };

  return (
    <React.Fragment>
      <IconButton {...otherProps} aria-label="more" aria-controls="long-menu" aria-haspopup="true" onClick={handleClick} >
        {icon || <MoreVertIcon />}
      </IconButton>
      <Menu classes={{paper: classes.paper, list: classes.list, }}
        keepMounted
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={ (event) => handleClose(event, null, null) }
        anchorOrigin={{ vertical: 'top', horizontal: 'right', }}
        transformOrigin={{ vertical: 'top', horizontal: 'right',}}
        PaperProps={{
          style: {
            color: textColorWindow || "inherit",
            background: backgroundColorWindow || "rgba(255, 255, 255, 0.9)",
            maxHeight: maxHeight || null, // ITEM_HEIGHT * 4.5,
            width: menuWidth || 250,
          },
        }}
      >
        {headerLabel &&
          <MenuItem key="header" divider>
            {headerLabel}
          </MenuItem>
        }
        {menuItems && menuItems.map((itemLabel, index) => (
          <MenuItem key={index}
            selected={itemLabel === (selectedItem || "")}
            onClick={ (event) => handleClose(event, index, itemLabel)}
          >
            {itemLabel}
          </MenuItem>
        ))}
      </Menu>
    </React.Fragment>
  );
}
