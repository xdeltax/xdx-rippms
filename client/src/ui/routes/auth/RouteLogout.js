import React from 'react';
import { observer }  from 'mobx-react';

//import AppLogo from 'assets/applogo.svg';

import store from 'store';

export default ( observer( class extends React.Component {

  componentDidMount = async () => {
    await this.logout();
  }

  render() {
    global.log("RouteLogout:: render:: ", this.props);
    return (
      <div style={{height: "100%", }}>
        please wait ...
      </div>
    ) // of return
  } // of render

  logout = async () => {
    const { history, } = this.props;
    try {
      const res = await store.user.logout();
      global.log("RouteLogout:: logout:: result:: ", res)
    } catch (error) {
      global.log("RouteLogout:: logout:: ERROR:: ", error)
    } finally {
      // redirect router to "/"
      history && history.push('/');
    }
  }
}));
