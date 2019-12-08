import React from 'react';
import { withStyles } from '@material-ui/core/styles';

import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import ListItemText from '@material-ui/core/ListItemText';
import Select from '@material-ui/core/Select';

import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Checkbox from '@material-ui/core/Checkbox';
import Chip from '@material-ui/core/Chip';


const styles = theme => ({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  formControl: {
    //margin: theme.spacing.unit,
    minWidth: 50,
    //maxWidth: 300,
  },
  items: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  item: {
    //margin: theme.spacing.unit / 4,
    margin: 2, //theme.spacing.unit,
    height: 15,
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  chip: {
    //margin: theme.spacing.unit / 4,
    margin: 2, //theme.spacing.unit,
    height: 15,
  },
  noLabel: {
    //marginTop: theme.spacing.unit * 3,
  },
});

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;

export default withStyles(styles, { withTheme: true }) (class extends React.Component {
  state = {
    //selectedItems: [],
  }
  propTypes: {
    classes: propTypes.object.isRequired,
  }

  handleChange = (event, child) => {
    //this.setState({ selectedItems: event.target.value });
    //global.ddd("change event", event, child)
    if (this.props.hasOwnProperty("onUpdate")) this.props.onUpdate(event.target.value /*this.state.selectedItems*/);      // callback
  };

  handleClose = (event, child) => {
    //this.setState({ selectedItems: event.target.value });
    //global.ddd("change event", event, child)
    //if (this.props.hasOwnProperty("onUpdate")) this.props.onUpdate(event.target.value /*this.state.selectedItems*/);      // callback
    if (this.props.hasOwnProperty("onClose")) this.props.onClose(event.target.value /*this.state.selectedItems*/);      // callback
  };


  handleChangeMultiple = event => {
    const { options } = event.target;
    const value = [];
    for (let i = 0, l = options.length; i < l; i += 1) {
      if (options[i].selected) {
        value.push(options[i].value);
      }
    }
    this.setState({
      name: value,
    });
  };

  renderValue = (items) => {
   //return items.join(', '); // todo: sort
   //   {items.join(', ')}
   const list = this.props.multiple ? items : [items];
   return (
     <div className={this.props.classes.items}>
      {list.map(value => (
        <div className={this.props.classes.chip}
          key={value}
          label={value}
          color={this.props.color ? this.props.color : "primary"}
          variant="outlined"
        >{value}{this.props.multiple ? "," : ""}</div>
      ))}
     </div>
   )
  }

  renderChip = (items) => {
    const list = this.props.multiple ? items : [items];
    return (
      <div className={this.props.classes.chips}>
        {list.map(value => (
          <Chip className={this.props.classes.chip}
            key={value}
            label={value}
            color={this.props.color ? this.props.color : "primary"}
            variant="outlined"
          />
        ))}
      </div>
    )
  }

  render() {
    const { classes,
      value,
      defaultValue,
      style,
      IconComponent,
      menuRotate,
      menuBackground,
      menuWidth,
      isErrorCondition, noEmptyMenuEntry, showMenuTitleBar, menuTitleBarValue, onUpdate, onClose, id, chips, selectionList, multiple, label, helperText, autoWidth, ...otherprops} = this.props;
    let slist = ((multiple) ? selectionList : [""].concat(selectionList)) || ["none"];
    return (
      <FormControl {...otherprops} className={classes.formControl} style={style} error={(isErrorCondition) ? isErrorCondition(value) : false}>
        <InputLabel shrink htmlFor={id || "select-multiple"}>{label}</InputLabel>
        <Select
          multiple={multiple ? true : false}
          autoWidth
          defaultValue={defaultValue}
          value={value}
          onChange={this.handleChange}
          onClose={this.handleClose}
          input={<Input id={id || label} />}
          inputProps={{ }}
          renderValue={chips ? this.renderChip : this.renderValue}
          MenuProps={{
            PaperProps: {
              style: {
                maxHeight: ITEM_HEIGHT * 8.5 + ITEM_PADDING_TOP,
                width: menuWidth || '70%',
                transform: `rotate(${menuRotate})`,
                background: menuBackground,
                boxShadow: "15px 20px 15px gray",
              },
            },
          }}
          IconComponent={IconComponent}
        >
          {showMenuTitleBar && (<MenuItem value="none" disabled>{(menuTitleBarValue) ? showMenuTitleBar : label}</MenuItem>)}
          {slist.map(item => (item === "") ? (noEmptyMenuEntry) ? null
            : ( <MenuItem key={"emptyitm"+Math.random()} value=""><em> </em></MenuItem> )
            : ( // display emtpy element to select on "not multiple"
                <MenuItem key={"menuitm"+item+Math.random()} value={item}>
                  {(multiple && <Checkbox key={"chkbox"+Math.random()} checked={/*this.state.selectedItems.*/value.indexOf(item) > -1} />)}
                  <ListItemText key={"listitm"+Math.random()} primary={item} />
                </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  }
});
