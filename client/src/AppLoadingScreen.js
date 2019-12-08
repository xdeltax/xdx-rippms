import React from 'react';
import Typography from '@material-ui/core/Typography';

const AppLoadingScreen = () => { // defined in ./public/index.html <- className="first-screen" and src="./firstscreen.png"
  return (
    <div className="first-screen" style={{overflow: "hidden",}}>
        <img width="60%" src="./firstscreen.png" alt=" loading application ... " />
    </div>
  )
};

export default AppLoadingScreen;
