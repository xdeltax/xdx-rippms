import React from 'react';
import { observer }  from 'mobx-react';

//import AppLogo from 'assets/applogo.svg';

import rxdbStore from 'rxdbStore'; // rxdb-database

export default ( observer( class extends React.Component {

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
      const res = await rxdbStore.user.doAuthLogout();
      global.log("RouteLogout:: logout:: result:: ", res)
    } catch (error) {
      global.log("RouteLogout:: logout:: ERROR:: ", error)
    } finally {
      // redirect router to "/"
      history && history.push('/');
    }
  }
}));
