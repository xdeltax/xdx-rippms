import React from 'react';
import { observer } from 'mobx-react';
import { SizeMe } from "react-sizeme";

//import tryFallback from "tools/tryFallback";

import PixiGame from "game/pixi";

const GameContainer = observer(class GameContainer extends React.Component { //export default observer(class PhaserGameContainer extends React.Component {
  state = {
    lives: 3
  }

  constructor(props) {
    super(props);

    this._pixiDIV = null;
  }

  resize = () => {
    global.log("resize:: ", this.props.size.height, this._pixiDIV.clientHeight, this._pixiDIV.parentElement.clientHeight, this._pixiDIV.offsetParent.clientHeight, this.app.renderer.height, this.app.stage.height, this.app.view.offsetHeight, )
    //app.view.setAttribute('width', window.innerWidth.toString());
    //app.view.setAttribute('height', window.innerHeight.toString());
    //this.app.renderer.resize(this._pixiDIV.offsetParent.clientWidth, this._pixiDIV.offsetParent.clientHeight);
    this.app.renderer.resize(this.props.size.width, this.props.size.height);

    // update pixi-app sprite positions (center) on resize from react-component
    this.app.sprite1.position.set(this.app.view.offsetWidth / 2, this.app.view.offsetHeight / 2);
    this.app.shapeSprite.position.set(this.app.view.offsetWidth - 25, this.app.view.offsetHeight - 25);
    this.app.message.position.set(0, this.app.view.offsetHeight - 15);
  }

  PixiDIV = (element) => {
    const { store, rxdbStore, size } = this.props;

    // the element is the DOM object that we will use as container to add pixi stage(canvas)
    this._pixiDIV = element;

    //now we are adding the application to the DOM element which we got from the Ref.
    if (this._pixiDIV && this._pixiDIV.children.length <= 0) {
      // add mobx-store to react-component
      this.store = store; // reachable in game:: this.game.react.store...
      this.rxdbStore = rxdbStore; // reachable in game:: this.game.react.rxdbStore...

      this.app = new PixiGame(this, size); // this.app = new PIXI.Application(pixiConfig);

      this._pixiDIV.appendChild(this.app.view);      // Add the view to the DOM

      window.addEventListener('resize', this.resize);
    }
  };

  render() {
    const {
      store,
      size,
      style,
      gameVisible, // component is active
      ...restProps
    } = this.props;

    global.log("GameContainer:: render:: size:: ", size.width, size.height, this.props)

    return (
      <div style={style} {...restProps}>
        <div id="pixi" ref={this.PixiDIV} style={{ height: "100%" }} />
        <div style={{position: "absolute", top: 0, left: 0,}}>
          <div>
            test
          </div>
        </div>
      </div>
    )
  }
});

// messure dimensions and send to main-component
export default observer ( class /*GameContainerWithSize*/ extends React.Component {
  render() {
    return (
      <SizeMe monitorHeight>
        { ({ size }) => {
          // 1. step: ignore the first one or two render-rounds (with size = 0)
          // 2. step: render GameContainer (and create Phaser.Game) with final container-size
          return (!size || !size.height || size.height <= 0)
          ? (<div style={{height: "100%"}} />)
          : (<GameContainer style={{height: "100%"}} size={size} {...this.props} />)
        }}
      </SizeMe>
    );

  }
});
