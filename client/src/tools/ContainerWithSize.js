import React from 'react';
import ReactDOM from "react-dom";
import { observer }  from 'mobx-react';

import { SizeMe } from "react-sizeme";

import Test from "./Test";

// messure dimensions and send to component
export default observer ( class extends React.Component { // GameContainerWithSize
  return (
    <SizeMe monitorHeight >
      { ({ size }) => {
        global.log("fff", size)
        return (!size || !size.height || size.height<=0)
        ? (<div style={{height: "100%"}} />)
        : (<Test style={{height: "100%"}} size={size} {...this.props} />)
      }}
    </SizeMe>
  );
});
