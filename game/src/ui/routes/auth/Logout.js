import React from 'react';

import mobxStore from 'mobxStore'; // mobx-store (persistent, reactive)

//============================================================================//
import debuglog from "debug/consolelog"; const clog = debuglog("Logout.js");
//============================================================================//

export default class extends React.Component {
  componentDidMount = async () => {
    await this.logout();
  }

  render() {
    return (
      <div style={{height: "100%", }}>
        logging out. please wait ...
      </div>
    ) // of return
  } // of render

  logout = async () => {
    const { history, } = this.props;
    try {
      const res = await mobxStore.auth.doAuthLogout();
      clog("logout:: result:: ", res)
    } catch (error) {
      clog("logout:: ERROR:: ", error)
    } finally {
      // redirect router to "/"
      history && history.push('/');
    }
  }
};
