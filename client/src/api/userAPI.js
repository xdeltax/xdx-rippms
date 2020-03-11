//import store from "store";
import socketio from 'api/socket'; // socket

  // called by store.user.doAuthLogout();
  export const logoutUserFromServer = async (userid, servertoken) => {
    let res = null;
    let err = null;
    try {
      if (!userid || !servertoken) throw "no valid auth";
      const ioRoute = "auth/user/logout";
      const req = {
        targetuserid: userid,
        userid: userid,
        servertoken: servertoken,
      }

      res = await socketio.emitWithTimeout(ioRoute, req,);
      // res = { result: true / false, _callstats: {xxx}, }
    } catch (error) {
      err = error;
    } finally {
      global.log("userAPI:: logoutUserFromServer:: ", userid, err, res)
      return { err: err, res: res };
    }
  };

  export const sendPropToServer = async (prop, value, userid, servertoken) => {
		let res = null;
		let err = null;
		try {
      if (!userid || !servertoken) throw "no valid auth";
			const ioRoute = "auth/store/user/props/set";
			const req = {
				targetuserid: userid,
				userid: userid,
				servertoken: servertoken,
				prop: prop,
        value: value,
			};
    	res = await socketio.emitWithTimeout(ioRoute, req,);
      // res = { prop: prop, value: value, _callstats: {xxx}, }
		} catch (error) {
    	err = error;
		} finally {
			global.log("store.user:: sendPropToServer:: ", userid, err, res)
	  	return { err: err, res: res };
		}
  };










  export const getUserStoreFromServer = async (targetuserid, userid, servertoken) => {
  	if (!userid || !servertoken) return;

		let res = null;
		let err = null;
		try {
			const ioRoute = "auth/user/userstore/get";
			const req = {
				targetuserid: targetuserid,
				userid: userid,
				servertoken: servertoken,
			}
	  	//global.log("*** getUserStoreFromServer:: ", req, socketio.socketID)
    	res = await socketio.emitWithTimeout(ioRoute, req,);
      // res = { user: {xxx}, usercard: {xxx}, _callstats: {xxx}, }
      //global.log("***!!!!!!!!!!!!!! getUserStoreFromServer:: ", res, )
		} catch (error) {
    	err = error;
		} finally {
			global.log("store.user:: getUserStoreFromServer:: ", targetuserid, err, res)
	  	return { err: err, res: res };
		}
  };

/*
  const getUserFromServer = async (targetuserid) => {
    if (!this.userid || !this.servertoken) return;

    let res = null;
    let err = null;
    try {
      const ioRoute = "auth/store/user/get";
      const req = {
        targetuserid: targetuserid,
        userid: this.userid,
        servertoken: this.servertoken,
      }
      res = await socketio.emitWithTimeout(ioRoute, req,);
      // res = { user: {xxx}, _callstats: {xxx}, }
    } catch (error) {
      err = error;
    } finally {
      global.log("store.user:: getUserFromServer:: ", targetuserid, err, res)
      return { err: err, res: res };
    }
  };
*/

  export const updateOwnUserPropsToServer = async (newProps, userid, servertoken) => {
  	if (!userid || !servertoken) return;

		let res = null;
		let err = null;
		try {
			const ioRoute = "auth/store/user/update";
			const req = {
				targetuserid: userid,
				userid: userid,
				servertoken: servertoken,
				props: newProps,
			};
    	res = await socketio.emitWithTimeout(ioRoute, req,);
      // res = { user: {xxx}, _callstats: {xxx}, }
		} catch (error) {
    	err = error;
		} finally {
			global.log("store.user:: updateOwnUserPropsToServer:: ", userid, err, res)
	  	return { err: err, res: res };
		}
  };


  export const updateOwnUsercardPropsToServer = async (newProps, userid, servertoken) => {
  	if (!userid || !servertoken) return;

		let res = null;
		let err = null;
		try {
			const ioRoute = "auth/store/usercard/update";
			const req = {
				targetuserid: userid,
				userid: userid,
				servertoken: servertoken,
				props: newProps,
			};
    	res = await socketio.emitWithTimeout(ioRoute, req,);
      // res = { user: {xxx}, _callstats: {xxx}, }
		} catch (error) {
    	err = error;
		} finally {
			global.log("store.user:: updateOwnUserPropsToServer:: ", userid, err, res)
	  	return { err: err, res: res };
		}
  };
